
-- ============================================================
-- 0019_knowledge_graph.sql — Knowledge Graph tables + graph_search
-- ============================================================
-- Adds KG-RAG: entities, entity mentions, relationships, and a
-- graph traversal function that serves as the third retrieval
-- signal alongside vector search and FTS.

-- ---------------------------------------------------------------------------
-- kg_entities — nodes in the knowledge graph
-- ---------------------------------------------------------------------------

create table public.kg_entities (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  entity_type  text        not null,
  aliases      text[]      not null default '{}',
  embedding    halfvec(3072),
  metadata     jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint kg_entities_type_check check (
    entity_type in (
      'HISTORIAN', 'EVENT', 'DATE', 'LOCATION',
      'CLAIM', 'SOURCE_REFERENCE', 'CONCEPT'
    )
  )
);

comment on table  public.kg_entities             is 'Knowledge graph entity nodes extracted from published documents.';
comment on column public.kg_entities.entity_type is 'HISTORIAN | EVENT | DATE | LOCATION | CLAIM | SOURCE_REFERENCE | CONCEPT';
comment on column public.kg_entities.aliases     is 'Alternative names/spellings for fuzzy matching during graph linking.';
comment on column public.kg_entities.embedding   is '3072-dim gemini-embedding-001 embedding of the entity name for similarity lookups.';

create trigger kg_entities_updated_at
  before update on public.kg_entities
  for each row execute procedure public.set_updated_at();

-- Indexes
create index kg_entities_type_idx on public.kg_entities (entity_type);
create index kg_entities_name_idx on public.kg_entities using gin (name gin_trgm_ops);
create index kg_entities_embedding_idx on public.kg_entities
  using ivfflat (embedding halfvec_cosine_ops) with (lists = 50);

-- ---------------------------------------------------------------------------
-- kg_entity_mentions — links entities back to document chunks
-- ---------------------------------------------------------------------------

create table public.kg_entity_mentions (
  id           uuid        primary key default gen_random_uuid(),
  entity_id    uuid        not null references public.kg_entities(id) on delete cascade,
  document_id  uuid        not null references public.documents(id) on delete cascade,
  chunk_id     uuid        references public.document_chunks(id) on delete set null,
  excerpt      text,
  confidence   float       not null default 1.0,
  created_at   timestamptz not null default now()
);

comment on table  public.kg_entity_mentions            is 'Links KG entities to specific documents and optionally chunks where they appear.';
comment on column public.kg_entity_mentions.confidence is 'LLM confidence score for this mention (0.0–1.0).';

create index kg_entity_mentions_entity_idx   on public.kg_entity_mentions (entity_id);
create index kg_entity_mentions_document_idx on public.kg_entity_mentions (document_id);
create index kg_entity_mentions_chunk_idx    on public.kg_entity_mentions (chunk_id);

-- ---------------------------------------------------------------------------
-- kg_relationships — edges in the knowledge graph
-- ---------------------------------------------------------------------------

create table public.kg_relationships (
  id                  uuid        primary key default gen_random_uuid(),
  source_entity_id    uuid        not null references public.kg_entities(id) on delete cascade,
  target_entity_id    uuid        not null references public.kg_entities(id) on delete cascade,
  relationship_type   text        not null,
  document_id         uuid        references public.documents(id) on delete set null,
  weight              float       not null default 1.0,
  evidence_excerpt    text,
  created_at          timestamptz not null default now(),
  constraint kg_relationships_type_check check (
    relationship_type in (
      'ARGUES', 'CONTRADICTS', 'OCCURRED_AT', 'PARTICIPATED_IN',
      'CITES', 'SUPPORTS', 'AUTHORED', 'ABOUT',
      'OCCURRED_DURING', 'RELATED_TO'
    )
  )
);

comment on table  public.kg_relationships                  is 'Directed edges between KG entities, extracted from document text.';
comment on column public.kg_relationships.relationship_type is 'Edge type: ARGUES, CONTRADICTS, OCCURRED_AT, PARTICIPATED_IN, CITES, SUPPORTS, AUTHORED, ABOUT, OCCURRED_DURING, RELATED_TO';
comment on column public.kg_relationships.weight           is 'Confidence/importance weight (0.0–1.0).';
comment on column public.kg_relationships.evidence_excerpt is 'Short text excerpt from the source document supporting this relationship.';

create index kg_relationships_source_idx on public.kg_relationships (source_entity_id);
create index kg_relationships_target_idx on public.kg_relationships (target_entity_id);
create index kg_relationships_type_idx   on public.kg_relationships (relationship_type);
create index kg_relationships_doc_idx    on public.kg_relationships (document_id);

-- Unique constraint to prevent duplicate edges from the same document
create unique index kg_relationships_unique_edge
  on public.kg_relationships (source_entity_id, target_entity_id, relationship_type, document_id);

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

alter table public.kg_entities        enable row level security;
alter table public.kg_entity_mentions enable row level security;
alter table public.kg_relationships   enable row level security;

-- KG data is derived from published documents — readable by all authenticated users
create policy "kg_entities: authenticated read"
  on public.kg_entities for select to authenticated using (true);

create policy "kg_entity_mentions: authenticated read"
  on public.kg_entity_mentions for select to authenticated using (true);

create policy "kg_relationships: authenticated read"
  on public.kg_relationships for select to authenticated using (true);

-- Only service_role (admin client / edge functions) can write KG data
create policy "kg_entities: service_role write"
  on public.kg_entities for all to service_role using (true) with check (true);

create policy "kg_entity_mentions: service_role write"
  on public.kg_entity_mentions for all to service_role using (true) with check (true);

create policy "kg_relationships: service_role write"
  on public.kg_relationships for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------------
-- graph_search — knowledge graph traversal for retrieval
-- ---------------------------------------------------------------------------
-- Given an array of seed entity IDs (extracted from a user query),
-- traverses the knowledge graph up to `max_hops` hops and returns
-- document chunks connected to discovered entities, ranked by
-- graph distance (closer = higher rank).

create or replace function public.graph_search(
  seed_entity_ids  uuid[],
  max_hops         int  default 2,
  match_count      int  default 30
)
returns table (
  chunk_id       uuid,
  document_id    uuid,
  document_title text,
  document_date  text,
  chunk_index    int,
  content        text,
  graph_rank     int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  with recursive traversal as (
    -- Seed: start from the given entity IDs (hop 0)
    select
      unnest(seed_entity_ids) as entity_id,
      0                       as hop

    union

    -- Expand: follow relationship edges in both directions
    select
      case
        when r.source_entity_id = t.entity_id then r.target_entity_id
        else r.source_entity_id
      end as entity_id,
      t.hop + 1 as hop
    from traversal t
    join public.kg_relationships r
      on r.source_entity_id = t.entity_id
      or r.target_entity_id = t.entity_id
    where t.hop < max_hops
  ),

  -- Deduplicate entities, keeping the shortest path (lowest hop count)
  distinct_entities as (
    select entity_id, min(hop) as min_hop
    from traversal
    group by entity_id
  ),

  -- Map entities to document chunks via mentions
  chunk_hits as (
    select
      m.chunk_id,
      m.document_id,
      de.min_hop,
      m.confidence,
      row_number() over (
        partition by m.chunk_id
        order by de.min_hop asc, m.confidence desc
      ) as rn
    from distinct_entities de
    join public.kg_entity_mentions m on m.entity_id = de.entity_id
    where m.chunk_id is not null
  ),

  -- Deduplicate chunks and rank by graph distance
  ranked_chunks as (
    select
      ch.chunk_id,
      ch.document_id,
      ch.min_hop,
      row_number() over (
        order by ch.min_hop asc, ch.confidence desc
      ) as graph_rank
    from chunk_hits ch
    where ch.rn = 1
  )

  -- Final output: join with document_chunks and documents for full data
  select
    rc.chunk_id,
    rc.document_id,
    d.title             as document_title,
    d.date_of_origin    as document_date,
    dc.chunk_index,
    dc.content,
    rc.graph_rank::int
  from ranked_chunks rc
  join public.document_chunks dc on dc.id = rc.chunk_id
  join public.documents d on d.id = rc.document_id
  where d.status = 'published'
  order by rc.graph_rank
  limit match_count;
end;
$$;

comment on function public.graph_search(uuid[], int, int) is
  'Knowledge graph traversal: given seed entity IDs, traverses relationships up to max_hops and returns connected document chunks ranked by graph distance.';

grant execute on function public.graph_search(uuid[], int, int) to authenticated;
grant execute on function public.graph_search(uuid[], int, int) to service_role;

-- ---------------------------------------------------------------------------
-- find_kg_entities_by_embedding — lookup entities by embedding similarity
-- ---------------------------------------------------------------------------
-- Used at query time to match extracted query entities to existing KG nodes.

create or replace function public.find_kg_entities_by_embedding(
  query_vector   halfvec(3072),
  match_count    int    default 10,
  min_similarity float  default 0.7
)
returns table (
  entity_id    uuid,
  entity_name  text,
  entity_type  text,
  similarity   float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id            as entity_id,
    e.name          as entity_name,
    e.entity_type,
    (1 - (e.embedding <=> query_vector))::float as similarity
  from public.kg_entities e
  where e.embedding is not null
    and (1 - (e.embedding <=> query_vector)) >= min_similarity
  order by e.embedding <=> query_vector
  limit match_count;
$$;

comment on function public.find_kg_entities_by_embedding(halfvec, int, float) is
  'Find KG entities similar to a given embedding vector. Used for query entity resolution and graph linking.';

grant execute on function public.find_kg_entities_by_embedding(halfvec, int, float) to authenticated;
grant execute on function public.find_kg_entities_by_embedding(halfvec, int, float) to service_role;

-- ---------------------------------------------------------------------------
-- Enable pg_trgm extension for fuzzy entity name matching
-- ---------------------------------------------------------------------------

create extension if not exists pg_trgm;

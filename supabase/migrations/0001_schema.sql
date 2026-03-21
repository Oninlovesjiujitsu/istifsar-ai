
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

create or replace function public.tier_rank(tier text)
returns int
language sql
immutable
as $$
  select case tier
    when 'pending' then 0
    when 'reader'  then 1
    when 'tier_3'  then 2
    when 'tier_2'  then 3
    when 'tier_1'  then 4
    when 'admin'   then 5
    else -1
  end;
$$;

create or replace function public.user_tier()
returns text
language sql
stable
security definer
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'tier'),
    'pending'
  );
$$;

create or replace function public.is_tier(min_tier text)
returns boolean
language sql
stable
security definer
as $$
  select public.tier_rank(public.user_tier()) >= public.tier_rank(min_tier);
$$;

create table public.profiles (
  id               uuid        primary key references auth.users(id) on delete cascade,
  username         text        unique not null,
  display_name     text        not null,
  bio              text,
  institution      text,
  tier             text        not null default 'pending',
  avatar_url       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint profiles_tier_check check (
    tier in ('pending', 'reader', 'tier_3', 'tier_2', 'tier_1', 'admin')
  )
);

comment on table  public.profiles                is 'User profiles; extends auth.users.';
comment on column public.profiles.tier           is 'Authorization tier. Values: pending, reader, tier_3, tier_2, tier_1, admin.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create table public.approved_institutions (
  id               uuid        primary key default gen_random_uuid(),
  domain           text        unique not null,  -- e.g. 'up.edu.ph'
  institution_name text        not null,
  added_by         uuid        references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now()
);

comment on table  public.approved_institutions        is 'Email domains whose users are auto-promoted to Tier 1 on registration.';
comment on column public.approved_institutions.domain is 'Bare domain without @ prefix, e.g. up.edu.ph.';

create table public.documents (
  id                uuid        primary key default gen_random_uuid(),
  title             text        not null,
  description       text,
  submitter_id      uuid        not null references public.profiles(id) on delete restrict,
  status            text        not null default 'pending',
  document_type     text,        -- manuscript, photograph, newspaper, official_record, map, other
  date_of_origin    text,        -- historical date; free-text to handle approximate dates
  origin_location   text,
  language          text,
  storage_path      text,        
  original_filename text,
  file_size_bytes   bigint,
  mime_type         text,
  page_count        int,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  published_at      timestamptz,
  constraint documents_status_check check (
    status in ('pending', 'under_review', 'published', 'rejected')
  )
);

comment on table  public.documents              is 'Primary source documents submitted for ingestion into the RAG corpus.';
comment on column public.documents.storage_path is 'Object key in Supabase Storage private bucket.';
comment on column public.documents.status       is 'Values: pending, under_review, published, rejected.';

create trigger documents_updated_at
  before update on public.documents
  for each row execute procedure public.set_updated_at();

create table public.document_chunks (
  id           uuid        primary key default gen_random_uuid(),
  document_id  uuid        not null references public.documents(id) on delete cascade,
  chunk_index  int         not null,
  content      text        not null,
  embedding    halfvec(3072),
  token_count  int,
  page_number  int,
  created_at   timestamptz not null default now(),
  unique (document_id, chunk_index)
);

comment on table  public.document_chunks           is 'Chunked text segments of each document with pgvector embeddings.';
comment on column public.document_chunks.embedding is '3072-dim gemini-embedding-001 vector stored as halfvec (16-bit) for cosine similarity search. Cast float32 output from the embedding API before insert.';

create table public.document_validations (
  id           uuid        primary key default gen_random_uuid(),
  document_id  uuid        not null references public.documents(id) on delete cascade,
  validator_id uuid        not null references public.profiles(id) on delete restrict,
  decision     text        not null,
  notes        text,
  created_at   timestamptz not null default now(),
  unique (document_id, validator_id),
  constraint document_validations_decision_check check (
    decision in ('approved', 'rejected', 'flagged')
  )
);

comment on table public.document_validations is 'Tier 1 validation decisions on documents. 2 approvals → published.';

create table public.living_essays (
  id                    uuid        primary key default gen_random_uuid(),
  title                 text        not null,
  slug                  text        unique not null,
  author_id             uuid        not null references public.profiles(id) on delete restrict,
  status                text        not null default 'draft',
  content               text        not null default '',
  summary               text,
  lens_label            text,
  related_document_ids  uuid[]      not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  published_at          timestamptz,
  constraint living_essays_status_check check (
    status in ('draft', 'under_review', 'published', 'archived')
  )
);

comment on table  public.living_essays            is 'Historian-authored analytical essays used as the Lens layer in Interpreted mode.';
comment on column public.living_essays.lens_label is 'Historiographical perspective; displayed as "historian''s perspective" in user-facing UI.';

create trigger living_essays_updated_at
  before update on public.living_essays
  for each row execute procedure public.set_updated_at();

create table public.essay_reviews (
  id          uuid        primary key default gen_random_uuid(),
  essay_id    uuid        not null references public.living_essays(id) on delete cascade,
  reviewer_id uuid        not null references public.profiles(id) on delete restrict,
  decision    text        not null,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (essay_id, reviewer_id),
  constraint essay_reviews_decision_check check (
    decision in ('approved', 'rejected', 'revision_requested')
  )
);

comment on table public.essay_reviews is 'Tier 1 peer review decisions on Living Essays. 1 approval → published.';

create table public.archive_gaps (
  id              uuid        primary key default gen_random_uuid(),
  query_text      text        not null,
  user_id         uuid        references public.profiles(id) on delete set null,
  similarity_score numeric,
  mode            text        not null default 'raw_evidence',
  created_at      timestamptz not null default now(),
  constraint archive_gaps_mode_check check (
    mode in ('raw_evidence', 'interpreted')
  )
);

comment on table public.archive_gaps is 'Queries that fell below the similarity gate threshold (0.65). Drives content acquisition priorities.';


create table public.contentions (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  description      text,
  document_ids     uuid[]      not null default '{}',
  essay_ids        uuid[]      not null default '{}',
  status           text        not null default 'open',
  detected_by      uuid        references public.profiles(id) on delete set null,
  resolution_notes text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint contentions_status_check check (
    status in ('open', 'resolved', 'disputed')
  )
);

comment on table public.contentions is 'Detected contradictions between sources, surfaced by the LangChain contention-detection workflow.';

create trigger contentions_updated_at
  before update on public.contentions
  for each row execute procedure public.set_updated_at();

create table public.knowledge_paths (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  slug            text        unique not null,
  description     text,
  author_id       uuid        not null references public.profiles(id) on delete restrict,
  status          text        not null default 'draft',
  cover_image_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz,
  constraint knowledge_paths_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

comment on table public.knowledge_paths is 'Curated, ordered exploration journeys through primary sources and essays.';

create trigger knowledge_paths_updated_at
  before update on public.knowledge_paths
  for each row execute procedure public.set_updated_at();

create table public.path_nodes (
  id          uuid primary key default gen_random_uuid(),
  path_id     uuid not null references public.knowledge_paths(id) on delete cascade,
  position    int  not null,
  node_type   text not null,
  document_id uuid references public.documents(id) on delete set null,
  essay_id    uuid references public.living_essays(id) on delete set null,
  body        text,
  created_at  timestamptz not null default now(),
  unique (path_id, position),
  constraint path_nodes_type_check check (
    node_type in ('document', 'essay', 'question', 'note')
  )
);

comment on table public.path_nodes is 'Ordered items within a knowledge path. document_id or essay_id populated depending on node_type.';


create table public.tags (
  id          uuid        primary key default gen_random_uuid(),
  name        text        unique not null,
  slug        text        unique not null,
  description text,
  created_at  timestamptz not null default now()
);

comment on table public.tags is 'Controlled vocabulary tags for documents, essays, and paths.';

create table public.document_tags (
  document_id uuid not null references public.documents(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  primary key (document_id, tag_id)
);

comment on table public.document_tags is 'Many-to-many join between documents and tags.';


create table public.conversations (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  title           text,
  mode            text        not null default 'raw_evidence',
  active_lens_id  uuid        references public.living_essays(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint conversations_mode_check check (
    mode in ('raw_evidence', 'interpreted')
  )
);

comment on table public.conversations is 'Chat sessions scoped to a mode (raw_evidence / interpreted) and optional Lens essay.';

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.set_updated_at();

create table public.messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  role            text        not null,
  content         text        not null,
  created_at      timestamptz not null default now(),
  constraint messages_role_check check (role in ('user', 'assistant'))
);

comment on table public.messages is 'Individual message turns within a conversation.';

create table public.citations (
  id               uuid        primary key default gen_random_uuid(),
  message_id       uuid        not null references public.messages(id) on delete cascade,
  document_id      uuid        not null references public.documents(id) on delete restrict,
  chunk_id         uuid        references public.document_chunks(id) on delete set null,
  excerpt          text,
  similarity_score numeric,
  position         int         not null default 0,
  created_at       timestamptz not null default now()
);

comment on table public.citations is 'Source citations linked to assistant messages; populated by the RAG pipeline.';

create table public.votes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  target_type text        not null,
  target_id   uuid        not null,
  value       smallint    not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id),
  constraint votes_target_type_check check (
    target_type in ('document', 'essay', 'message', 'path')
  ),
  constraint votes_value_check check (value in (-1, 1))
);

comment on table public.votes is 'Upvotes and downvotes on documents, essays, messages, and paths.';

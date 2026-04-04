
-- ---------------------------------------------------------------------------
-- hybrid_search: add optional scope_document_id filter parameter
-- ---------------------------------------------------------------------------
-- When scope_document_id is provided, both vector and FTS searches are scoped
-- to only return chunks from that specific document.
-- When null, behaviour is identical to the previous function.

-- Drop the old 5-param overload so we don't end up with two signatures.
drop function if exists public.hybrid_search(text, halfvec, int, int, uuid);

create or replace function public.hybrid_search(
  query_text          text,
  query_vector        halfvec(3072),
  match_count         int   default 30,
  rrf_k               int   default 60,
  topic_tag_id        uuid  default null,
  scope_document_id   uuid  default null
)
returns table (
  chunk_id       uuid,
  document_id    uuid,
  document_title text,
  document_date  text,
  chunk_index    int,
  content        text,
  cosine_score   float,
  rrf_score      float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with

  -- ── Vector search ─────────────────────────────────────────────────────────
  vector_results as (
    select
      dc.id                                              as chunk_id,
      dc.document_id,
      dc.chunk_index,
      dc.content,
      1 - (dc.embedding <=> query_vector)::float        as cosine_score,
      row_number() over (
        order by dc.embedding <=> query_vector
      )                                                  as vector_rank
    from public.document_chunks dc
    join public.documents d on d.id = dc.document_id
    where d.status = 'published'
      and dc.embedding is not null
      and (scope_document_id is null or dc.document_id = scope_document_id)
      and (topic_tag_id is null or exists (
        select 1 from public.document_tags dt
        where dt.document_id = dc.document_id
          and dt.tag_id = topic_tag_id
      ))
    order by dc.embedding <=> query_vector
    limit 50
  ),

  -- ── Full-text search ──────────────────────────────────────────────────────
  fts_results as (
    select
      dc.id                                              as chunk_id,
      dc.document_id,
      dc.chunk_index,
      dc.content,
      ts_rank(dc.fts, websearch_to_tsquery('english', query_text))::float as fts_rank_score,
      row_number() over (
        order by ts_rank(dc.fts, websearch_to_tsquery('english', query_text)) desc
      )                                                  as fts_rank
    from public.document_chunks dc
    join public.documents d on d.id = dc.document_id
    where d.status = 'published'
      and dc.fts @@ websearch_to_tsquery('english', query_text)
      and (scope_document_id is null or dc.document_id = scope_document_id)
      and (topic_tag_id is null or exists (
        select 1 from public.document_tags dt
        where dt.document_id = dc.document_id
          and dt.tag_id = topic_tag_id
      ))
    order by fts_rank_score desc
    limit 50
  ),

  -- ── RRF merge ─────────────────────────────────────────────────────────────
  merged as (
    select
      coalesce(vr.chunk_id, fr.chunk_id)                 as chunk_id,
      coalesce(vr.document_id, fr.document_id)           as document_id,
      coalesce(vr.chunk_index, fr.chunk_index)           as chunk_index,
      coalesce(vr.content, fr.content)                   as content,
      coalesce(vr.cosine_score, 0.0)                     as cosine_score,
      (
        coalesce(1.0 / (rrf_k + vr.vector_rank), 0.0)
        + coalesce(1.0 / (rrf_k + fr.fts_rank), 0.0)
      )                                                   as rrf_score
    from vector_results vr
    full outer join fts_results fr on fr.chunk_id = vr.chunk_id
  )

  -- ── Final output ──────────────────────────────────────────────────────────
  select
    m.chunk_id,
    m.document_id,
    d.title             as document_title,
    d.date_of_origin    as document_date,
    m.chunk_index,
    m.content,
    m.cosine_score::float,
    m.rrf_score::float
  from merged m
  join public.documents d on d.id = m.document_id
  order by m.rrf_score desc
  limit match_count;
end;
$$;

comment on function public.hybrid_search(text, halfvec, int, int, uuid, uuid) is
  'Hybrid vector + FTS search over published document_chunks using Reciprocal Rank Fusion (RRF). Optionally scoped to a topic tag or a single document.';

-- Allow authenticated users to call this function (RLS on base tables still applies)
grant execute on function public.hybrid_search(text, halfvec, int, int, uuid, uuid) to authenticated;

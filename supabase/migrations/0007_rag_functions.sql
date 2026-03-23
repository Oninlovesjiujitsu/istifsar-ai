
-- ---------------------------------------------------------------------------
-- hybrid_search: RRF-merged vector + full-text search over published chunks
-- ---------------------------------------------------------------------------
-- Returns document chunks ranked by Reciprocal Rank Fusion of:
--   1. Cosine similarity (pgvector halfvec <=> operator)
--   2. BM25-style full-text search (ts_rank on generated tsvector)
-- Only chunks belonging to documents with status = 'published' are returned.

create or replace function public.hybrid_search(
  query_text  text,
  query_vector halfvec(3072),
  match_count  int  default 30,
  rrf_k        int  default 60
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
  -- Optional: enable trigram similarity assistance for FTS
  perform set_limit(0.1);

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
    d.title        as document_title,
    d.date_of_origin as document_date,
    m.chunk_index,
    m.content,
    m.cosine_score,
    m.rrf_score
  from merged m
  join public.documents d on d.id = m.document_id
  order by m.rrf_score desc
  limit match_count;
end;
$$;

comment on function public.hybrid_search is
  'Hybrid vector + FTS search over published document_chunks using Reciprocal Rank Fusion (RRF).';

-- Allow authenticated users to call this function (RLS on base tables still applies)
grant execute on function public.hybrid_search to authenticated;

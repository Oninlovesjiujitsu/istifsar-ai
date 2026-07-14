-- Migration 0021: Add author_name to documents and fix vector search

-- 1. Add author_name to documents table
alter table public.documents
  add column if not exists author_name text;

comment on column public.documents.author_name is 'The true historical author or creator of this document. Defaults to submitter name if blank.';

-- 2. Fix find_similar_documents helper
-- Previously, this query ordered by d.id first, which defeated the vector search entirely.
-- We now compute the distance, order by it, and then apply DISTINCT ON if we only want one chunk per document.
-- Wait, DISTINCT ON requires the first ORDER BY column to match.
-- To fix this correctly, we can use a CTE or a subquery.

create or replace function find_similar_documents(
  query_vector  halfvec(3072),
  exclude_document_id uuid,
  match_count int default 5
)
returns table (
  document_id  uuid,
  title        text,
  content      text
)
language sql stable
as $$
  with ranked_chunks as (
    select
      d.id as document_id,
      d.title,
      dc.content,
      (dc.embedding <=> query_vector) as distance,
      row_number() over (partition by d.id order by dc.embedding <=> query_vector) as rn
    from document_chunks dc
    join documents d on d.id = dc.document_id
    where d.id != exclude_document_id
      and d.status = 'published'
      and dc.embedding is not null
  )
  select
    document_id,
    title,
    content
  from ranked_chunks
  where rn = 1
  order by distance asc
  limit match_count;
$$;

grant execute on function find_similar_documents to authenticated;
grant execute on function find_similar_documents to service_role;

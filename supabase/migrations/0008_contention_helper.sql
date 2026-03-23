-- Helper function for contention detection: finds the most semantically similar
-- published documents to a given embedding vector, excluding a specific document.

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
  select distinct on (d.id)
    d.id   as document_id,
    d.title,
    dc.content
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where d.id != exclude_document_id
    and d.status = 'published'
    and dc.embedding is not null
  order by d.id, dc.embedding <=> query_vector
  limit match_count;
$$;

grant execute on function find_similar_documents to authenticated;
grant execute on function find_similar_documents to service_role;

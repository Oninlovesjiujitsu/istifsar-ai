
alter table public.documents
  add column if not exists fts tsvector
    generated always as (
      to_tsvector('english',
        coalesce(title, '') || ' ' || coalesce(description, '')
      )
    ) stored;

alter table public.document_chunks
  add column if not exists fts tsvector
    generated always as (
      to_tsvector('english', coalesce(content, ''))
    ) stored;

alter table public.living_essays
  add column if not exists fts tsvector
    generated always as (
      to_tsvector('english',
        coalesce(title, '') || ' ' || coalesce(content, '')
      )
    ) stored;

alter table public.knowledge_paths
  add column if not exists fts tsvector
    generated always as (
      to_tsvector('english',
        coalesce(title, '') || ' ' || coalesce(description, '')
      )
    ) stored;

create index if not exists document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

comment on index public.document_chunks_embedding_hnsw_idx
  is 'HNSW index for cosine-similarity ANN search in the RAG pipeline. Set hnsw.ef_search=100 at query time for high recall.';

create index if not exists documents_fts_idx
  on public.documents using gin (fts);

create index if not exists document_chunks_fts_idx
  on public.document_chunks using gin (fts);

create index if not exists living_essays_fts_idx
  on public.living_essays using gin (fts);

create index if not exists knowledge_paths_fts_idx
  on public.knowledge_paths using gin (fts);

create index if not exists documents_status_idx
  on public.documents (status);

create index if not exists documents_created_at_idx
  on public.documents (created_at desc);

create index if not exists documents_submitter_id_idx
  on public.documents (submitter_id);

create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id, chunk_index);

create index if not exists document_validations_document_id_idx
  on public.document_validations (document_id);

create index if not exists document_validations_validator_id_idx
  on public.document_validations (validator_id);

create index if not exists living_essays_status_idx
  on public.living_essays (status);

create index if not exists living_essays_author_id_idx
  on public.living_essays (author_id);

create index if not exists living_essays_slug_idx
  on public.living_essays (slug);

create index if not exists essay_reviews_essay_id_idx
  on public.essay_reviews (essay_id);

create index if not exists essay_reviews_reviewer_id_idx
  on public.essay_reviews (reviewer_id);

create index if not exists archive_gaps_created_at_idx
  on public.archive_gaps (created_at desc);

create index if not exists archive_gaps_user_id_idx
  on public.archive_gaps (user_id);

create index if not exists contentions_status_idx
  on public.contentions (status);

create index if not exists knowledge_paths_status_idx
  on public.knowledge_paths (status);

create index if not exists knowledge_paths_author_id_idx
  on public.knowledge_paths (author_id);

create index if not exists knowledge_paths_slug_idx
  on public.knowledge_paths (slug);

create index if not exists path_nodes_path_id_position_idx
  on public.path_nodes (path_id, position);

create index if not exists document_tags_tag_id_idx
  on public.document_tags (tag_id);

create index if not exists conversations_user_id_idx
  on public.conversations (user_id, updated_at desc);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at);

create index if not exists citations_message_id_idx
  on public.citations (message_id, position);

create index if not exists citations_document_id_idx
  on public.citations (document_id);

create index if not exists votes_target_idx
  on public.votes (target_type, target_id);

create index if not exists votes_user_id_idx
  on public.votes (user_id);

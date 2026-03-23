
-- ============================================================
-- 0006_ingestion.sql — Ingestion pipeline support
-- ============================================================

-- ------------------------------------------------------------
-- New columns on documents
-- ------------------------------------------------------------

alter table public.documents
  add column if not exists transcription_path text,
  add column if not exists ingestion_status   text not null default 'queued',
  add column if not exists ingestion_error    text;

alter table public.documents
  add constraint documents_ingestion_status_check
    check (ingestion_status in ('queued', 'processing', 'done', 'failed'));

comment on column public.documents.transcription_path
  is 'Storage path in the transcriptions bucket. When present, the ingestion pipeline uses this text over Unstructured.io extraction.';
comment on column public.documents.ingestion_status
  is 'Pipeline state: queued (default) | processing | done | failed. Separate from editorial status.';
comment on column public.documents.ingestion_error
  is 'Last ingestion failure message; null when ingestion succeeded.';

-- ------------------------------------------------------------
-- Transcriptions storage bucket
-- (plain-text counterpart to document-scans)
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transcriptions',
  'transcriptions',
  false,
  10485760,   -- 10 MB; plain text is small
  array['text/plain', 'text/markdown', 'text/x-markdown']
)
on conflict (id) do nothing;

create policy "transcriptions: tier_3+ can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'transcriptions'
    and public.is_tier('tier_3')
  );

create policy "transcriptions: owner and tier_1+ can read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'transcriptions'
    and (owner = auth.uid() or public.is_tier('tier_1'))
  );

create policy "transcriptions: owner can delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'transcriptions'
    and owner = auth.uid()
  );

-- ------------------------------------------------------------
-- DB webhook trigger → ingest-document Edge Function
--
-- LOCAL DEV:  http://host.docker.internal:54321/functions/v1/ingest-document
--             Works with Docker Desktop on WSL2.
--             Run: npx supabase functions serve ingest-document
--
-- PRODUCTION: Recreate this trigger via Supabase Dashboard >
--             Database > Webhooks, pointing to your project URL.
--             Include "Authorization: Bearer <service-role-key>" header.
-- ------------------------------------------------------------

create trigger on_document_insert_ingest
  after insert on public.documents
  for each row
  execute function supabase_functions.http_request(
    'http://host.docker.internal:54321/functions/v1/ingest-document',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );

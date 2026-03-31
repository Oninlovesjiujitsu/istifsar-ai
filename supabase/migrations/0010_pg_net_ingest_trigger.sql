-- =============================================================================
-- 0010 — Replace supabase_functions webhook with pg_net trigger
--
-- Uses pg_net (available on all hosted Supabase projects) to call the
-- ingest-document Edge Function on document insert.
-- The service role key is read from Supabase Vault at runtime.
--
-- ONE-TIME SETUP (run once in SQL Editor or via Dashboard > Vault):
--   select vault.create_secret('<your-service-role-key>', 'service_role_key');
-- =============================================================================

-- 1. Enable pg_net
create extension if not exists pg_net with schema extensions;

-- 2. Drop the old trigger if it was created (local dev via supabase_functions)
drop trigger if exists on_document_insert_ingest on public.documents;

-- 3. Trigger function that invokes the Edge Function via pg_net
create or replace function public.invoke_ingest_edge_function()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _url       text;
  _key       text;
  _project   text := 'lglmlaxhgtfdszaokbni';
begin
  _url := 'https://' || _project || '.supabase.co/functions/v1/ingest-document';

  select decrypted_secret into _key
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  if _key is null then
    raise warning 'vault secret "service_role_key" not found — skipping ingestion trigger';
    return new;
  end if;

  perform net.http_post(
    url     := _url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _key
    ),
    body    := jsonb_build_object(
      'type',   'INSERT',
      'table',  'documents',
      'record', jsonb_build_object('id', new.id)
    )
  );

  return new;
end;
$$;

-- 4. Create the trigger
create trigger on_document_insert_ingest
  after insert on public.documents
  for each row
  execute function public.invoke_ingest_edge_function();

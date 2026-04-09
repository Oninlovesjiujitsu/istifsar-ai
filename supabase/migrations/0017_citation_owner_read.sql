-- Allow document submitters (historians) to read citations
-- referencing their documents, regardless of who created the conversation.
-- PostgreSQL OR's permissive policies, so this works alongside the
-- existing "citations: select" policy (conversation owner can read).

create policy "citations: document submitter can read"
  on public.citations for select
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = citations.document_id
        and d.submitter_id = auth.uid()
    )
  );

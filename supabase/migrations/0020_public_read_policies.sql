-- Migration 0020: Public read policies for tags, document_tags, documents, profiles, archive_gaps, and contentions

-- 1. Profiles: allow public select
drop policy if exists "profiles: authenticated users can read all" on public.profiles;
create policy "profiles: public select"
  on public.profiles for select
  using (true);

-- 2. Tags: allow public select
drop policy if exists "tags: authenticated can read" on public.tags;
create policy "tags: public select"
  on public.tags for select
  using (true);

-- 3. Document Tags: allow public select
drop policy if exists "document_tags: authenticated can read" on public.document_tags;
create policy "document_tags: public select"
  on public.document_tags for select
  using (true);

-- 4. Documents: allow public select for published documents, and maintain owner/tier_1 visibility for authenticated
drop policy if exists "documents: select" on public.documents;
create policy "documents: select"
  on public.documents for select
  using (
    status = 'published'
    or (auth.role() = 'authenticated' and (
      submitter_id = auth.uid()
      or public.is_tier('tier_1')
    ))
  );

-- 5. Archive Gaps: allow public select
drop policy if exists "archive_gaps: select" on public.archive_gaps;
create policy "archive_gaps: public select"
  on public.archive_gaps for select
  using (true);

-- 6. Contentions: allow public select
drop policy if exists "contentions: authenticated can read" on public.contentions;
create policy "contentions: public select"
  on public.contentions for select
  using (true);

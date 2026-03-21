
-- All policies read the JWT claim `app_metadata.tier` via public.user_tier()
-- and public.is_tier() defined in 0001_schema.sql.
-- NEVER query the profiles table inside a policy — use the JWT claim only.

alter table public.profiles             enable row level security;
alter table public.approved_institutions enable row level security;
alter table public.documents            enable row level security;
alter table public.document_chunks      enable row level security;
alter table public.document_validations enable row level security;
alter table public.living_essays        enable row level security;
alter table public.essay_reviews        enable row level security;
alter table public.archive_gaps         enable row level security;
alter table public.contentions          enable row level security;
alter table public.knowledge_paths      enable row level security;
alter table public.path_nodes           enable row level security;
alter table public.tags                 enable row level security;
alter table public.document_tags        enable row level security;
alter table public.conversations        enable row level security;
alter table public.messages             enable row level security;
alter table public.citations            enable row level security;
alter table public.votes                enable row level security;

create policy "profiles: authenticated users can read all"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: users can update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin can delete"
  on public.profiles for delete
  to authenticated
  using (public.user_tier() = 'admin');

create policy "approved_institutions: authenticated can read"
  on public.approved_institutions for select
  to authenticated
  using (true);

create policy "approved_institutions: admin can insert"
  on public.approved_institutions for insert
  to authenticated
  with check (public.user_tier() = 'admin');

create policy "approved_institutions: admin can update"
  on public.approved_institutions for update
  to authenticated
  using (public.user_tier() = 'admin')
  with check (public.user_tier() = 'admin');

create policy "approved_institutions: admin can delete"
  on public.approved_institutions for delete
  to authenticated
  using (public.user_tier() = 'admin');

create policy "documents: select"
  on public.documents for select
  to authenticated
  using (
    status = 'published'
    or submitter_id = auth.uid()
    or public.is_tier('tier_1')
  );

create policy "documents: tier_3+ can insert"
  on public.documents for insert
  to authenticated
  with check (
    public.is_tier('tier_3')
    and submitter_id = auth.uid()
  );

create policy "documents: update"
  on public.documents for update
  to authenticated
  using (
    (submitter_id = auth.uid() and status in ('pending', 'under_review'))
    or public.is_tier('tier_1')
  )
  with check (
    (submitter_id = auth.uid() and status in ('pending', 'under_review'))
    or public.is_tier('tier_1')
  );

create policy "documents: admin can delete"
  on public.documents for delete
  to authenticated
  using (public.user_tier() = 'admin');

create policy "document_chunks: select"
  on public.document_chunks for select
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and (
          d.status = 'published'
          or d.submitter_id = auth.uid()
          or public.is_tier('tier_1')
        )
    )
  );

create policy "document_validations: select"
  on public.document_validations for select
  to authenticated
  using (
    validator_id = auth.uid()
    or exists (
      select 1 from public.documents d
      where d.id = document_id and d.submitter_id = auth.uid()
    )
    or public.is_tier('tier_1')
  );

create policy "document_validations: tier_1 can insert"
  on public.document_validations for insert
  to authenticated
  with check (
    public.is_tier('tier_1')
    and validator_id = auth.uid()
    and not exists (
      select 1 from public.documents d
      where d.id = document_id and d.submitter_id = auth.uid()
    )
  );

create policy "document_validations: admin can delete"
  on public.document_validations for delete
  to authenticated
  using (public.user_tier() = 'admin');

create policy "living_essays: select"
  on public.living_essays for select
  to authenticated
  using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_tier('tier_1')
  );

create policy "living_essays: tier_2+ can insert"
  on public.living_essays for insert
  to authenticated
  with check (
    public.is_tier('tier_2')
    and author_id = auth.uid()
  );

create policy "living_essays: update"
  on public.living_essays for update
  to authenticated
  using (
    (author_id = auth.uid() and status in ('draft', 'under_review'))
    or public.is_tier('tier_1')
  )
  with check (
    (author_id = auth.uid() and status in ('draft', 'under_review'))
    or public.is_tier('tier_1')
  );

create policy "living_essays: admin can delete"
  on public.living_essays for delete
  to authenticated
  using (public.user_tier() = 'admin');

create policy "essay_reviews: select"
  on public.essay_reviews for select
  to authenticated
  using (
    reviewer_id = auth.uid()
    or exists (
      select 1 from public.living_essays e
      where e.id = essay_id and e.author_id = auth.uid()
    )
    or public.is_tier('tier_1')
  );

create policy "essay_reviews: tier_1 can insert"
  on public.essay_reviews for insert
  to authenticated
  with check (
    public.is_tier('tier_1')
    and reviewer_id = auth.uid()
    and not exists (
      select 1 from public.living_essays e
      where e.id = essay_id and e.author_id = auth.uid()
    )
  );

create policy "essay_reviews: admin can delete"
  on public.essay_reviews for delete
  to authenticated
  using (public.user_tier() = 'admin');

create policy "archive_gaps: select"
  on public.archive_gaps for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.user_tier() = 'admin'
  );

create policy "archive_gaps: authenticated can insert"
  on public.archive_gaps for insert
  to authenticated
  with check (true);

create policy "archive_gaps: admin can delete"
  on public.archive_gaps for delete
  to authenticated
  using (public.user_tier() = 'admin');

create policy "contentions: authenticated can read"
  on public.contentions for select
  to authenticated
  using (true);

-- tier_1+ or system (service role) can create contentions.
create policy "contentions: tier_1+ can insert"
  on public.contentions for insert
  to authenticated
  with check (public.is_tier('tier_1'));

-- tier_1+ can update (e.g. change status, add resolution notes).
create policy "contentions: tier_1+ can update"
  on public.contentions for update
  to authenticated
  using (public.is_tier('tier_1'))
  with check (public.is_tier('tier_1'));

create policy "contentions: admin can delete"
  on public.contentions for delete
  to authenticated
  using (public.user_tier() = 'admin');

-- Published paths are visible to all authenticated users.
-- Non-published paths are visible only to the author or tier_1+.
create policy "knowledge_paths: select"
  on public.knowledge_paths for select
  to authenticated
  using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_tier('tier_1')
  );

-- tier_3 and above can create paths.
create policy "knowledge_paths: tier_3+ can insert"
  on public.knowledge_paths for insert
  to authenticated
  with check (
    public.is_tier('tier_3')
    and author_id = auth.uid()
  );

-- Authors can update their own path; tier_1+ can update any.
create policy "knowledge_paths: update"
  on public.knowledge_paths for update
  to authenticated
  using (
    author_id = auth.uid()
    or public.is_tier('tier_1')
  )
  with check (
    author_id = auth.uid()
    or public.is_tier('tier_1')
  );

-- Authors can delete their own draft paths; admins can delete any.
create policy "knowledge_paths: delete"
  on public.knowledge_paths for delete
  to authenticated
  using (
    (author_id = auth.uid() and status = 'draft')
    or public.user_tier() = 'admin'
  );

-- Nodes inherit the visibility of their parent path.
create policy "path_nodes: select"
  on public.path_nodes for select
  to authenticated
  using (
    exists (
      select 1 from public.knowledge_paths p
      where p.id = path_id
        and (
          p.status = 'published'
          or p.author_id = auth.uid()
          or public.is_tier('tier_1')
        )
    )
  );

-- Path author or tier_1+ can manage nodes.
create policy "path_nodes: insert"
  on public.path_nodes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.knowledge_paths p
      where p.id = path_id
        and (p.author_id = auth.uid() or public.is_tier('tier_1'))
    )
  );

create policy "path_nodes: update"
  on public.path_nodes for update
  to authenticated
  using (
    exists (
      select 1 from public.knowledge_paths p
      where p.id = path_id
        and (p.author_id = auth.uid() or public.is_tier('tier_1'))
    )
  );

create policy "path_nodes: delete"
  on public.path_nodes for delete
  to authenticated
  using (
    exists (
      select 1 from public.knowledge_paths p
      where p.id = path_id
        and (p.author_id = auth.uid() or public.is_tier('tier_1'))
    )
  );

-- Tags are visible to all authenticated users.
create policy "tags: authenticated can read"
  on public.tags for select
  to authenticated
  using (true);

-- tier_2+ can create and update tags.
create policy "tags: tier_2+ can insert"
  on public.tags for insert
  to authenticated
  with check (public.is_tier('tier_2'));

create policy "tags: tier_2+ can update"
  on public.tags for update
  to authenticated
  using (public.is_tier('tier_2'))
  with check (public.is_tier('tier_2'));

-- Only admins can delete tags.
create policy "tags: admin can delete"
  on public.tags for delete
  to authenticated
  using (public.user_tier() = 'admin');

-- Visible to all authenticated users.
create policy "document_tags: authenticated can read"
  on public.document_tags for select
  to authenticated
  using (true);

-- Document submitter or tier_2+ can tag documents.
create policy "document_tags: insert"
  on public.document_tags for insert
  to authenticated
  with check (
    public.is_tier('tier_2')
    or exists (
      select 1 from public.documents d
      where d.id = document_id and d.submitter_id = auth.uid()
    )
  );

-- Document submitter or tier_2+ can remove tags.
create policy "document_tags: delete"
  on public.document_tags for delete
  to authenticated
  using (
    public.is_tier('tier_2')
    or exists (
      select 1 from public.documents d
      where d.id = document_id and d.submitter_id = auth.uid()
    )
  );


-- Users can only access their own conversations.
create policy "conversations: own rows only"
  on public.conversations for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- Users can only access messages within their own conversations.
create policy "messages: own conversations only"
  on public.messages for all
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Citations are readable by the owner of the parent message's conversation.
create policy "citations: select"
  on public.citations for select
  to authenticated
  using (
    exists (
      select 1
      from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where m.id = message_id and c.user_id = auth.uid()
    )
  );

-- Citations are written only by the RAG pipeline (service role).
-- No INSERT/UPDATE/DELETE policies for authenticated role.

-- Admins can delete citation records.
create policy "citations: admin can delete"
  on public.citations for delete
  to authenticated
  using (public.user_tier() = 'admin');

-- All authenticated users can read votes (for displaying counts).
create policy "votes: authenticated can read"
  on public.votes for select
  to authenticated
  using (true);

-- Authenticated users can cast their own vote.
create policy "votes: authenticated can insert"
  on public.votes for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can change their own vote.
create policy "votes: users can update own"
  on public.votes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can retract their own vote.
create policy "votes: users can delete own"
  on public.votes for delete
  to authenticated
  using (user_id = auth.uid());

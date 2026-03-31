-- =============================================================================
-- 0009 — Verification Requests ("Claim Your Work" system)
--
-- Replaces domain-based auto-promotion via approved_institutions.
-- Users submit a link (Google Scholar, faculty page, DOI) for admin review.
-- Approval grants tier_3 (Contributor).
-- =============================================================================

-- -------------------------------------------------------
-- 1. Drop the approved_institutions table (cascade removes its RLS policies)
-- -------------------------------------------------------

drop table if exists public.approved_institutions cascade;

-- -------------------------------------------------------
-- 2. Create verification_requests table
-- -------------------------------------------------------

create table public.verification_requests (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  link_type        text        not null,
  link_url         text        not null,
  status           text        not null default 'pending',
  reviewed_by      uuid        references public.profiles(id) on delete set null,
  reviewed_at      timestamptz,
  reviewer_notes   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint verification_requests_status_check check (
    status in ('pending', 'approved', 'denied')
  ),
  constraint verification_requests_link_type_check check (
    link_type in ('google_scholar', 'faculty_page', 'doi')
  )
);

-- Indexes for admin queue and user lookups
create index idx_verification_requests_status on public.verification_requests(status);
create index idx_verification_requests_user   on public.verification_requests(user_id);

-- -------------------------------------------------------
-- 3. RLS
-- -------------------------------------------------------

alter table public.verification_requests enable row level security;

-- Users can read their own requests; admins can read all
create policy "verification_requests: read own or admin"
  on public.verification_requests for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.user_tier() = 'admin'
  );

-- Users can submit a request (only one pending at a time)
create policy "verification_requests: insert own"
  on public.verification_requests for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.verification_requests vr
      where vr.user_id = auth.uid() and vr.status = 'pending'
    )
  );

-- Only admins can update (approve / deny)
create policy "verification_requests: admin update"
  on public.verification_requests for update
  to authenticated
  using  (public.user_tier() = 'admin')
  with check (public.user_tier() = 'admin');

-- -------------------------------------------------------
-- 4. Replace handle_new_user() — everyone starts as pending
-- -------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, tier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'pending'
  );
  return new;
end;
$$;

-- =============================================================================
-- 0011 — Migrate tier system → flat role system
--
-- Old: pending | reader | tier_3 | tier_2 | tier_1 | admin (hierarchical)
-- New: reader | verified_historian | admin (flat)
--
-- Mapping:
--   pending, reader → reader
--   tier_3, tier_2, tier_1 → verified_historian
--   admin → admin
--
-- Strategy: update the SQL helper functions to understand both old and new
-- role values so existing RLS policies continue to work without being
-- dropped and recreated. verified_historian maps to rank 4 (= old tier_1)
-- so all is_tier() checks grant full contributor permissions.
-- =============================================================================

-- 1. Update tier_rank() to handle both old tier names and new role names.
--    verified_historian → rank 4 (same as tier_1) so existing is_tier('tier_3'),
--    is_tier('tier_2'), is_tier('tier_1') all pass for verified_historian.
create or replace function public.tier_rank(tier text)
returns int
language sql
immutable
as $$
  select case tier
    when 'pending'             then 0
    when 'reader'              then 1
    when 'tier_3'              then 2
    when 'tier_2'              then 3
    when 'tier_1'              then 4
    when 'verified_historian'  then 4
    when 'admin'               then 5
    else -1
  end;
$$;

-- 2. user_tier() now reads 'role' from JWT instead of 'tier', defaults to 'reader'.
create or replace function public.user_tier()
returns text
language sql
stable
security definer
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    'reader'
  );
$$;

-- 3. Create user_role() and has_role() as preferred aliases going forward.
create or replace function public.user_role()
returns text
language sql
stable
security definer
as $$
  select public.user_tier();
$$;

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
as $$
  select public.is_tier(required_role);
$$;

-- 4. Rename profiles.tier → profiles.role and migrate data.
alter table public.profiles rename column tier to role;

update public.profiles set role = case
  when role in ('tier_1', 'tier_2', 'tier_3') then 'verified_historian'
  when role = 'pending' then 'reader'
  else role  -- 'reader' and 'admin' stay as-is
end;

-- 5. Replace the CHECK constraint.
alter table public.profiles drop constraint if exists profiles_tier_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('reader', 'verified_historian', 'admin'));

-- 6. Update column comments.
comment on column public.profiles.role
  is 'Authorization role. Values: reader, verified_historian, admin.';

-- 7. Update handle_new_user() — all new users start as reader.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'reader'
  );
  return new;
end;
$$;

-- 8. Update custom_access_token_hook() — reads role, writes to app_metadata.role.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  claims    jsonb;
begin
  select role into user_role
  from public.profiles
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  claims := jsonb_set(
    claims,
    '{app_metadata}',
    coalesce(claims->'app_metadata', '{}'::jsonb)
      || jsonb_build_object('role', coalesce(user_role, 'reader'))
  );

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- 9. Update verification_requests RLS to use user_role() instead of user_tier().
--    (The existing policies already call user_tier() which now reads 'role' from JWT,
--     so they work. But rename for clarity.)
drop policy if exists "verification_requests: read own or admin" on public.verification_requests;
create policy "verification_requests: read own or admin"
  on public.verification_requests for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.user_role() = 'admin'
  );

drop policy if exists "verification_requests: admin update" on public.verification_requests;
create policy "verification_requests: admin update"
  on public.verification_requests for update
  to authenticated
  using  (public.user_role() = 'admin')
  with check (public.user_role() = 'admin');

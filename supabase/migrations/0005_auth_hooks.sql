create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_tier text;
  claims    jsonb;
begin
  select tier into user_tier
  from public.profiles
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  claims := jsonb_set(
    claims,
    '{app_metadata}',
    coalesce(claims->'app_metadata', '{}'::jsonb)
      || jsonb_build_object('tier', coalesce(user_tier, 'pending'))
  );

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_domain text;
  matched_tier text := 'pending';
begin
  email_domain := split_part(new.email, '@', 2);

  if exists (
    select 1 from public.approved_institutions
    where domain = email_domain
  ) then
    matched_tier := 'tier_1';
  end if;

  insert into public.profiles (id, username, display_name, tier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    matched_tier
  );

  return new;
end;
$$;

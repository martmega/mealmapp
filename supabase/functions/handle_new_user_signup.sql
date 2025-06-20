-- Updates subscription tier metadata for a new user
create or replace function public.handle_new_user_signup(user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update auth.users
  set raw_user_meta_data = jsonb_set(
    coalesce(raw_user_meta_data, '{}'),
    '{subscription_tier}',
    '"standard"',
    true
  )
  where id = user_id;
$$;

-- Assign default subscription tier on new user signup
update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{subscription_tier}',
  '"standard"'
)
where raw_user_meta_data->>'subscription_tier' is null;

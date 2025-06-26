alter table recipes enable row level security;

create policy "allow recipe owner" on recipes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "allow public recipes" on recipes
  for select
  using (visibility = 'public');

create policy "allow friends_only recipes" on recipes
  for select
  using (
    visibility = 'friends_only'
    and exists (
      select 1 from user_relationships ur
      where (
        (ur.requester_id = auth.uid() and ur.addressee_id = user_id)
        or (ur.addressee_id = auth.uid() and ur.requester_id = user_id)
      )
      and ur.status = 'accepted'
    )
  );

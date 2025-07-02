alter table recipes enable row level security;

do $$
begin
  if not exists (
    select from pg_policies
    where policyname = 'allow recipe owner'
      and tablename = 'recipes'
  ) then
    create policy "allow recipe owner" on recipes
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;


do $$
begin
  if not exists (
    select from pg_policies
    where policyname = 'allow public recipes'
      and tablename = 'recipes'
  ) then
    create policy "allow public recipes" on recipes
      for select
      using (visibility = 'public');
  end if;
end
$$;


do $$
begin
  if not exists (
    select from pg_policies
    where policyname = 'allow friends_only recipes'
      and tablename = 'recipes'
  ) then
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
  end if;
end
$$;


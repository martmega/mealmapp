# Row Level Security Policies

The project relies on Supabase RLS to secure most tables.

## recipes
- Users can insert, update and delete their own recipes.
- Public recipes are readable by anyone.
- "friends_only" recipes are visible to linked users.

## weekly_menus
- The owner (column `user_id`) can read and modify their menu.
- Users referenced in `menu_participants` can read a shared menu.

```sql
create policy "allow menu owner" on weekly_menus
  for all using ( auth.uid() = user_id );

create policy "allow menu participants" on weekly_menus
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from menu_participants mp
      where mp.menu_id = id and mp.user_id = auth.uid()
    )
  );
```

## weekly_menu_preferences
- Linked one-to-one with `weekly_menus` via `menu_id`.
- The menu owner and participants can read and update the preferences.

```sql
create policy "allow owner" on weekly_menu_preferences
  for all using (
    auth.uid() = (
      select user_id from weekly_menus wm where wm.id = menu_id
    )
    or exists (
      select 1 from menu_participants mp
      where mp.menu_id = menu_id and mp.user_id = auth.uid()
    )
  );
```

## user_relationships
- Rows are visible to the requester and the addressee only.
- Updates are restricted so that each participant can update the status of a relationship.

## access_keys
- Managed by server-side code. Regular users have no direct access.

## ia_usage
- Usage rows are created and updated by server functions.
- Users may read their own usage statistics.

## ia_credits
- Users can read and modify their own credit balance only.

## ia_credit_purchases
- Users may read their own purchase history.

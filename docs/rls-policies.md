# Row Level Security Policies

The project relies on Supabase RLS to secure most tables.

## recipes
- Users can insert, update and delete their own recipes.
- Public recipes are readable by anyone.
- "friends_only" recipes are visible to linked users.

## weekly_menus
- Only the owner (column `user_id`) can read or modify a menu.

## user_relationships
- Rows are visible to the requester and the addressee only.
- Updates are restricted so that each participant can update the status of a relationship.

## access_keys
- Managed by server-side code. Regular users have no direct access.

## ia_usage
- Usage rows are created and updated by server functions.
- Users may read their own usage statistics.

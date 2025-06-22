-- Schema setup for new shared menu system

-- Create menus table
create table if not exists public.menus (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  is_shared boolean default false,
  created_at timestamp with time zone default now()
);

-- Junction table linking menus to participants
create table if not exists public.menu_participants (
  menu_id uuid references public.menus(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (menu_id, user_id)
);

-- Link weekly menus to a specific menu
alter table if exists public.weekly_menus
add column if not exists menu_id uuid references public.menus(id) on delete cascade;

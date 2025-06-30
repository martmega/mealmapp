-- Public schema tables

create table recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  servings integer default 1,
  ingredients jsonb,
  instructions text,
  calories integer,
  meal_types text[],
  tags text[],
  visibility text default 'public',
  image_url text,
  estimated_price numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table weekly_menus (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  menu_data jsonb not null,
  is_shared boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table menu_participants (
  menu_id uuid references weekly_menus(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (menu_id, user_id)
);

-- Prevent adding participants to menus that are not shared
create function ensure_menu_shared()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from weekly_menus wm where wm.id = new.menu_id and wm.is_shared
  ) then
    raise exception 'menu % is not shared', new.menu_id;
  end if;
  return new;
end;
$$;

create trigger check_menu_is_shared
before insert on menu_participants
for each row execute function ensure_menu_shared();

create table weekly_menu_preferences (
  menu_id uuid primary key references weekly_menus(id) on delete cascade,
  portions_per_meal integer default 4,
  daily_calories_limit integer default 2200,
  weekly_budget numeric default 0,
  daily_meal_structure text[][],
  tag_preferences text[],
  common_menu_settings jsonb default '{}'::jsonb -- { enabled: boolean, linkedUsers: uuid[], linkedUserRecipes: uuid[] }
);

create table user_relationships (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid references auth.users(id) on delete cascade,
  addressee_id uuid references auth.users(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table access_keys (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  grants jsonb,
  used_by uuid references auth.users(id),
  used_at timestamptz
);

create table ia_usage (
  user_id uuid references auth.users(id) on delete cascade,
  month text not null,
  text_requests integer default 0,
  image_requests integer default 0,
  primary key (user_id, month)
);

create table ia_credits (
  user_id uuid references auth.users(id) on delete cascade,
  text_credits integer default 0,
  image_credits integer default 0,
  updated_at timestamptz default now(),
  primary key (user_id)
);

create table ia_credit_purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  stripe_session_id text unique not null,
  credits_type text not null,
  credits_amount integer not null,
  created_at timestamptz default now()
);

create table stripe_events (
  event_id text primary key,
  created_at timestamptz default now()
);

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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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

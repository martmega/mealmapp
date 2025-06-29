create table stripe_events (
  id text primary key,
  created_at timestamptz default now()
);

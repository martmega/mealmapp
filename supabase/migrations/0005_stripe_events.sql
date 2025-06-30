create table stripe_events (
  event_id text primary key,
  created_at timestamptz default now()
);

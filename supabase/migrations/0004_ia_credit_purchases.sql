create table ia_credit_purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  stripe_session_id text unique not null,
  credits_type text not null,
  credits_amount integer not null,
  created_at timestamptz default now()
);

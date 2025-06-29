CREATE TABLE ia_credit_purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id text NOT NULL,
  credit_type text NOT NULL,
  amount integer NOT NULL,
  purchased_at timestamptz DEFAULT now()
);

-- Basic RLS: users can read their own purchases
alter table ia_credit_purchases enable row level security;
create policy "allow read own" on ia_credit_purchases
  for select using (auth.uid() = user_id);

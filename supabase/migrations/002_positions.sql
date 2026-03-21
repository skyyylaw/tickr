-- ============================================================
-- Positions — track manually logged trades
-- ============================================================

create table positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  ticker text not null,
  shares numeric not null check (shares > 0),
  entry_price numeric not null check (entry_price > 0),
  entry_date date not null,
  notes text,
  created_at timestamptz default now() not null
);

create index idx_positions_user_id on positions(user_id);
create index idx_positions_ticker on positions(ticker);

-- RLS
alter table positions enable row level security;

create policy "Users can view own positions"
  on positions for select
  using (auth.uid() = user_id);

create policy "Users can insert own positions"
  on positions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own positions"
  on positions for update
  using (auth.uid() = user_id);

create policy "Users can delete own positions"
  on positions for delete
  using (auth.uid() = user_id);

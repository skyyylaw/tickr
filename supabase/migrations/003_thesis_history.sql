-- ============================================================
-- Thesis History — track profile changes over time
-- ============================================================

create table thesis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  changed_fields text[] not null default '{}',
  snapshot jsonb not null,
  created_at timestamptz default now() not null
);

create index idx_thesis_history_user_id on thesis_history(user_id);
create index idx_thesis_history_created_at on thesis_history(created_at desc);

-- RLS
alter table thesis_history enable row level security;

create policy "Users can view own thesis history"
  on thesis_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own thesis history"
  on thesis_history for insert
  with check (auth.uid() = user_id);

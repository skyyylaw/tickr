-- ============================================================
-- Tickr — Initial Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. user_profiles (1:1 with auth.users)
-- ============================================================
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  investment_goals text[] default '{}',
  time_horizon text check (time_horizon in ('short_term', 'medium_term', 'long_term')),
  risk_tolerance integer check (risk_tolerance between 1 and 10),
  capital_range text,
  sectors text[] default '{}',
  industries text[] default '{}',
  strategy_preferences text[] default '{}',
  check_frequency text check (check_frequency in ('multiple_daily', 'daily', 'few_times_week', 'weekly', 'monthly_or_less')),
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  interested_tickers text[] default '{}',
  constraints text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- 2. watchlist_items
-- ============================================================
create table watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  ticker text not null,
  added_at timestamptz default now() not null,
  notes text
);

-- ============================================================
-- 3. agent_runs (created before trade_ideas since trade_ideas references it)
-- ============================================================
create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('scheduled', 'manual', 'event')),
  triggering_event_data jsonb,
  user_thesis_snapshot jsonb,
  search_queries jsonb,
  retrieved_data jsonb,
  llm_prompt text,
  llm_response text,
  llm_model text,
  llm_latency_ms integer,
  total_latency_ms integer,
  tokens_used jsonb,
  success boolean not null default false,
  error_message text,
  created_at timestamptz default now() not null
);

-- ============================================================
-- 4. trade_ideas
-- ============================================================
create table trade_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  agent_run_id uuid references agent_runs(id) on delete set null,
  card_type text not null default 'trade_idea' check (card_type in ('trade_idea', 'earnings_digest')),
  ticker text,
  direction text check (direction in ('buy', 'sell', 'hold')),
  headline text,
  event_summary text,
  reasoning jsonb,
  risks jsonb,
  watch_for text,
  sources jsonb,
  confidence_score float check (confidence_score >= 0 and confidence_score <= 1),
  time_horizon text check (time_horizon in ('days', 'weeks', 'months')),
  triggering_event text,
  price_at_generation float,
  status text not null default 'active' check (status in ('active', 'dismissed', 'saved', 'expired')),
  extra_data jsonb,
  created_at timestamptz default now() not null
);

-- ============================================================
-- 5. digests (created before user_actions since user_actions references it)
-- ============================================================
create table digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  greeting text,
  sections jsonb,
  watch_today text,
  sources jsonb,
  agent_run_id uuid references agent_runs(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- 6. user_actions
-- ============================================================
create table user_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  trade_idea_id uuid references trade_ideas(id) on delete set null,
  digest_id uuid references digests(id) on delete set null,
  action_type text not null check (action_type in (
    'view', 'expand', 'save', 'dismiss',
    'thumbs_up', 'thumbs_down', 'share',
    'digest_thumbs_up', 'digest_thumbs_down'
  )),
  feedback_reason text,
  time_spent_ms integer,
  created_at timestamptz default now() not null
);

-- ============================================================
-- 7. price_snapshots
-- ============================================================
create table price_snapshots (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  price float not null,
  snapshot_type text not null check (snapshot_type in ('generation', '1d', '1w', '1m')),
  reference_trade_idea_id uuid references trade_ideas(id) on delete set null,
  captured_at timestamptz default now() not null
);

-- ============================================================
-- 8. api_cache
-- ============================================================
create table api_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique not null,
  value jsonb not null,
  source text not null check (source in ('finnhub', 'tavily', 'reader')),
  expires_at timestamptz not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- Indexes
-- ============================================================

-- user_id indexes for RLS-filtered queries
create index idx_watchlist_items_user_id on watchlist_items(user_id);
create index idx_agent_runs_user_id on agent_runs(user_id);
create index idx_trade_ideas_user_id on trade_ideas(user_id);
create index idx_trade_ideas_created_at on trade_ideas(created_at desc);
create index idx_digests_user_id on digests(user_id);
create index idx_user_actions_user_id on user_actions(user_id);
create index idx_price_snapshots_trade_idea on price_snapshots(reference_trade_idea_id);

-- api_cache indexes
create index idx_api_cache_cache_key on api_cache(cache_key);
create index idx_api_cache_expires_at on api_cache(expires_at);

-- ============================================================
-- Auto-update updated_at trigger for user_profiles
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_user_profiles_updated_at
  before update on user_profiles
  for each row
  execute function update_updated_at();

-- ============================================================
-- Auto-create user_profiles row on auth.users insert
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- ============================================================
-- Cleanup expired api_cache rows (call via pg_cron or scheduled function)
-- ============================================================
create or replace function cleanup_expired_cache()
returns void as $$
begin
  delete from api_cache where expires_at < now();
end;
$$ language plpgsql security definer;

-- ============================================================
-- Row Level Security
-- ============================================================

-- user_profiles: users can read/update only their own row
alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- watchlist_items
alter table watchlist_items enable row level security;

create policy "Users can view own watchlist"
  on watchlist_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own watchlist items"
  on watchlist_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own watchlist items"
  on watchlist_items for update
  using (auth.uid() = user_id);

create policy "Users can delete own watchlist items"
  on watchlist_items for delete
  using (auth.uid() = user_id);

-- agent_runs
alter table agent_runs enable row level security;

create policy "Users can view own agent runs"
  on agent_runs for select
  using (auth.uid() = user_id);

create policy "Users can insert own agent runs"
  on agent_runs for insert
  with check (auth.uid() = user_id);

-- trade_ideas
alter table trade_ideas enable row level security;

create policy "Users can view own trade ideas"
  on trade_ideas for select
  using (auth.uid() = user_id);

create policy "Users can insert own trade ideas"
  on trade_ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trade ideas"
  on trade_ideas for update
  using (auth.uid() = user_id);

-- digests
alter table digests enable row level security;

create policy "Users can view own digests"
  on digests for select
  using (auth.uid() = user_id);

create policy "Users can insert own digests"
  on digests for insert
  with check (auth.uid() = user_id);

-- user_actions
alter table user_actions enable row level security;

create policy "Users can view own actions"
  on user_actions for select
  using (auth.uid() = user_id);

create policy "Users can insert own actions"
  on user_actions for insert
  with check (auth.uid() = user_id);

-- price_snapshots: users can view snapshots for their own trade ideas
alter table price_snapshots enable row level security;

create policy "Users can view own price snapshots"
  on price_snapshots for select
  using (
    reference_trade_idea_id is null
    or exists (
      select 1 from trade_ideas
      where trade_ideas.id = price_snapshots.reference_trade_idea_id
      and trade_ideas.user_id = auth.uid()
    )
  );

create policy "Users can insert price snapshots for own ideas"
  on price_snapshots for insert
  with check (
    reference_trade_idea_id is null
    or exists (
      select 1 from trade_ideas
      where trade_ideas.id = price_snapshots.reference_trade_idea_id
      and trade_ideas.user_id = auth.uid()
    )
  );

-- api_cache: service role only (no user-facing policies)
alter table api_cache enable row level security;
-- No RLS policies = only service_role key can access this table

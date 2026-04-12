-- ============================================================
-- Generation Status — persist pipeline run state in DB
-- ============================================================

alter table user_profiles
  add column generation_status text not null default 'idle'
    check (generation_status in ('idle', 'running')),
  add column generation_started_at timestamptz;

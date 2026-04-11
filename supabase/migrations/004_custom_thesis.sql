-- ============================================================
-- Custom Thesis — free-text field for NLP context to the agent
-- ============================================================

alter table user_profiles
  add column custom_thesis text;

-- Add 'thesis-searcher' to the api_cache source check constraint.
-- The thesis searcher caches LLM-extracted queries with source='thesis-searcher',
-- which was rejected by the existing constraint.

alter table api_cache
  drop constraint api_cache_source_check;

alter table api_cache
  add constraint api_cache_source_check
  check (source in ('finnhub', 'tavily', 'reader', 'thesis-searcher'));

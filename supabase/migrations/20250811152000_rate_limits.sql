-- Shared rate limit table for Postgres-backed limiter
-- Safe to run multiple times

create table if not exists public.rate_limits (
  key text primary key,
  window_start integer not null,
  count integer not null default 0
);

create index if not exists idx_rate_limits_window on public.rate_limits(window_start);

-- Ensure no row level security blocks service role writes
alter table public.rate_limits disable row level security;



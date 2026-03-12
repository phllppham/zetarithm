-- Zetarithm Schema
-- Run this in your Supabase SQL Editor

create table if not exists public.leaderboard (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  username    text not null,
  score       integer not null,
  duration    integer not null default 60,
  created_at  timestamptz not null default now()
);

-- Add duration column if upgrading from old schema
alter table public.leaderboard add column if not exists duration integer not null default 60;

-- Indexes
create index if not exists leaderboard_score_idx on public.leaderboard (score desc);
create index if not exists leaderboard_user_duration_idx on public.leaderboard (user_id, duration);

-- Row Level Security
alter table public.leaderboard enable row level security;

-- Anyone can read the leaderboard
create policy "Public read access"
  on public.leaderboard
  for select
  using (true);

-- Authenticated users can insert their own scores
create policy "Authenticated users can insert own scores"
  on public.leaderboard
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Scores table — stores the single best score per user per duration.
-- The leaderboard table above keeps the full history; this table is
-- used for the profile page "Best Scores" cards.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.scores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  duration    integer not null,             -- 30 | 60 | 120 | 180
  score       integer not null,
  created_at  timestamptz not null default now(),

  -- One row per (user, duration) — enforced at DB level
  constraint scores_user_duration_key unique (user_id, duration)
);

-- Index for fast profile lookups
create index if not exists scores_user_id_idx on public.scores (user_id);

-- Row Level Security
alter table public.scores enable row level security;

-- Authenticated users can read their own scores
create policy "Users can read own scores"
  on public.scores
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can insert their own scores
create policy "Users can insert own scores"
  on public.scores
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Authenticated users can update their own scores
create policy "Users can update own scores"
  on public.scores
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

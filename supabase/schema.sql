-- Zetarithm Leaderboard Schema
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

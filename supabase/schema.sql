-- ZetaMath Leaderboard Schema
-- Run this in your Supabase SQL Editor

create table if not exists public.leaderboard (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  username    text not null,
  score       integer not null,
  created_at  timestamptz not null default now()
);

-- Index for leaderboard queries (sorted by score)
create index if not exists leaderboard_score_idx on public.leaderboard (score desc);

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

# ZetaMath

A fast-paced mental arithmetic speed game inspired by Zetamac. Answer as many arithmetic problems as you can in 60 seconds.

## Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend / Database**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel

## Features

- Random arithmetic problems: addition, subtraction, multiplication
- 60-second countdown timer with animated ring
- Score and streak tracking
- Leaderboard (top 50 scores, sorted by score)
- Authentication: GitHub, Google, Email/Password via Supabase Auth
- Scores saved to Supabase only when logged in
- Glassmorphism UI with dark background

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/zetamath.git
cd zetamath
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. In **Authentication → Providers**, enable:
   - **Email** (enabled by default)
   - **GitHub** — create an OAuth App at [github.com/settings/developers](https://github.com/settings/developers)
   - **Google** — create credentials at [console.cloud.google.com](https://console.cloud.google.com)
4. Add your Supabase redirect URL to each OAuth provider:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.vercel.app/auth/callback`

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these values in your Supabase dashboard under **Project Settings → API**.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
/app
  /game              Game page (game engine)
  /leaderboard       Leaderboard page (server component)
  /login             Auth page (email + OAuth)
  /auth/callback     OAuth redirect handler
  layout.tsx
  page.tsx           Home page
/components
  BackgroundOrbs.tsx Animated background
  GlassCard.tsx      Glassmorphism card container
  Navbar.tsx         Navigation bar with auth state
  TimerRing.tsx      Circular countdown timer
/lib
  supabaseClient.ts  Browser Supabase client
  supabaseServer.ts  Server Supabase client
/utils
  generateQuestion.ts Question generator
/types
  index.ts           Shared TypeScript types
/supabase
  schema.sql         Database schema
```

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Database Schema

```sql
create table public.leaderboard (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  username    text not null,
  score       integer not null,
  created_at  timestamptz default now()
);
```

Row Level Security is enabled:
- Anyone can **read** scores
- Only authenticated users can **insert** their own scores

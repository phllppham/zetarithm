# Zetarithm

A modern **real-time arithmetic speed game** inspired by Zetamac.  
Players answer as many math problems as possible within **60 seconds**, with scores saved to a global leaderboard.

Built as a **full-stack web app** with authentication, persistent user profiles, and a Supabase-powered leaderboard.

---

## Stack

- **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS  
- **Backend / Database:** Supabase (PostgreSQL + Auth)  
- **Hosting:** Vercel  

---

## Features

- Random arithmetic problems (addition, subtraction, multiplication)
- 60-second real-time gameplay with animated countdown timer
- Score and streak tracking
- Global leaderboard showing **top 50 scores**
- Authentication via **GitHub, Google, or Email/Password**
- Scores saved to **Supabase PostgreSQL database**
- Persistent user profiles linked to Supabase Auth
- Glassmorphism UI with animated background

---

## Demo

Play the deployed version:

```
https://www.zetarithm.com/
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/phllppham/zetarithm
cd zetarithm
npm install
```

---

## 2. Set up Supabase

1. Create a project at  
https://supabase.com

2. Open **SQL Editor** and run:

```
supabase/schema.sql
```

3. In **Authentication → Providers**, enable:

- Email (enabled by default)
- GitHub OAuth
- Google OAuth

4. Add redirect URLs:

Local:

```
http://localhost:3000/auth/callback
```

Production:

```
https://your-domain.vercel.app/auth/callback
```

---

## 3. Configure environment variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These values are found in:

```
Supabase → Project Settings → API
```

---

## 4. Run locally

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## Project Structure

```
/app
  /game              Game engine and gameplay logic
  /leaderboard       Server-rendered leaderboard page
  /login             Authentication page
  /auth/callback     OAuth redirect handler
  layout.tsx
  page.tsx           Landing page

/components
  BackgroundOrbs.tsx Animated background
  GlassCard.tsx      Glass UI container
  Navbar.tsx         Navigation + auth state
  TimerRing.tsx      Circular countdown timer

/lib
  supabaseClient.ts  Browser Supabase client
  supabaseServer.ts  Server Supabase client

/utils
  generateQuestion.ts Arithmetic question generator

/types
  index.ts           Shared TypeScript types

/supabase
  schema.sql         Database schema
```

---

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

Row Level Security (RLS):

- Anyone can **read leaderboard scores**
- Only **authenticated users** can insert scores
- Users can only insert scores associated with their own account

---

## Deployment

1. Push repository to GitHub
2. Import the project in:

```
https://vercel.com
```

3. Add environment variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

4. Deploy.

---

## Future Improvements

- Weekly leaderboard resets
- Difficulty scaling
- Player statistics dashboard
- Multiplayer race mode
- Mobile UI optimizations

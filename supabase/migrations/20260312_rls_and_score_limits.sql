-- RLS + Max Score Enforcement
-- Run in Supabase SQL Editor

-- ── 1. Ensure RLS is enabled ─────────────────────────────────────────────────
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- ── 2. Scores: Public read (for leaderboard), restrict write to own rows ───────
-- Leaderboard needs to read ALL scores; current policy may only allow "own scores"
DROP POLICY IF EXISTS "Users can read own scores" ON public.scores;
CREATE POLICY "Public read scores"
  ON public.scores FOR SELECT USING (true);

-- Insert: only own user_id, and score must be valid
DROP POLICY IF EXISTS "Users can insert own scores" ON public.scores;
CREATE POLICY "Users can insert own scores"
  ON public.scores FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND score >= 0
    AND score <= duration * 10
    AND (all_ops_score IS NULL OR (all_ops_score >= 0 AND all_ops_score <= duration * 10))
  );

DROP POLICY IF EXISTS "Users can update own scores" ON public.scores;
CREATE POLICY "Users can update own scores"
  ON public.scores FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND score >= 0
    AND score <= duration * 10
    AND (all_ops_score IS NULL OR (all_ops_score >= 0 AND all_ops_score <= duration * 10))
  );

-- ── 3. Leaderboard: restrict insert to valid scores ───────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert own scores" ON public.leaderboard;
CREATE POLICY "Authenticated users can insert own scores"
  ON public.leaderboard FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND score >= 0
    AND score <= duration * 10
  );

-- ── 4. Add CHECK constraints for max score (backstop) ─────────────────────────
ALTER TABLE public.scores
  DROP CONSTRAINT IF EXISTS scores_score_max,
  DROP CONSTRAINT IF EXISTS scores_all_ops_score_max;

ALTER TABLE public.scores
  ADD CONSTRAINT scores_score_max CHECK (score <= duration * 10);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scores' AND column_name = 'all_ops_score'
  ) THEN
    ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_all_ops_score_max;
    ALTER TABLE public.scores
      ADD CONSTRAINT scores_all_ops_score_max
      CHECK (all_ops_score IS NULL OR all_ops_score <= duration * 10);
  END IF;
END $$;

ALTER TABLE public.leaderboard
  DROP CONSTRAINT IF EXISTS leaderboard_score_max;

ALTER TABLE public.leaderboard
  ADD CONSTRAINT leaderboard_score_max CHECK (score <= duration * 10);

-- ── 5. Clean existing invalid data ───────────────────────────────────────────
DELETE FROM public.scores
WHERE score > duration * 10
   OR (all_ops_score IS NOT NULL AND all_ops_score > duration * 10);

DELETE FROM public.leaderboard
WHERE score > duration * 10;

NOTIFY pgrst, 'reload schema';

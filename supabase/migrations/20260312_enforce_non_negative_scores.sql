-- Enforce score >= 0 in database
-- Run this in Supabase SQL Editor
-- Requires: scores table with all_ops_score column (add via ALTER if missing)

-- Step 1: Clean invalid data
-- Delete rows where main score is negative (corrupt)
DELETE FROM public.scores WHERE score < 0;

-- Null out negative all_ops_score (removes from leaderboard, keeps profile score)
UPDATE public.scores SET all_ops_score = NULL
WHERE all_ops_score IS NOT NULL AND all_ops_score < 0;

-- Remove impossible scores (over max = duration * 10)
DELETE FROM public.scores
WHERE (duration = 30  AND (score > 300  OR (all_ops_score IS NOT NULL AND all_ops_score > 300)))
   OR (duration = 60  AND (score > 600  OR (all_ops_score IS NOT NULL AND all_ops_score > 600)))
   OR (duration = 120 AND (score > 1200 OR (all_ops_score IS NOT NULL AND all_ops_score > 1200)))
   OR (duration = 180 AND (score > 1800 OR (all_ops_score IS NOT NULL AND all_ops_score > 1800)));

DELETE FROM public.leaderboard
WHERE score < 0
   OR (duration = 30  AND score > 300)
   OR (duration = 60  AND score > 600)
   OR (duration = 120 AND score > 1200)
   OR (duration = 180 AND score > 1800);

-- Step 2: Add CHECK constraints (skip if all_ops_score column doesn't exist yet)
ALTER TABLE public.scores
  DROP CONSTRAINT IF EXISTS scores_score_non_negative;

ALTER TABLE public.scores
  ADD CONSTRAINT scores_score_non_negative CHECK (score >= 0);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scores' AND column_name = 'all_ops_score'
  ) THEN
    ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_all_ops_score_non_negative;
    ALTER TABLE public.scores
      ADD CONSTRAINT scores_all_ops_score_non_negative
      CHECK (all_ops_score IS NULL OR all_ops_score >= 0);
  END IF;
END $$;

ALTER TABLE public.leaderboard
  DROP CONSTRAINT IF EXISTS leaderboard_score_non_negative;

ALTER TABLE public.leaderboard
  ADD CONSTRAINT leaderboard_score_non_negative CHECK (score >= 0);

NOTIFY pgrst, 'reload schema';

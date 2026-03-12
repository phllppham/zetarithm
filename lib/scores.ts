import { createClient } from "@/lib/supabaseClient";
import type { BestScores } from "@/types";

/**
 * Persist a game result to the `scores` table (best-score-per-duration store)
 * and the `leaderboard` table (full history for the public leaderboard page).
 *
 * Scores logic:
 *   - No existing row  → insert
 *   - Existing row, new score is higher → update
 *   - Existing row, new score is equal or lower → do nothing
 *
 * This function re-verifies the session before writing so anonymous users
 * cannot spoof a submission.
 */
export async function saveScore(duration: number, score: number): Promise<void> {
  const supabase = createClient();

  // Server-validate the session before any write
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // ── 1. Update `scores` table (best only) ──────────────────────────────────
  // Fetch the current best so we can skip writing a lower score
  const { data: existing, error: fetchError } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", user.id)
    .eq("duration", duration)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Could not read scores table: ${fetchError.message}. Make sure the scores table exists in Supabase.`);
  }

  if (!existing || score > existing.score) {
    // Upsert: insert on first play, update only when the new score is higher.
    // The unique constraint on (user_id, duration) makes onConflict work correctly.
    const { error: upsertError } = await supabase
      .from("scores")
      .upsert(
        { user_id: user.id, duration, score, created_at: new Date().toISOString() },
        { onConflict: "user_id,duration" }
      );

    if (upsertError) throw new Error(`Failed to save score: ${upsertError.message}`);
  }
  // else: existing score is equal or higher — do nothing

  // ── 2. Append to `leaderboard` table (full history) ───────────────────────
  const username =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.user_name ||
    user.email?.split("@")[0] ||
    "Anonymous";

  const { error: leaderboardError } = await supabase
    .from("leaderboard")
    .insert({ user_id: user.id, username, score, duration });

  if (leaderboardError) {
    // Non-fatal — profile scores are already saved; log but don't throw
    console.error("Leaderboard insert failed:", leaderboardError.message);
  }
}

/**
 * Return the authenticated user's best score for each standard duration.
 * Returns null for any duration where no score has been recorded yet.
 *
 * Usage:
 *   const best = await getBestScores();
 *   // { 30: null, 60: 42, 120: 31, 180: null }
 */
export async function getBestScores(): Promise<BestScores> {
  const empty: BestScores = { 30: null, 60: null, 120: null, 180: null };

  const supabase = createClient();

  // Server-validate the session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return empty;

  const { data, error } = await supabase
    .from("scores")
    .select("duration, score")
    .eq("user_id", user.id)
    .in("duration", [30, 60, 120, 180]);

  if (error || !data) return empty;

  const result: BestScores = { 30: null, 60: null, 120: null, 180: null };
  for (const row of data) {
    if (row.duration in result) {
      result[row.duration as keyof BestScores] = row.score;
    }
  }
  return result;
}

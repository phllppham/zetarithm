import { createClient } from "@/lib/supabaseClient";
import type { BestScores } from "@/types";

function deriveUsername(user: { user_metadata?: Record<string, string>; email?: string }): string {
  return (
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.user_name ||
    user.email?.split("@")[0] ||
    "Player"
  );
}

/**
 * Persist a game result.
 *
 * - `scores`   → upsert best score per (user, duration)
 * - `profiles` → upsert the user's current display name so the leaderboard
 *                always has a real name to show
 * - `leaderboard` → append full history entry (non-fatal if it fails)
 */
export async function saveScore(duration: number, score: number): Promise<void> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const username = deriveUsername(user);

  // ── 1. scores table (best-per-duration) ───────────────────────────────────
  const { data: existing, error: fetchError } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", user.id)
    .eq("duration", duration)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Could not read scores table: ${fetchError.message}`);
  }

  // Always upsert so that username stays current (e.g. after a display-name change)
  // and only advance the score when it's a new best.
  const newBest = !existing || score > existing.score;
  const { error: upsertError } = await supabase
    .from("scores")
    .upsert(
      {
        user_id: user.id,
        duration,
        score: newBest ? score : existing!.score,
        username,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,duration" }
    );
  if (upsertError) throw new Error(`Failed to save score: ${upsertError.message}`);

  // ── 2. leaderboard table (full game history, optional) ────────────────────
  const { error: leaderboardError } = await supabase
    .from("leaderboard")
    .insert({ user_id: user.id, username, score, duration });

  if (leaderboardError) {
    console.warn("Leaderboard history insert failed:", leaderboardError.message);
  }
}

/**
 * Return the authenticated user's best score for each standard duration.
 */
export async function getBestScores(): Promise<BestScores> {
  const empty: BestScores = { 30: null, 60: null, 120: null, 180: null };

  const supabase = createClient();
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

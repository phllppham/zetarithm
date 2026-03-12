import { createClient } from "@/lib/supabaseClient";
import type { BestScores } from "@/types";

const ALL_OPERATORS = ["+", "−", "×", "÷"] as const;

function deriveUsername(user: { user_metadata?: Record<string, string>; email?: string }): string {
  return (
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.user_name ||
    user.email?.split("@")[0] ||
    "Player"
  );
}

/** Returns true only when all four operations are enabled. */
export function isAllOps(ops: string[]): boolean {
  return ALL_OPERATORS.every((op) => ops.includes(op));
}

/**
 * Persist a game result.
 *
 * - `scores.score`         → best score ever for this (user, duration), any ops
 * - `scores.all_ops_score` → best score achieved with all 4 ops enabled (leaderboard-eligible)
 * - `leaderboard`          → full game history entry (non-fatal)
 */
export async function saveScore(
  duration: number,
  score: number,
  ops: string[],
): Promise<void> {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const username = deriveUsername(user);
  const allOps = isAllOps(ops);

  // ── Fetch existing row ────────────────────────────────────────────────────
  const { data: existing, error: fetchError } = await supabase
    .from("scores")
    .select("score, all_ops_score")
    .eq("user_id", user.id)
    .eq("duration", duration)
    .maybeSingle();

  if (fetchError) throw new Error(`Could not read scores table: ${fetchError.message}`);

  const currentBest = existing?.score ?? null;
  const currentAllOpsBest = existing?.all_ops_score ?? null;

  const newOverallBest = currentBest === null || score > currentBest;
  const newAllOpsBest = allOps && (currentAllOpsBest === null || score > currentAllOpsBest);

  // Only write if something actually improved
  if (newOverallBest || newAllOpsBest) {
    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      duration,
      username,
      created_at: new Date().toISOString(),
      // Keep the higher of old vs new overall best
      score: newOverallBest ? score : currentBest!,
    };

    // Only advance all_ops_score when playing with all ops
    if (newAllOpsBest) {
      upsertData.all_ops_score = score;
    }

    const { error: upsertError } = await supabase
      .from("scores")
      .upsert(upsertData, { onConflict: "user_id,duration" });

    if (upsertError) throw new Error(`Failed to save score: ${upsertError.message}`);
  } else {
    // Score didn't improve but keep username current
    const { error: nameError } = await supabase
      .from("scores")
      .update({ username })
      .eq("user_id", user.id)
      .eq("duration", duration);
    if (nameError) console.warn("Username update failed:", nameError.message);
  }

  // ── Leaderboard history (non-fatal) ───────────────────────────────────────
  const { error: leaderboardError } = await supabase
    .from("leaderboard")
    .insert({ user_id: user.id, username, score, duration });

  if (leaderboardError) {
    console.warn("Leaderboard history insert failed:", leaderboardError.message);
  }
}

/**
 * Return the authenticated user's best overall score for each standard duration.
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

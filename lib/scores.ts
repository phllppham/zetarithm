import { createClient } from "@/lib/supabaseClient";
import type { BestScores } from "@/types";

const ALL_OPERATORS = ["+", "−", "×", "÷"] as const;
const RATE_LIMIT_MS = 2000;

let lastSaveTime = 0;

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

/** Max valid score = duration * 5. Rejects impossible speeds (~5 correct/sec). */
function isValidScore(duration: number, score: number): boolean {
  const maxScore = duration * 5;
  return score >= 0 && score <= maxScore;
}

/**
 * Persist a game result.
 *
 * - Requires authenticated user (session.user.id)
 * - Validates score <= duration * 10
 * - Rate limit: no save within 2 seconds of previous save
 * - Only stores best score per (user, duration)
 */
export async function saveScore(
  duration: number,
  score: number,
  ops: string[],
): Promise<void> {
  const supabase = createClient();

  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) throw new Error("Not authenticated");

  const user = session.user;
  const userId = user.id;

  if (!isValidScore(duration, score)) {
    console.log("Invalid score rejected");
    throw new Error("Invalid score");
  }

  const now = Date.now();
  if (now - lastSaveTime < RATE_LIMIT_MS) {
    console.log("Invalid score rejected");
    throw new Error("Please wait before saving again");
  }

  const username = deriveUsername(user);
  const allOps = isAllOps(ops);

  // ── Fetch existing row ────────────────────────────────────────────────────
  const { data: existing, error: fetchError } = await supabase
    .from("scores")
    .select("score, all_ops_score")
    .eq("user_id", userId)
    .eq("duration", duration)
    .maybeSingle();

  if (fetchError) throw new Error(`Could not read scores table: ${fetchError.message}`);

  const currentBest = existing?.score ?? null;
  const currentAllOpsBest = existing?.all_ops_score ?? null;

  const newOverallBest = currentBest === null || score > currentBest;
  const newAllOpsBest = allOps && (currentAllOpsBest === null || score > currentAllOpsBest);

  // Only write if something actually improved
  if (newOverallBest || newAllOpsBest) {
    lastSaveTime = Date.now();

    const upsertData: Record<string, unknown> = {
      user_id: userId,
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
      .eq("user_id", userId)
      .eq("duration", duration);
    if (nameError) console.warn("Username update failed:", nameError.message);
  }

  // ── Leaderboard history (non-fatal) ───────────────────────────────────────
  // Only append if score is valid (defense in depth)
  if (score >= 0) {
    const { error: leaderboardError } = await supabase
      .from("leaderboard")
      .insert({ user_id: userId, username, score, duration });

    if (leaderboardError) {
      console.warn("Leaderboard history insert failed:", leaderboardError.message);
    }
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
    const max = row.duration * 5;
    if (row.duration in result && row.score >= 0 && row.score <= max) {
      result[row.duration as keyof BestScores] = row.score;
    }
  }
  return result;
}

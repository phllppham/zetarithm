import { supabase } from "@/lib/supabase";

export interface LeaderboardRow {
  id: string;
  username: string;
  score: number;
  created_at: string;
}

/**
 * Submit a score to the leaderboard.
 * Inserts a new row — each submission is a separate entry.
 */
export async function submitScore(username: string, score: number): Promise<void> {
  const { error } = await supabase
    .from("leaderboard")
    .insert({ username, score });

  if (error) throw new Error(error.message);
}

/**
 * Fetch the top N scores, ordered by highest score first.
 */
export async function getTopScores(limit = 50): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("id, username, score, created_at")
    .order("score", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

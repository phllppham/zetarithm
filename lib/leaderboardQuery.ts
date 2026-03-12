import { createClient } from "@/lib/supabaseClient";

export interface LeaderboardRow {
  user_id: string;
  username: string;
  score: number;
}

export interface UserPlacement {
  rank: number;
  score: number;
  username: string;
}

/**
 * Fetch the top `limit` best scores for a given duration.
 *
 * `currentUserId` / `currentUserName` — when provided, the current user's row
 * is always shown with their live display name instead of whatever is stored in
 * the DB (handles empty backfill rows and display-name changes instantly).
 */
export async function getTopScores(
  duration: number,
  limit: number,
  currentUserId?: string,
  currentUserName?: string,
): Promise<{ rows: LeaderboardRow[]; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("scores")
    .select("user_id, username, score")
    .eq("duration", duration)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) return { rows: [], error: error.message };

  // Build initial rows, using the live display name override for the current user
  const rows: LeaderboardRow[] = (data ?? []).map((r) => {
    const isCurrentUser = currentUserId && r.user_id === currentUserId;
    return {
      user_id: r.user_id,
      username: isCurrentUser && currentUserName ? currentUserName : (r.username || ""),
      score: r.score,
    };
  });

  // For any rows still missing a username, try the leaderboard table as fallback
  const missingIds = rows.filter((r) => !r.username).map((r) => r.user_id);
  if (missingIds.length > 0) {
    const { data: lbData } = await supabase
      .from("leaderboard")
      .select("user_id, username")
      .in("user_id", missingIds)
      .not("username", "is", null)
      .neq("username", "")
      .order("created_at", { ascending: false })
      .limit(missingIds.length * 10);

    const lbMap: Record<string, string> = {};
    for (const r of lbData ?? []) {
      if (!lbMap[r.user_id]) lbMap[r.user_id] = r.username;
    }

    for (const row of rows) {
      if (!row.username) row.username = lbMap[row.user_id] || "Player";
    }
  }

  return { rows, error: null };
}

/**
 * Find the current user's rank and best score for a given duration.
 * Returns null if the user has no score for that duration.
 */
export async function getUserPlacement(
  userId: string,
  duration: number,
  displayName?: string,
): Promise<UserPlacement | null> {
  const supabase = createClient();

  const { data: myScore, error: myError } = await supabase
    .from("scores")
    .select("username, score")
    .eq("user_id", userId)
    .eq("duration", duration)
    .maybeSingle();

  if (myError || !myScore) return null;

  const { count, error: countError } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .eq("duration", duration)
    .gt("score", myScore.score);

  if (countError) return null;

  // Resolve username: live override → scores row → leaderboard fallback
  let username = displayName || myScore.username || "";
  if (!username) {
    const { data: lbRow } = await supabase
      .from("leaderboard")
      .select("username")
      .eq("user_id", userId)
      .not("username", "is", null)
      .neq("username", "")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    username = lbRow?.username || "Player";
  }

  return {
    rank: (count ?? 0) + 1,
    score: myScore.score,
    username,
  };
}

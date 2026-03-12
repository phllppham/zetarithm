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
 * Fetch the top `limit` all-ops scores for a given duration.
 * Only rows where `all_ops_score IS NOT NULL` are included — i.e. scores
 * achieved with all four operations enabled.
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
    .select("user_id, username, all_ops_score")
    .eq("duration", duration)
    .not("all_ops_score", "is", null)
    .order("all_ops_score", { ascending: false })
    .limit(limit);

  if (error) return { rows: [], error: error.message };

  const rows: LeaderboardRow[] = (data ?? []).map((r) => {
    const isCurrentUser = currentUserId && r.user_id === currentUserId;
    return {
      user_id: r.user_id,
      username: isCurrentUser && currentUserName ? currentUserName : (r.username || ""),
      score: r.all_ops_score as number,
    };
  });

  // For any rows still missing a username, fall back to leaderboard history
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
 * Find the current user's all-ops rank and best all-ops score for a duration.
 * Returns null if the user has no all-ops score for that duration.
 */
export async function getUserPlacement(
  userId: string,
  duration: number,
  displayName?: string,
): Promise<UserPlacement | null> {
  const supabase = createClient();

  const { data: myRow, error: myError } = await supabase
    .from("scores")
    .select("username, all_ops_score")
    .eq("user_id", userId)
    .eq("duration", duration)
    .not("all_ops_score", "is", null)
    .maybeSingle();

  if (myError || !myRow || myRow.all_ops_score === null) return null;

  // Count players with a higher all-ops score
  const { count, error: countError } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .eq("duration", duration)
    .not("all_ops_score", "is", null)
    .gt("all_ops_score", myRow.all_ops_score);

  if (countError) return null;

  let username = displayName || myRow.username || "";
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
    score: myRow.all_ops_score,
    username,
  };
}

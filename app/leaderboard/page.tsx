import GlassCard from "@/components/GlassCard";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { LeaderboardEntry } from "@/types";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("leaderboard")
    .select("id, user_id, username, score, created_at")
    .order("score", { ascending: false })
    .limit(50);

  const entries: LeaderboardEntry[] = data ?? [];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 py-12">
      <GlassCard className="w-full max-w-2xl px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            <p className="text-white/35 text-sm mt-1">Top 50 scores of all time</p>
          </div>
          <a
            href="/game"
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all"
          >
            Play Now
          </a>
        </div>

        {error && (
          <p className="text-red-400/70 text-sm text-center py-8">
            Failed to load leaderboard. Make sure the database table exists.
          </p>
        )}

        {!error && entries.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/30 text-4xl mb-3">🏆</p>
            <p className="text-white/50">No scores yet. Be the first!</p>
            <a href="/game" className="text-white/40 text-sm underline hover:text-white/60 mt-2 inline-block">
              Start playing →
            </a>
          </div>
        )}

        {entries.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/8">
            {/* Header */}
            <div className="grid grid-cols-[2.5rem_1fr_5rem_9rem] gap-4 px-4 py-3 border-b border-white/8 bg-white/3">
              <div className="text-white/30 text-xs font-medium">#</div>
              <div className="text-white/30 text-xs font-medium">Player</div>
              <div className="text-white/30 text-xs font-medium text-right">Score</div>
              <div className="text-white/30 text-xs font-medium text-right">Date</div>
            </div>

            {/* Rows */}
            {entries.map((entry, index) => {
              const rank = index + 1;
              const rankDisplay =
                rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

              const date = new Date(entry.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={entry.id}
                  className={`
                    grid grid-cols-[2.5rem_1fr_5rem_9rem] gap-4 px-4 py-3.5
                    border-b border-white/5 last:border-0
                    ${rank <= 3 ? "bg-white/[0.02]" : ""}
                    hover:bg-white/[0.03] transition-colors
                  `}
                >
                  <div className="text-white/50 text-sm font-medium flex items-center">
                    {typeof rankDisplay === "string" ? (
                      <span className="text-base leading-none">{rankDisplay}</span>
                    ) : (
                      <span className="text-white/35">{rankDisplay}</span>
                    )}
                  </div>
                  <div className="text-white/90 text-sm font-medium truncate flex items-center">
                    {entry.username}
                  </div>
                  <div className="text-white text-sm font-bold text-right flex items-center justify-end tabular-nums">
                    {entry.score}
                  </div>
                  <div className="text-white/30 text-xs text-right flex items-center justify-end">
                    {date}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

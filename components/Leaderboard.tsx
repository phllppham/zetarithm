"use client";

import { useEffect, useState } from "react";
import { getTopScores, type LeaderboardRow } from "@/lib/leaderboard";

interface LeaderboardProps {
  limit?: number;
}

export default function Leaderboard({ limit = 50 }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTopScores(limit)
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return <p className="text-white/40 text-sm text-center py-8">Loading...</p>;
  }

  if (error) {
    return <p className="text-red-400/70 text-sm text-center py-8">{error}</p>;
  }

  if (entries.length === 0) {
    return <p className="text-white/30 text-sm text-center py-8">No scores yet. Be the first!</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/8">
      {/* Header */}
      <div className="grid grid-cols-[2.5rem_1fr_5rem_9rem] gap-4 px-4 py-3 border-b border-white/8 bg-white/3">
        <div className="text-white/30 text-xs font-medium">#</div>
        <div className="text-white/30 text-xs font-medium">Player</div>
        <div className="text-white/30 text-xs font-medium text-right">Score</div>
        <div className="text-white/30 text-xs font-medium text-right">Date</div>
      </div>

      {entries.map((entry, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
        const date = new Date(entry.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <div
            key={entry.id}
            className={`grid grid-cols-[2.5rem_1fr_5rem_9rem] gap-4 px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors ${rank <= 3 ? "bg-white/[0.02]" : ""}`}
          >
            <div className="text-white/50 text-sm flex items-center">
              {medal ? <span className="text-base leading-none">{medal}</span> : <span className="text-white/35">{rank}</span>}
            </div>
            <div className="text-white/90 text-sm font-medium truncate flex items-center">{entry.username}</div>
            <div className="text-white text-sm font-bold text-right flex items-center justify-end tabular-nums">{entry.score}</div>
            <div className="text-white/30 text-xs text-right flex items-center justify-end">{date}</div>
          </div>
        );
      })}
    </div>
  );
}

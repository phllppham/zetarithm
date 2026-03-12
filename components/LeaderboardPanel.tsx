"use client";

import { useEffect, useState, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { getDisplayName } from "@/lib/auth";
import { getTopScores, getUserPlacement } from "@/lib/leaderboardQuery";
import type { LeaderboardRow, UserPlacement } from "@/lib/leaderboardQuery";

const DURATIONS = [30, 60, 120, 180] as const;
type Duration = typeof DURATIONS[number];

interface LeaderboardPanelProps {
  onClose: () => void;
  onViewFull?: () => void;
}

export default function LeaderboardPanel({ onClose, onViewFull }: LeaderboardPanelProps) {
  const { user } = useAuthModal();
  const [selectedDuration, setSelectedDuration] = useState<Duration>(120);
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);
  const [userRow, setUserRow] = useState<UserPlacement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async (duration: Duration) => {
    setLoading(true);
    setError(null);

    const liveDisplayName = user ? getDisplayName(user) : undefined;
    const { rows, error: fetchError } = await getTopScores(duration, 10, user?.id, liveDisplayName);
    if (fetchError) { setError(fetchError); setLoading(false); return; }

    setEntries(rows);

    if (user) {
      const inTop = rows.some((r) => r.user_id === user.id);
      if (inTop) {
        setUserRow(null);
      } else {
        const placement = await getUserPlacement(user.id, duration, liveDisplayName);
        setUserRow(placement);
      }
    } else {
      setUserRow(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchScores(selectedDuration); }, [selectedDuration, fetchScores]);

  return (
    <GlassCard className="w-72 px-5 py-7 flex flex-col gap-4 self-stretch">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/30 text-xs mb-0.5">Top 10</p>
          <p className="text-white font-semibold text-sm">Leaderboard</p>
        </div>
        <button
          onClick={onClose}
          className="text-white/25 hover:text-white/60 transition-colors text-base leading-none flex-shrink-0"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Duration tabs */}
      <div className="flex gap-1.5">
        {DURATIONS.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDuration(d)}
            className={`flex-1 py-1 rounded-lg border text-xs font-semibold transition-all duration-150 ${
              selectedDuration === d
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/6 bg-white/3 text-white/30 hover:text-white/50 hover:border-white/12"
            }`}
          >
            {d}s
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
        {loading && <p className="text-white/25 text-xs text-center py-8">Loading…</p>}
        {!loading && error && <p className="text-red-400/60 text-xs text-center py-8">{error}</p>}
        {!loading && !error && entries.length === 0 && (
          <p className="text-white/25 text-xs text-center py-8">No scores yet for {selectedDuration}s.</p>
        )}

        {!loading && !error && entries.map((entry, i) => {
          const rank = i + 1;
          const isUser = user?.id === entry.user_id;
          const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors ${
                isUser        ? "border-blue-400/25 bg-blue-400/8"
                : rank === 1  ? "border-yellow-300/20 bg-yellow-300/8"
                : rank === 2  ? "border-white/12 bg-white/[0.05]"
                : rank === 3  ? "border-white/8 bg-white/[0.03]"
                : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="w-5 text-center flex-shrink-0">
                {medal
                  ? <span className="text-sm leading-none">{medal}</span>
                  : <span className="text-white/30 text-xs tabular-nums">{rank}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isUser ? "text-blue-200/90" : "text-white/80"}`}>
                  {entry.username}{isUser && " (you)"}
                </p>
              </div>
              <div className={`font-bold text-sm tabular-nums flex-shrink-0 ${
                rank === 1 ? "text-yellow-200" : rank <= 3 ? "text-white" : "text-white/80"
              }`}>
                {entry.score}
              </div>
            </div>
          );
        })}

        {/* User placement when outside top 10 */}
        {!loading && !error && userRow && (
          <>
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-white/20 text-[10px]">your best</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-blue-400/25 bg-blue-400/8">
              <div className="w-5 text-center flex-shrink-0">
                <span className="text-white/35 text-xs tabular-nums">#{userRow.rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-blue-200/90 text-xs font-medium truncate">{userRow.username} (you)</p>
              </div>
              <div className="text-blue-200/90 font-bold text-sm tabular-nums">{userRow.score}</div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/8">
        <button
          onClick={onViewFull}
          className="text-white/25 text-xs hover:text-white/55 transition-colors"
        >
          View full leaderboard →
        </button>
      </div>
    </GlassCard>
  );
}

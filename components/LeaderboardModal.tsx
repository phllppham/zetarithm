"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { getDisplayName } from "@/lib/auth";
import { getTopScores, getUserPlacement } from "@/lib/leaderboardQuery";
import type { LeaderboardRow, UserPlacement } from "@/lib/leaderboardQuery";

const DURATIONS = [30, 60, 120, 180] as const;
type Duration = typeof DURATIONS[number];

interface LeaderboardModalProps {
  onClose: () => void;
}

export default function LeaderboardModal({ onClose }: LeaderboardModalProps) {
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
    const { rows, error: fetchError } = await getTopScores(duration, 50, user?.id, liveDisplayName);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-[520px] max-w-[95vw] sm:max-w-[92vw] max-h-[85dvh] sm:max-h-[82vh] flex flex-col rounded-2xl border border-white/10 bg-white/[0.06] shadow-2xl overflow-hidden"
        style={{ backdropFilter: "blur(28px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-7 pt-5 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0">
          <div>
            <p className="text-white/30 text-xs mb-0.5">Top 50</p>
            <h2 className="text-white font-bold text-xl">Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/25 hover:text-white/60 transition-colors text-xl leading-none mt-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Duration tabs */}
        <div className="flex gap-1.5 sm:gap-2 px-4 sm:px-7 pb-3 sm:pb-4 flex-shrink-0">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                selectedDuration === d
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/6 bg-white/3 text-white/30 hover:text-white/50 hover:border-white/12"
              }`}
            >
              {d}s
            </button>
          ))}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2rem_1fr_3.5rem] sm:grid-cols-[2rem_1fr_4rem] gap-1.5 sm:gap-2 px-4 sm:px-7 pb-2 flex-shrink-0">
          <span className="text-white/25 text-xs">#</span>
          <span className="text-white/25 text-xs">Player</span>
          <span className="text-white/25 text-xs text-right">Score</span>
        </div>

        <div className="h-px bg-white/8 mx-4 sm:mx-7 mb-3 flex-shrink-0" />

        {/* Rows */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-7 pb-2 flex flex-col gap-1 min-h-0">
          {loading && <p className="text-white/25 text-xs text-center py-10">Loading…</p>}
          {!loading && error && <p className="text-red-400/60 text-xs text-center py-10">{error}</p>}
          {!loading && !error && entries.length === 0 && (
            <p className="text-white/25 text-xs text-center py-10">No scores yet for {selectedDuration}s.</p>
          )}

          {!loading && !error && entries.map((entry, i) => {
            const rank = i + 1;
            const isUser = user?.id === entry.user_id;
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

            return (
              <div
                key={entry.user_id}
                className={`grid grid-cols-[2rem_1fr_3.5rem] sm:grid-cols-[2rem_1fr_4rem] gap-1.5 sm:gap-2 items-center px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border transition-colors ${
                  isUser        ? "border-blue-400/25 bg-blue-400/8"
                  : rank === 1  ? "border-yellow-300/20 bg-yellow-300/8"
                  : rank === 2  ? "border-white/12 bg-white/[0.05]"
                  : rank === 3  ? "border-white/8 bg-white/[0.03]"
                  : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className="text-center">
                  {medal
                    ? <span className="text-sm leading-none">{medal}</span>
                    : <span className="text-white/30 text-xs tabular-nums">{rank}</span>}
                </div>
                <p className={`text-sm font-medium truncate ${isUser ? "text-blue-200/90" : "text-white/80"}`}>
                  {entry.username}{isUser && " (you)"}
                </p>
                <p className={`text-sm font-bold tabular-nums text-right ${
                  rank === 1 ? "text-yellow-200" : rank <= 3 ? "text-white" : "text-white/80"
                }`}>
                  {entry.score}
                </p>
              </div>
            );
          })}

          {/* User placement when outside top 50 */}
          {!loading && !error && userRow && (
            <>
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-white/20 text-[10px]">your best</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>
              <div className="grid grid-cols-[2rem_1fr_3.5rem] sm:grid-cols-[2rem_1fr_4rem] gap-1.5 sm:gap-2 items-center px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-blue-400/25 bg-blue-400/8">
                <div className="text-center">
                  <span className="text-white/35 text-xs tabular-nums">#{userRow.rank}</span>
                </div>
                <p className="text-sm font-medium text-blue-200/90 truncate">{userRow.username} (you)</p>
                <p className="text-sm font-bold text-blue-200/90 tabular-nums text-right">{userRow.score}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-7 py-4 sm:py-5 border-t border-white/8 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/12 bg-white/6 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white/80 hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.07)] transition-all duration-200"
          >
            Return
          </button>
          <a
            href="/game"
            className="px-5 py-2 rounded-xl border border-white/20 bg-white/10 text-white text-sm font-semibold hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_16px_rgba(255,255,255,0.12)] transition-all duration-200"
          >
            Play Now
          </a>
        </div>
      </div>
    </div>
  );
}

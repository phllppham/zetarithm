"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import GlassCard from "@/components/GlassCard";

const DURATIONS = [30, 60, 120, 180];

interface BestScores {
  [duration: number]: number | null;
}

interface ProfilePanelProps {
  onClose: () => void;
  onLogin?: () => void;
}

export default function ProfilePanel({ onClose, onLogin }: ProfilePanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [bestScores, setBestScores] = useState<BestScores>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("@/lib/supabaseClient").then(async ({ createClient }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("leaderboard")
          .select("score, duration")
          .eq("user_id", user.id);

        const scores: BestScores = {};
        DURATIONS.forEach((d) => {
          const entries = (data ?? []).filter((r) => r.duration === d);
          scores[d] = entries.length > 0 ? Math.max(...entries.map((r) => r.score)) : null;
        });
        setBestScores(scores);
      }

      setLoading(false);
    });
  }, []);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.user_name ||
    user?.email?.split("@")[0] ||
    null;

  return (
    <GlassCard className="w-72 px-6 py-7 flex flex-col gap-6 self-stretch">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/30 text-xs mb-0.5">Profile</p>
          <p className="text-white font-semibold text-sm">
            {loading ? "..." : displayName ?? "Guest"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white/25 hover:text-white/60 transition-colors text-base leading-none mt-0.5"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {user ? (
        <>
          {/* Best scores grid */}
          <div>
            <p className="text-white/30 text-xs mb-3">Best Scores</p>
            <div className="grid grid-cols-2 gap-2">
              {DURATIONS.map((d) => (
                <div
                  key={d}
                  className="rounded-xl border border-white/8 bg-white/4 px-4 py-3"
                >
                  <p className="text-white/30 text-xs mb-1">{d}s</p>
                  <p className="text-white text-2xl font-bold tabular-nums">
                    {loading ? "…" : bestScores[d] ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="mt-auto pt-2 border-t border-white/8">
            <p className="text-white/25 text-xs truncate">{user.email}</p>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <p className="text-white/35 text-sm leading-relaxed">
            Sign in to track your best scores across all durations.
          </p>
          <button
            onClick={onLogin}
            className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all"
          >
            Login
          </button>
        </div>
      )}
    </GlassCard>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
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
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.user_name ||
    user?.email?.split("@")[0] ||
    "";

  const startEditing = () => {
    setNameInput(displayName);
    setSaveError(null);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEditing = () => {
    setEditing(false);
    setSaveError(null);
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === displayName) { setEditing(false); return; }

    setSaving(true);
    setSaveError(null);

    const { createClient } = await import("@/lib/supabaseClient");
    const supabase = createClient();

    const { error: metaError } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    });

    if (metaError) {
      setSaveError(metaError.message);
      setSaving(false);
      return;
    }

    // Also update existing leaderboard rows so history reflects the new name
    await supabase
      .from("leaderboard")
      .update({ username: trimmed })
      .eq("user_id", user!.id);

    setUser((prev) =>
      prev
        ? { ...prev, user_metadata: { ...prev.user_metadata, display_name: trimmed } }
        : prev
    );

    setSaving(false);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveName();
    if (e.key === "Escape") cancelEditing();
  };

  return (
    <GlassCard className="w-72 px-6 py-7 flex flex-col gap-6 self-stretch">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-white/30 text-xs mb-1">Profile</p>

          {editing ? (
            <div className="flex flex-col gap-1.5">
              <input
                ref={inputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={32}
                className="w-full bg-white/8 border border-white/15 rounded-lg px-2.5 py-1 text-white text-sm outline-none focus:border-white/30 transition-all"
              />
              {saveError && <p className="text-red-400/70 text-xs">{saveError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={saveName}
                  disabled={saving}
                  className="text-xs text-white/60 hover:text-white transition-colors disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={cancelEditing}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm truncate">
                {loading ? "..." : displayName || "Guest"}
              </p>
              {user && !loading && (
                <button
                  onClick={startEditing}
                  className="text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
                  aria-label="Edit name"
                >
                  <PencilIcon />
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-white/25 hover:text-white/60 transition-colors text-base leading-none mt-0.5 flex-shrink-0"
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

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

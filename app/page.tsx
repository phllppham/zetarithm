"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import ProfilePanel from "@/components/ProfilePanel";
import LeaderboardPanel from "@/components/LeaderboardPanel";
import LeaderboardModal from "@/components/LeaderboardModal";
import { useAuthModal } from "@/contexts/AuthModalContext";
import type { Operator } from "@/types";

const ALL_OPERATORS: { op: Operator; label: string }[] = [
  { op: "+", label: "+" },
  { op: "−", label: "−" },
  { op: "×", label: "×" },
  { op: "÷", label: "÷" },
];

const TIMER_OPTIONS = [30, 60, 120, 180];

const btnBase = "px-4 py-1.5 rounded-lg border text-sm font-semibold transition-all duration-150";
const btnActive = "border-white/20 bg-white/10 text-white hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_16px_rgba(255,255,255,0.12)]";
const btnInactive = "border-white/6 bg-white/3 text-white/20 hover:text-white/35 hover:border-white/12 hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]";

export default function HomePage() {
  const router = useRouter();
  const [enabledOps, setEnabledOps] = useState<Set<Operator>>(
    new Set(ALL_OPERATORS.map((o) => o.op))
  );
  const [selectedTime, setSelectedTime] = useState(120);
  const [showTimer, setShowTimer] = useState(true);
  const [showScore, setShowScore] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { openLogin } = useAuthModal();

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggleOp = (op: Operator) => {
    setEnabledOps((prev) => {
      if (prev.has(op) && prev.size === 1) return prev;
      const next = new Set(prev);
      next.has(op) ? next.delete(op) : next.add(op);
      return next;
    });
  };

  const handleStart = () => {
    const ops = Array.from(enabledOps).join(",");
    router.push(`/game?ops=${encodeURIComponent(ops)}&time=${selectedTime}&showTimer=${showTimer}&showScore=${showScore}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-3 sm:px-4 py-20 sm:py-4 gap-4 overflow-x-hidden overflow-y-auto">

      {/* About modal overlay */}
      {aboutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAboutOpen(false); }}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

          {/* Modal card */}
          <GlassCard className="relative w-full max-w-lg px-5 sm:px-8 md:px-10 py-6 sm:py-8 z-10 max-h-[90dvh] overflow-y-auto">
            {/* X close button */}
            <button
              onClick={() => setAboutOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-6">About</h2>

            <div className="space-y-6 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-1.5">What is Zetarithm?</h3>
                <p className="text-white/45 text-sm leading-relaxed">
                  Zetarithm is a modern arithmetic speed drill game inspired by{" "}
                  <a
                    href="https://arithmetic.zetamac.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 underline hover:text-white transition-colors"
                  >
                    Zetamac
                  </a>.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-1.5">How to play</h3>
                <p className="text-white/45 text-sm leading-relaxed">
                  Answer as many mathematical questions as you can before the timer runs out. Choose what operations you want to include, and adjust timer duration to your liking.
                </p>
              </div>
            </div>

            <div>
              <p className="text-white/30 text-xs">
                <button
                  onClick={() => { setAboutOpen(false); openLogin(); }}
                  className="text-white/50 underline hover:text-white/80 transition-colors"
                >
                  Login
                </button>{" "}
                to view your statistics and compete on the leaderboard.
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Full leaderboard modal overlay */}
      {leaderboardModalOpen && (
        <LeaderboardModal onClose={() => setLeaderboardModalOpen(false)} />
      )}

      {/* Leaderboard panel — slides in from left (desktop only; mobile uses modal) */}
      <div
        className="hidden md:block flex-shrink-0"
        style={{
          width: "18rem",
          marginRight: leaderboardOpen ? "0" : "calc(-18rem - 1rem)",
          transform: leaderboardOpen ? "translateX(0)" : "translateX(-30vw)",
          opacity: leaderboardOpen ? 1 : 0,
          filter: leaderboardOpen ? "blur(0px)" : "blur(4px)",
          transition: "margin-right 420ms cubic-bezier(0.4,0,0.2,1), transform 420ms cubic-bezier(0.4,0,0.2,1), opacity 380ms ease-out, filter 320ms ease-out",
        }}
      >
        <LeaderboardPanel
          onClose={() => setLeaderboardOpen(false)}
          onViewFull={() => setLeaderboardModalOpen(true)}
        />
      </div>

      {/* Main card */}
        <GlassCard
          className={`w-full max-w-2xl px-5 sm:px-8 md:px-12 pt-6 sm:pt-9 pb-8 sm:pb-10 ${aboutOpen ? "opacity-60 pointer-events-none" : ""}`}
          style={{
            transition: "transform 350ms cubic-bezier(0.4,0,0.2,1), opacity 300ms ease-out",
          }}
        >

        {/* Top row: title left, nav links right */}
        <div className="flex items-start justify-between mb-6 sm:mb-9">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              ZetaRithm
            </h1>
            <p className="text-white/35 text-xs mt-1.5">
              Modern Zetamac Arithmetic Game
            </p>
          </div>
          <div className="flex gap-3 sm:gap-4 pt-1">
            <button
              onClick={() => setAboutOpen(true)}
              className="text-white/30 text-xs hover:text-white/60 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="text-white/30 text-xs hover:text-white/60 transition-colors"
            >
              Profile
            </button>
          </div>
        </div>

        {/* Grid: 2 columns on md+, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-4 md:gap-x-8 gap-y-6 md:gap-y-0 mb-6 md:mb-8">

          {/* Row 1 labels */}
          <p className="text-white/30 text-xs mb-2">Operations</p>
          <p className="text-white/30 text-xs mb-2 md:text-right">Show Timer</p>

          {/* Row 1 buttons */}
          <div className="flex gap-2 sm:gap-3 mb-1 flex-wrap">
            {ALL_OPERATORS.map(({ op, label }) => (
              <button
                key={op}
                onClick={() => toggleOp(op)}
                className={`${btnBase} ${enabledOps.has(op) ? btnActive : btnInactive}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-1 md:mb-5 justify-start md:justify-end">
            <button onClick={() => setShowTimer(true)} className={`${btnBase} ${showTimer ? btnActive : btnInactive}`}>On</button>
            <button onClick={() => setShowTimer(false)} className={`${btnBase} ${!showTimer ? btnActive : btnInactive}`}>Off</button>
          </div>

          {/* Row 2 labels */}
          <p className="text-white/30 text-xs mb-2">Duration</p>
          <p className="text-white/30 text-xs mb-2 md:text-right">Show Score</p>

          {/* Row 2 buttons */}
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {TIMER_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`${btnBase} font-medium ${selectedTime === t ? btnActive : btnInactive}`}
              >
                {t}s
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-start md:justify-end">
            <button onClick={() => setShowScore(true)} className={`${btnBase} ${showScore ? btnActive : btnInactive}`}>On</button>
            <button onClick={() => setShowScore(false)} className={`${btnBase} ${!showScore ? btnActive : btnInactive}`}>Off</button>
          </div>

        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl bg-white text-black font-semibold text-sm
              hover:bg-white/90 hover:shadow-[0_0_24px_rgba(255,255,255,0.2)]
              active:scale-[0.98] transition-all duration-150"
          >
            Start
          </button>
          <button
            onClick={() => isMobile ? setLeaderboardModalOpen(true) : setLeaderboardOpen((p) => !p)}
            className={`w-full py-3 rounded-xl border text-sm font-medium text-center transition-all duration-150
              ${leaderboardOpen || leaderboardModalOpen
                ? "border-white/20 bg-white/10 text-white/80 hover:bg-white/15 hover:shadow-[0_0_16px_rgba(255,255,255,0.1)]"
                : "border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/8 hover:border-white/15 hover:shadow-[0_0_16px_rgba(255,255,255,0.07)]"
              }`}
          >
            Leaderboard
          </button>
        </div>
      </GlassCard>

      {/* Profile panel — overlay on mobile, slide-in on desktop */}
      {profileOpen && isMobile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setProfileOpen(false); }}
        >
          <div className="w-full max-w-[20rem] max-h-[90dvh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <ProfilePanel onClose={() => setProfileOpen(false)} onLogin={openLogin} />
          </div>
        </div>
      )}
      <div
        className="hidden md:block flex-shrink-0"
        style={{
          width: "18rem",
          marginLeft: profileOpen ? "0" : "calc(-18rem - 1rem)",
          transform: profileOpen ? "translateX(0)" : "translateX(30vw)",
          opacity: profileOpen ? 1 : 0,
          filter: profileOpen ? "blur(0px)" : "blur(4px)",
          transition: "margin-left 420ms cubic-bezier(0.4,0,0.2,1), transform 420ms cubic-bezier(0.4,0,0.2,1), opacity 380ms ease-out, filter 320ms ease-out",
        }}
      >
        {!isMobile && <ProfilePanel onClose={() => setProfileOpen(false)} onLogin={openLogin} />}
      </div>
    </div>
  );
}

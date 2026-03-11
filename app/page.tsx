"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";
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
  const [selectedTime, setSelectedTime] = useState(60);
  const [showTimer, setShowTimer] = useState(true);
  const [showScore, setShowScore] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

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
    <div className="flex h-screen items-center justify-center px-4 overflow-hidden">

      {/* About modal overlay */}
      {aboutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAboutOpen(false); }}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

          {/* Modal card */}
          <GlassCard className="relative w-full max-w-lg px-10 py-8 z-10">
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
                <Link href="/login" className="text-white/50 underline hover:text-white/80 transition-colors" onClick={() => setAboutOpen(false)}>
                  Login
                </Link>{" "}
                to view your statistics and compete on the leaderboard.
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Main card */}
        <GlassCard className={`w-full max-w-2xl px-12 pt-9 pb-10 transition-all duration-300 ${aboutOpen ? "opacity-60 pointer-events-none" : ""}`}>

        {/* Top row: title left, nav links right */}
        <div className="flex items-start justify-between mb-9">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
              Zetarithm
            </h1>
            <p className="text-white/35 text-xs mt-1.5">
              Modern Zetamac Arithmetic Game
            </p>
          </div>
          <div className="flex gap-4 pt-1.5">
            <button
              onClick={() => setAboutOpen(true)}
              className="text-white/30 text-xs hover:text-white/60 transition-colors"
            >
              About
            </button>
            <Link href="/profile" className="text-white/30 text-xs hover:text-white/60 transition-colors">
              Profile
            </Link>
          </div>
        </div>

        {/* 2-column grid: left = Operations + Duration, right = Show Timer + Show Score */}
        <div className="grid grid-cols-[1fr_auto] gap-x-8 mb-8">

          {/* Row 1 labels */}
          <p className="text-white/30 text-xs mb-3">Operations</p>
          <p className="text-white/30 text-xs mb-3 text-right">Show Timer</p>

          {/* Row 1 buttons */}
          <div className="flex gap-3 mb-5">
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
          <div className="flex gap-2 mb-5 justify-end">
            <button onClick={() => setShowTimer(true)} className={`${btnBase} ${showTimer ? btnActive : btnInactive}`}>On</button>
            <button onClick={() => setShowTimer(false)} className={`${btnBase} ${!showTimer ? btnActive : btnInactive}`}>Off</button>
          </div>

          {/* Row 2 labels */}
          <p className="text-white/30 text-xs mb-3">Duration</p>
          <p className="text-white/30 text-xs mb-3 text-right">Show Score</p>

          {/* Row 2 buttons */}
          <div className="flex gap-3">
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
          <div className="flex gap-2 justify-end">
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
          <Link
            href="/leaderboard"
            className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-white/50 text-sm font-medium text-center
              hover:text-white/80 hover:bg-white/8 hover:border-white/15 hover:shadow-[0_0_16px_rgba(255,255,255,0.07)]
              transition-all duration-150"
          >
            Leaderboard
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

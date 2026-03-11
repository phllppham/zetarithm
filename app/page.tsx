import Link from "next/link";
import GlassCard from "@/components/GlassCard";

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <GlassCard className="w-full max-w-lg px-10 py-14 text-center">
        {/* Title */}
        <h1 className="text-5xl font-bold tracking-tight text-white mb-2">
          ZetaMath
        </h1>
        <p className="text-white/40 text-sm uppercase tracking-widest mb-10">
          Mental Arithmetic Speed Game
        </p>

        {/* Stats preview */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Operations", value: "+ − ×" },
            { label: "Timer", value: "60s" },
            { label: "Goal", value: "Max Score" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-white/8 bg-white/4 px-3 py-4"
            >
              <div className="text-white/90 text-lg font-semibold">{value}</div>
              <div className="text-white/35 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* How to play */}
        <p className="text-white/45 text-sm leading-relaxed mb-10">
          Answer as many arithmetic problems as you can in{" "}
          <span className="text-white/70 font-medium">60 seconds</span>. Type
          your answer and press <span className="text-white/70 font-medium">Enter</span>{" "}
          or wait for auto-submit. Log in to save your score to the leaderboard.
        </p>

        {/* CTA */}
        <Link
          href="/game"
          className="
            inline-block w-full py-4 rounded-xl
            bg-white text-black font-semibold text-base
            hover:bg-white/90 active:scale-[0.98]
            transition-all duration-150 shadow-lg shadow-white/10
          "
        >
          Start Game
        </Link>

        <div className="mt-4 flex justify-center gap-6 text-xs text-white/30">
          <Link href="/leaderboard" className="hover:text-white/60 transition-colors">
            View Leaderboard →
          </Link>
          <Link href="/login" className="hover:text-white/60 transition-colors">
            Sign In to save scores →
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

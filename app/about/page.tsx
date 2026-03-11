import Link from "next/link";
import GlassCard from "@/components/GlassCard";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <GlassCard className="w-full max-w-sm px-8 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">About</h1>
            <p className="text-white/35 text-xs mt-1">Zetarithm</p>
          </div>
          <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors pt-1">
            ← Back
          </Link>
        </div>

        <div className="space-y-4 text-sm text-white/50 leading-relaxed">
          <p>
            Zetarithm is a modern arithmetic speed drill game inspired by{" "}
            <a href="https://arithmetic.zetamac.com" target="_blank" rel="noopener noreferrer" className="text-white/70 underline hover:text-white transition-colors">
              Zetamac
            </a>.
          </p>
          <p>
            Answer as many arithmetic problems as you can before the timer runs out. Choose your operations and duration to tailor the difficulty.
          </p>
          <p>
            Log in to save your scores and compete on the leaderboard.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="w-full block text-center py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all"
          >
            Play Now
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

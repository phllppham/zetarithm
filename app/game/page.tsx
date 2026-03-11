"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import TimerRing from "@/components/TimerRing";
import { generateQuestion } from "@/utils/generateQuestion";
import type { Question } from "@/types";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

type GameState = "idle" | "playing" | "finished";

const GAME_DURATION = 60;

export default function GamePage() {
  const router = useRouter();
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize Supabase client and fetch user on client only
  useEffect(() => {
    import("@/lib/supabaseClient").then(({ createClient }) => {
      const supabase = createClient();
      supabaseRef.current = supabase;
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrentQuestion(generateQuestion());
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("finished");
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(GAME_DURATION);
    setSaved(false);
    setSaving(false);
    setGameState("playing");
    nextQuestion();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [nextQuestion, endGame]);

  // Save score when game ends
  useEffect(() => {
    if (gameState !== "finished" || saved || saving) return;
    if (!user || !supabaseRef.current) return;

    const saveScore = async () => {
      setSaving(true);
      const supabase = supabaseRef.current!;
      const username =
        user.user_metadata?.full_name ||
        user.user_metadata?.user_name ||
        user.email?.split("@")[0] ||
        "Anonymous";

      await supabase.from("leaderboard").insert({
        user_id: user.id,
        username,
        score,
      });

      setSaving(false);
      setSaved(true);
    };

    saveScore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const handleInput = (value: string) => {
    setInputValue(value);

    if (currentQuestion === null) return;

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return;

    if (parsed === currentQuestion.answer) {
      setScore((s) => s + 1);
      setStreak((st) => {
        const next = st + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
      setFlash("correct");
      setTimeout(() => setFlash(null), 300);
      nextQuestion();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue !== "") {
      const parsed = parseInt(inputValue, 10);
      if (!isNaN(parsed) && currentQuestion) {
        if (parsed !== currentQuestion.answer) {
          setStreak(0);
          setFlash("wrong");
          setTimeout(() => setFlash(null), 300);
          setInputValue("");
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const flashBorderClass =
    flash === "correct"
      ? "border-emerald-400/60"
      : flash === "wrong"
      ? "border-red-400/60"
      : "border-white/10";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <GlassCard className={`w-full max-w-lg px-8 py-10 transition-colors duration-200 ${flashBorderClass}`}>

        {/* IDLE STATE */}
        {gameState === "idle" && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Ready?</h2>
            <p className="text-white/40 text-sm mb-8">
              You have 60 seconds. Answer as many questions as possible.
            </p>
            <button
              onClick={startGame}
              className="w-full py-4 rounded-xl bg-white text-black font-semibold hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              Start
            </button>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === "playing" && currentQuestion && (
          <div className="flex flex-col items-center gap-6">
            {/* Top row: score + timer + streak */}
            <div className="w-full flex items-center justify-between">
              <div className="text-center">
                <div className="text-3xl font-bold text-white tabular-nums">{score}</div>
                <div className="text-white/35 text-xs mt-0.5">Score</div>
              </div>

              <TimerRing timeLeft={timeLeft} totalTime={GAME_DURATION} />

              <div className="text-center">
                <div className="text-3xl font-bold text-white tabular-nums">{streak}</div>
                <div className="text-white/35 text-xs mt-0.5">Streak</div>
              </div>
            </div>

            {/* Question */}
            <div className="text-6xl font-bold tracking-tight text-white py-6">
              {currentQuestion.question} =
            </div>

            {/* Answer input */}
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="?"
              autoFocus
              className="
                w-full text-center text-4xl font-bold text-white
                bg-white/5 border border-white/10 rounded-xl
                py-4 px-6 outline-none
                focus:border-white/25 focus:bg-white/8
                placeholder:text-white/15
                transition-all
              "
            />

            <p className="text-white/25 text-xs">
              Type your answer — auto-submits on correct · Enter to clear wrong
            </p>
          </div>
        )}

        {/* FINISHED STATE */}
        {gameState === "finished" && (
          <div className="text-center flex flex-col items-center gap-6">
            <div>
              <p className="text-white/40 text-sm uppercase tracking-widest mb-1">Time&apos;s Up!</p>
              <h2 className="text-6xl font-bold text-white">{score}</h2>
              <p className="text-white/40 text-sm mt-1">correct answers</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="rounded-xl border border-white/8 bg-white/4 py-4">
                <div className="text-2xl font-bold text-white">{bestStreak}</div>
                <div className="text-white/35 text-xs mt-1">Best Streak</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/4 py-4">
                <div className="text-2xl font-bold text-white">{GAME_DURATION}s</div>
                <div className="text-white/35 text-xs mt-1">Duration</div>
              </div>
            </div>

            {/* Save status */}
            <div className="text-sm min-h-[1.25rem]">
              {!user && (
                <p className="text-white/35">
                  <a href="/login" className="underline hover:text-white/60">Sign in</a> to save your score
                </p>
              )}
              {user && saving && (
                <p className="text-white/50">Saving score...</p>
              )}
              {user && saved && (
                <p className="text-emerald-400/80">Score saved to leaderboard ✓</p>
              )}
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={startGame}
                className="flex-1 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                Play Again
              </button>
              <button
                onClick={() => router.push("/leaderboard")}
                className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all font-medium"
              >
                Leaderboard
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

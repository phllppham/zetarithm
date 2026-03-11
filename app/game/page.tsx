"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import GlassCard from "@/components/GlassCard";
import TimerRing from "@/components/TimerRing";
import { generateQuestion, DEFAULT_CONFIG } from "@/utils/generateQuestion";
import type { DifficultyConfig, Operator, Question } from "@/types";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

type GameState = "idle" | "playing" | "finished";

function GameInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const gameDuration = Number(searchParams.get("time") ?? 60);
  const opsParam = searchParams.get("ops");
  const showTimer = searchParams.get("showTimer") !== "false";
  const showScore = searchParams.get("showScore") !== "false";
  const gameConfig: DifficultyConfig = opsParam
    ? { ...DEFAULT_CONFIG, operators: opsParam.split(",") as Operator[] }
    : DEFAULT_CONFIG;

  const [gameState, setGameState] = useState<GameState>("playing");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    import("@/lib/supabaseClient").then(({ createClient }) => {
      const supabase = createClient();
      supabaseRef.current = supabase;
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
    });
  }, []);

  // Auto-start on mount
  useEffect(() => {
    startGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrentQuestion(generateQuestion(gameConfig));
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opsParam]);

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState("finished");
  }, []);

  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameKey((k) => k + 1);
    setPreviousScore(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(gameDuration);
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
  }, [gameDuration, nextQuestion, endGame]);

  // Save score when game ends and capture it as previousScore for next round
  useEffect(() => {
    if (gameState !== "finished") return;
    setPreviousScore(score);

    if (saved || saving || !user || !supabaseRef.current) return;

    const saveScore = async () => {
      setSaving(true);
      const supabase = supabaseRef.current!;
      const username =
        user.user_metadata?.full_name ||
        user.user_metadata?.user_name ||
        user.email?.split("@")[0] ||
        "Anonymous";

      await supabase.from("leaderboard").insert({ user_id: user.id, username, score });
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
    // Tab or Enter restarts while playing if game is active; clears wrong answer otherwise
    if (e.key === "Tab") {
      e.preventDefault();
      if (gameState === "playing") startGame();
      return;
    }

    if (e.key === "Enter") {
      if (gameState === "finished") {
        startGame();
        return;
      }
      if (inputValue !== "") {
        const parsed = parseInt(inputValue, 10);
        if (!isNaN(parsed) && currentQuestion && parsed !== currentQuestion.answer) {
          setStreak(0);
          setFlash("wrong");
          setTimeout(() => setFlash(null), 300);
          setInputValue("");
        }
      }
    }
  };

  // Global keydown: Enter on finished screen restarts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState === "finished" && e.key === "Enter") startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const flashBorderClass =
    flash === "correct" ? "border-emerald-400/60"
    : flash === "wrong" ? "border-red-400/60"
    : "border-white/10";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <GlassCard className={`w-full max-w-lg px-8 py-10 transition-colors duration-200 ${flashBorderClass}`}>

        {/* PLAYING STATE */}
        {gameState === "playing" && currentQuestion && (
          <div className="flex flex-col items-center gap-6">
            {/* Timer / score — layout depends on which are visible */}
            {(showTimer || showScore) && (
              <div className={`w-full flex items-center ${
                showTimer && showScore
                  ? "justify-between"          // both: timer left, score right
                  : "justify-center"           // one: center it
              }`}>
                {showTimer && (
                  <TimerRing key={gameKey} timeLeft={timeLeft} totalTime={gameDuration} />
                )}
                {showScore && (
                  <div className={showTimer && showScore ? "text-right" : "text-center"}>
                    <div className="text-white/35 text-xs mb-0.5">Score</div>
                    <div className="text-3xl font-bold text-white tabular-nums">{score}</div>
                  </div>
                )}
              </div>
            )}

            {/* Question */}
            <div className="text-6xl font-bold tracking-tight text-white py-6">
              {currentQuestion.question}
            </div>

            {/* Answer input */}
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="-?[0-9]*"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={inputValue}
              onChange={(e) => handleInput(e.target.value.replace(/[^0-9-]/g, ""))}
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

            {/* Restart button */}
            <button
              onClick={startGame}
              className="text-white/25 text-xs hover:text-white/50 transition-colors px-3 py-1.5 rounded-lg border border-white/8 hover:border-white/15"
            >
              Restart
            </button>
          </div>
        )}

        {/* FINISHED STATE */}
        {gameState === "finished" && (
          <div className="text-center flex flex-col items-center gap-6">
            {/* Final score */}
            <div>
              <p className="text-white/40 text-sm mb-1">Final Score</p>
              <h2 className="text-6xl font-bold text-white">{score}</h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="rounded-xl border border-white/8 bg-white/4 py-4">
                <div className="text-2xl font-bold text-white">{bestStreak}</div>
                <div className="text-white/35 text-xs mt-1">Best Streak</div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/4 py-4">
                <div className="text-2xl font-bold text-white">
                  {previousScore !== null && previousScore !== score ? previousScore : "—"}
                </div>
                <div className="text-white/35 text-xs mt-1">Previous Score</div>
              </div>
            </div>

            {/* Action buttons */}
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

            {/* Save status — below buttons */}
            <div className="text-xs text-center -mt-2">
              {!user && (
                <p className="text-white/30">
                  <a href="/login" className="underline hover:text-white/55 transition-colors">Sign in</a> to save your score
                </p>
              )}
              {user && saving && <p className="text-white/40">Saving score...</p>}
              {user && saved && <p className="text-emerald-400/70">Score saved to leaderboard ✓</p>}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense>
      <GameInner />
    </Suspense>
  );
}

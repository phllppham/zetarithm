"use client";

interface TimerRingProps {
  timeLeft: number;
  totalTime: number;
}

export default function TimerRing({ timeLeft, totalTime }: TimerRingProps) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const dashOffset = circumference * (1 - progress);

  const color =
    timeLeft > 20 ? "#e5e5e5" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.5s ease" }}
        />
      </svg>
      <span
        className="text-xl font-bold tabular-nums"
        style={{ color }}
      >
        {timeLeft}
      </span>
    </div>
  );
}

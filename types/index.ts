export type Operator = "+" | "−" | "×" | "÷";

export interface Question {
  question: string;
  answer: number;
}

export interface OperatorRange {
  min: number;
  max: number;
}

export interface DifficultyConfig {
  operators: Operator[];
  ranges: Record<Operator, OperatorRange>;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  score: number;
  created_at: string;
}

/** Best score per standard duration. null = no score recorded yet. */
export interface BestScores {
  30: number | null;
  60: number | null;
  120: number | null;
  180: number | null;
}

export type Operator = "+" | "−" | "×";

export interface Question {
  question: string;
  answer: number;
}

export interface DifficultyConfig {
  min: number;
  max: number;
  operators: Operator[];
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  score: number;
  created_at: string;
}

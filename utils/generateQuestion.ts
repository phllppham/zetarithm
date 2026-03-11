import type { DifficultyConfig, Operator, Question } from "@/types";

export const DEFAULT_CONFIG: DifficultyConfig = {
  operators: ["+", "−", "×", "÷"],
  ranges: {
    "+": { min: 1, max: 100 },
    "−": { min: 1, max: 100 },
    "×": { min: 2, max: 12 },
    "÷": { min: 2, max: 12 },
  },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateQuestion(config: DifficultyConfig = DEFAULT_CONFIG): Question {
  const operator: Operator =
    config.operators[Math.floor(Math.random() * config.operators.length)];

  const { min, max } = config.ranges[operator];

  switch (operator) {
    case "+": {
      const a = randInt(min, max);
      const b = randInt(min, max);
      return { question: `${a} + ${b}`, answer: a + b };
    }

    case "−": {
      // Generate two numbers then sort so the larger is always first
      const x = randInt(min, max);
      const y = randInt(min, max);
      const a = Math.max(x, y);
      const b = Math.min(x, y);
      return { question: `${a} − ${b}`, answer: a - b };
    }

    case "×": {
      const a = randInt(min, max);
      const b = randInt(min, max);
      return { question: `${a} × ${b}`, answer: a * b };
    }

    case "÷": {
      // Build a clean division: pick the two factors first, then present a × b ÷ b
      const a = randInt(min, max);
      const b = randInt(min, max);
      const dividend = a * b; // guaranteed whole-number quotient
      return { question: `${dividend} ÷ ${b}`, answer: a };
    }
  }
}

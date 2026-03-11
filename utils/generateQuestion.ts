import type { DifficultyConfig, Operator, Question } from "@/types";

const DEFAULT_CONFIG: DifficultyConfig = {
  min: 1,
  max: 12,
  operators: ["+", "−", "×"],
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateQuestion(config: DifficultyConfig = DEFAULT_CONFIG): Question {
  const operator: Operator =
    config.operators[Math.floor(Math.random() * config.operators.length)];

  const a = randInt(config.min, config.max);
  const b = randInt(config.min, config.max);

  let answer: number;

  switch (operator) {
    case "+":
      answer = a + b;
      break;
    case "−":
      answer = a - b;
      break;
    case "×":
      answer = a * b;
      break;
  }

  return {
    question: `${a} ${operator} ${b}`,
    answer,
  };
}

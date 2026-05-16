export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QuizSubmitResult {
  score: number;
  total: number;
  xpEarned: number;
}

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "Which of these materials is NOT recyclable?",
    options: ["Cardboard", "Glass Bottles", "Plastic Bags", "Aluminum Cans"],
    correct: 2,
    explanation:
      "Plastic bags can jam recycling machines! They usually need special drop-off locations.",
  },
  {
    id: "q2",
    question: "What do bees collect from flowers?",
    options: ["Water", "Nectar", "Leaves", "Seeds"],
    correct: 1,
    explanation: "Bees collect nectar to make honey and pollen to feed their babies!",
  },
];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchDailyQuiz(): Promise<QuizQuestion[]> {
  await delay();
  return MOCK_QUESTIONS;
}

export async function submitQuizAnswers(
  correctCount: number,
  total: number,
): Promise<QuizSubmitResult> {
  await delay(400);
  return {
    score: correctCount,
    total,
    xpEarned: correctCount * 10,
  };
}

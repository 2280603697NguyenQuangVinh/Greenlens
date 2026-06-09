import { createElement, type ReactNode } from "react";
import { AuthProvider } from "./authStore";
import { RewardProvider } from "./rewardStore";
import { QuizProvider } from "./quizStore";

export { AuthProvider, useAuth } from "./authStore";
export { RewardProvider, useReward } from "./rewardStore";
export { QuizProvider, useQuiz } from "./quizStore";

export function AppProviders({ children }: { children: ReactNode }) {
  return createElement(
    AuthProvider,
    null,
    createElement(RewardProvider, null, createElement(QuizProvider, null, children)),
  );
}

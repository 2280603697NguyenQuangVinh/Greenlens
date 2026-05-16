import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  createElement,
  type ReactNode,
} from "react";
import type { QuizQuestion } from "@/services/quizApi";

export interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  isComplete: boolean;
  isLoading: boolean;
}

interface QuizContextValue extends QuizState {
  setQuestions: (questions: QuizQuestion[]) => void;
  setCurrentIndex: (index: number) => void;
  addScore: (points: number) => void;
  completeQuiz: () => void;
  resetQuiz: () => void;
  setLoading: (loading: boolean) => void;
}

const initialQuizState: QuizState = {
  questions: [],
  currentIndex: 0,
  score: 0,
  isComplete: false,
  isLoading: false,
};

const QuizContext = createContext<QuizContextValue | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuizState>(initialQuizState);

  const setQuestions = useCallback((questions: QuizQuestion[]) => {
    setState((prev) => ({ ...prev, questions, currentIndex: 0, score: 0, isComplete: false }));
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    setState((prev) => ({ ...prev, currentIndex: index }));
  }, []);

  const addScore = useCallback((points: number) => {
    setState((prev) => ({ ...prev, score: prev.score + points }));
  }, []);

  const completeQuiz = useCallback(() => {
    setState((prev) => ({ ...prev, isComplete: true }));
  }, []);

  const resetQuiz = useCallback(() => {
    setState(initialQuizState);
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setQuestions,
      setCurrentIndex,
      addScore,
      completeQuiz,
      resetQuiz,
      setLoading,
    }),
    [state, setQuestions, setCurrentIndex, addScore, completeQuiz, resetQuiz, setLoading],
  );

  return createElement(QuizContext.Provider, { value }, children);
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}

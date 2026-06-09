import { useState, useEffect } from "react";
import { BrainCircuit, Check, X, ArrowRight, Trophy } from "lucide-react";
import { fetchDailyQuiz, submitQuizAnswers, type QuizQuestion } from "@/services/quizApi";
import { useQuiz } from "@/state/quizStore";
import { useReward } from "@/state/rewardStore";

export default function QuizModule() {
  const { questions, setQuestions, addScore, score, resetQuiz } = useQuiz();
  const { addXp } = useReward();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [finalXp, setFinalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyQuiz().then((data) => {
      setQuestions(data);
      setLoading(false);
    });
  }, [setQuestions]);

  if (loading || questions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 font-bold">
        Loading quiz...
      </div>
    );
  }

  const question: QuizQuestion = questions[currentQuestion];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    if (index === question.correct) {
      setCorrectCount((c) => c + 1);
      addScore(10);
    }
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      const result = await submitQuizAnswers(correctCount, questions.length);
      setFinalXp(result.xpEarned);
      addXp(result.xpEarned);
      setQuizComplete(true);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setQuizComplete(false);
    setFinalXp(0);
    resetQuiz();
    setLoading(true);
    fetchDailyQuiz().then((data) => {
      setQuestions(data);
      setLoading(false);
    });
  };

  if (quizComplete) {
    return (
      <div className="h-full p-6 flex flex-col items-center justify-center bg-indigo-50 text-center">
        <Trophy size={64} className="text-yellow-400 mb-6" />
        <h1 className="text-3xl font-black text-indigo-900 mb-2">Quiz Complete!</h1>
        <p className="text-indigo-600 font-medium mb-8">
          Score: {score} · +{finalXp} XP earned
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="bg-indigo-600 text-white font-bold py-4 px-8 rounded-2xl w-full max-w-xs"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2">
          <BrainCircuit size={16} /> Question {currentQuestion + 1} of {questions.length}
        </div>
        <div className="font-black text-slate-700">
          Score: <span className="text-indigo-600">{score}</span>
        </div>
      </div>

      <div className="w-full bg-slate-200 h-2 rounded-full mb-8">
        <div
          className="bg-indigo-500 h-full rounded-full transition-all"
          style={{ width: `${(currentQuestion / questions.length) * 100}%` }}
        />
      </div>

      <h2 className="text-2xl font-black text-slate-800 mb-8 leading-snug">{question.question}</h2>

      <div className="flex flex-col gap-3 flex-1">
        {question.options.map((opt, idx) => {
          let stateClass =
            "bg-white border-slate-200 text-slate-700 hover:border-indigo-300";
          let Icon: typeof Check | null = null;

          if (isAnswered) {
            if (idx === question.correct) {
              stateClass = "bg-green-100 border-green-500 text-green-800";
              Icon = Check;
            } else if (idx === selectedAnswer) {
              stateClass = "bg-red-100 border-red-500 text-red-800";
              Icon = X;
            } else {
              stateClass = "bg-white border-slate-200 text-slate-400 opacity-50";
            }
          }

          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              className={`text-left p-4 rounded-2xl border-2 font-bold flex items-center justify-between ${stateClass}`}
            >
              <span>{opt}</span>
              {Icon && <Icon size={20} />}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="mt-6">
          <div
            className={`p-4 rounded-2xl mb-4 text-sm font-medium ${
              selectedAnswer === question.correct
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {question.explanation}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
          >
            {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"}
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

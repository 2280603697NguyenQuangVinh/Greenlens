import { useState } from "react";
import { BrainCircuit, Check, X, ArrowRight, Trophy } from "lucide-react";

const QUIZ_DATA = [
  {
    question: "Which of these materials is NOT recyclable?",
    options: ["Cardboard", "Glass Bottles", "Plastic Bags", "Aluminum Cans"],
    correct: 2,
    explanation: "Plastic bags can jam recycling machines! They usually need to be taken to special drop-off locations."
  },
  {
    question: "What do bees collect from flowers?",
    options: ["Water", "Nectar", "Leaves", "Seeds"],
    correct: 1,
    explanation: "Bees collect nectar to make honey and pollen to feed their babies!"
  }
];

export default function QuizModule() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const question = QUIZ_DATA[currentQuestion];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (index === question.correct) {
      setScore(s => s + 10);
    }
  };

  const handleNext = () => {
    if (currentQuestion < QUIZ_DATA.length - 1) {
      setCurrentQuestion(c => c + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setQuizComplete(false);
  };

  if (quizComplete) {
    return (
      <div className="h-full p-6 flex flex-col items-center justify-center bg-indigo-50 text-center animate-in fade-in duration-500">
        <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
          <Trophy size={64} className="text-yellow-400 drop-shadow-md" />
          <div className="absolute -top-2 -right-2 bg-green-500 text-white font-bold px-3 py-1 rounded-full border-4 border-indigo-50 transform rotate-12">
            Perfect!
          </div>
        </div>
        <h1 className="text-3xl font-black text-indigo-900 mb-2">Quiz Complete!</h1>
        <p className="text-indigo-600 font-medium mb-8">You earned {score} XP today</p>
        
        <button 
          onClick={resetQuiz}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl w-full active:scale-95 transition-transform shadow-lg shadow-indigo-200"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 relative overflow-hidden animate-in fade-in">
      {/* Decorative background */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 z-10">
        <div className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2">
          <BrainCircuit size={16} /> Question {currentQuestion + 1} of {QUIZ_DATA.length}
        </div>
        <div className="font-black text-slate-700">
          Score: <span className="text-indigo-600">{score}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-8 z-10 overflow-hidden">
        <div 
          className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${((currentQuestion) / QUIZ_DATA.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h2 className="text-2xl font-black text-slate-800 mb-8 z-10 leading-snug">
        {question.question}
      </h2>

      {/* Options */}
      <div className="flex flex-col gap-3 z-10 flex-1">
        {question.options.map((opt, idx) => {
          let stateClass = "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50";
          let Icon = null;

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
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              className={`text-left p-4 rounded-2xl border-2 font-bold transition-all duration-200 flex items-center justify-between ${stateClass}`}
            >
              <span>{opt}</span>
              {Icon && <Icon size={20} className={idx === question.correct ? "text-green-600" : "text-red-600"} />}
            </button>
          );
        })}
      </div>

      {/* Result Explanation & Next Button */}
      {isAnswered && (
        <div className="mt-6 z-10 animate-in slide-in-from-bottom-4 duration-300">
          <div className={`p-4 rounded-2xl mb-4 text-sm font-medium ${selectedAnswer === question.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span className="font-bold block mb-1">
              {selectedAnswer === question.correct ? "Awesome job!" : "Not quite!"}
            </span>
            {question.explanation}
          </div>
          
          <button 
            onClick={handleNext}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-indigo-200"
          >
            {currentQuestion < QUIZ_DATA.length - 1 ? "Next Question" : "See Results"} <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

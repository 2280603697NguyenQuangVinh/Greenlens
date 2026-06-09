import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Check, X as XIcon, ArrowRight, Trophy } from "lucide-react";

export function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const questions = [
    {
      question: "Loại rác nào có thể tái chế?",
      options: ["Chai nhựa", "Tã dùng một lần", "Khăn giấy ướt", "Đồ ăn thừa"],
      correct: 0
    },
    {
      question: "Rác hữu cơ nên được bỏ vào thùng màu gì?",
      options: ["Đỏ", "Xanh dương", "Xanh lá", "Vàng"],
      correct: 2
    },
    {
      question: "Việc tái chế chai nhựa giúp gì cho môi trường?",
      options: ["Tăng ô nhiễm", "Tiết kiệm tài nguyên", "Gây hại động vật", "Tăng rác thải"],
      correct: 1
    },
    {
      question: "Pin chết nên bỏ ở đâu?",
      options: ["Thùng rác thường", "Sông hồ", "Điểm thu pin chuyên dụng", "Ra đường"],
      correct: 2
    },
    {
      question: "Giấy báo cũ thuộc loại rác nào?",
      options: ["Rác hữu cơ", "Rác tái chế", "Rác nguy hại", "Rác xây dựng"],
      correct: 1
    }
  ];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (index === questions[currentQuestion].correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 font-['Nunito',sans-serif] px-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-yellow-100 p-6 rounded-full border-4 border-yellow-300 mb-6"
        >
          <Trophy size={64} className="text-yellow-500" />
        </motion.div>
        <h1 className="text-4xl font-black text-green-900 mb-2">Hoàn thành!</h1>
        <p className="text-xl text-green-600 font-bold mb-8">Bạn đạt {score}/{questions.length} điểm</p>

        <button
          onClick={() => window.history.back()}
          className="bg-green-500 text-white px-8 py-4 rounded-3xl font-black text-xl shadow-lg shadow-green-200"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-green-50 font-['Nunito',sans-serif] px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-2xl">
            <Brain className="text-purple-500" size={28} />
          </div>
          <h2 className="text-2xl font-black text-green-900">Câu Đố Phân Loại Rác</h2>
        </div>
        <div className="bg-white px-4 py-2 rounded-full font-bold text-gray-500 border-2 border-gray-200 shadow-sm">
          {currentQuestion + 1} / {questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-3 rounded-full mb-10 overflow-hidden">
        <motion.div 
          className="h-full bg-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question Card */}
      <div className="flex-1">
        <h3 className="text-3xl font-black text-gray-800 leading-tight mb-8">
          {questions[currentQuestion].question}
        </h3>

        <div className="flex flex-col gap-4">
          {questions[currentQuestion].options.map((option, index) => {
            let stateClass = "bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300";
            let Icon = null;
            
            if (isAnswered) {
              if (index === questions[currentQuestion].correct) {
                stateClass = "bg-green-100 border-2 border-green-500 text-green-800";
                Icon = <Check className="text-green-500" />;
              } else if (index === selectedAnswer) {
                stateClass = "bg-red-100 border-2 border-red-500 text-red-800";
                Icon = <XIcon className="text-red-500" />;
              } else {
                stateClass = "bg-white border-2 border-gray-200 text-gray-400 opacity-50";
              }
            }

            return (
              <motion.button
                key={index}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                onClick={() => handleSelect(index)}
                disabled={isAnswered}
                className={`p-5 rounded-2xl text-left font-bold text-xl flex justify-between items-center transition-all shadow-sm ${stateClass}`}
              >
                {option}
                {Icon}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pt-8"
          >
            <button 
              onClick={handleNext}
              className="w-full bg-purple-500 text-white py-4 rounded-3xl font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
            >
              {currentQuestion < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"} <ArrowRight size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

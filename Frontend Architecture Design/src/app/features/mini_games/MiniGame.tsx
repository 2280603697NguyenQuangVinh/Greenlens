import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gamepad2, Play, RefreshCcw } from "lucide-react";

export function MiniGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [fallingItems, setFallingItems] = useState<{ id: number, type: 'good' | 'bad', left: number }[]>([]);

  useEffect(() => {
    if (!isPlaying) return;

    if (timeLeft <= 0) {
      setIsPlaying(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    const spawner = setInterval(() => {
      setFallingItems(prev => [
        ...prev, 
        { 
          id: Date.now(), 
          type: Math.random() > 0.3 ? 'good' : 'bad',
          left: Math.random() * 80 + 10 // 10% to 90%
        }
      ]);
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(15);
    setFallingItems([]);
    setIsPlaying(true);
  };

  const catchItem = (id: number, type: 'good' | 'bad') => {
    setFallingItems(prev => prev.filter(item => item.id !== id));
    if (type === 'good') {
      setScore(s => s + 10);
    } else {
      setScore(s => Math.max(0, s - 5));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-blue-50 font-['Nunito',sans-serif] px-6 py-8 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-4 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-2xl">
            <Gamepad2 className="text-blue-500" size={28} />
          </div>
          <h2 className="text-2xl font-black text-blue-900">Phân Loại Rác</h2>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl font-bold text-blue-800 shadow-sm">
            ⏳ {timeLeft}s
          </div>
          <div className="bg-yellow-100 px-4 py-2 rounded-xl font-black text-yellow-600 shadow-sm border-2 border-yellow-200">
            {score} pt
          </div>
        </div>
      </div>

      {!isPlaying && timeLeft === 15 ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <h1 className="text-4xl font-black text-blue-900 mb-4 text-center">Sạch Sẽ Đại Dương!</h1>
          <p className="text-blue-600 font-bold mb-8 text-center max-w-xs">Chạm vào rác để thu gom, nhưng đừng chạm vào cá!</p>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={startGame}
            className="bg-blue-500 text-white px-8 py-4 rounded-3xl font-black text-2xl flex items-center gap-3 shadow-lg shadow-blue-200"
          >
            <Play size={28} fill="currentColor" /> Play Now
          </motion.button>
        </div>
      ) : !isPlaying && timeLeft <= 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <h1 className="text-4xl font-black text-blue-900 mb-2">Hết Giờ!</h1>
          <p className="text-2xl text-blue-600 font-bold mb-8">Điểm của bạn: {score}</p>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={startGame}
            className="bg-blue-500 text-white px-8 py-4 rounded-3xl font-black text-xl flex items-center gap-3 shadow-lg shadow-blue-200"
          >
            <RefreshCcw size={24} /> Play Again
          </motion.button>
        </div>
      ) : (
        <div className="flex-1 relative">
          <AnimatePresence>
            {fallingItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ top: "-10%", opacity: 0 }}
                animate={{ top: "110%", opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 3, ease: "linear" }}
                onAnimationComplete={() => {
                  setFallingItems(prev => prev.filter(i => i.id !== item.id));
                }}
                className="absolute text-5xl cursor-pointer"
                style={{ left: `${item.left}%` }}
                onPointerDown={() => catchItem(item.id, item.type)}
              >
                {item.type === 'good' ? '🥤' : '�'}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Decorative Ocean Floor */}
      <div className="absolute bottom-20 left-0 w-full h-32 bg-gradient-to-t from-blue-300 to-transparent z-0 opacity-50 pointer-events-none"></div>
    </div>
  );
}

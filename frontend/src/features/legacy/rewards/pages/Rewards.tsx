import { motion } from "motion/react";
import { Trophy, Star, Medal, Crown } from "lucide-react";

export function Rewards() {
  const badges = [
    { name: "First Plant", icon: "🌱", color: "bg-green-100 border-green-300 text-green-700", unlocked: true },
    { name: "Recycler", icon: "♻️", color: "bg-blue-100 border-blue-300 text-blue-700", unlocked: true },
    { name: "Quiz Master", icon: "🧠", color: "bg-purple-100 border-purple-300 text-purple-700", unlocked: true },
    { name: "Ocean Saver", icon: "🌊", color: "bg-cyan-100 border-cyan-300 text-cyan-700", unlocked: false },
    { name: "Bird Watcher", icon: "🐦", color: "bg-orange-100 border-orange-300 text-orange-700", unlocked: false },
    { name: "Eco Hero", icon: "🦸", color: "bg-yellow-100 border-yellow-300 text-yellow-700", unlocked: false },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-green-50 font-['Nunito',sans-serif] px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 mt-4">
        <div className="bg-yellow-100 p-3 rounded-2xl">
          <Trophy className="text-yellow-500" size={28} />
        </div>
        <h2 className="text-2xl font-black text-green-900">Your Rewards</h2>
      </div>

      {/* Hero Stats */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-green-100 mb-8 flex justify-around">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-2">
            <Star className="text-orange-500" size={28} fill="currentColor" />
          </div>
          <span className="text-2xl font-black text-gray-800">120</span>
          <span className="text-sm font-bold text-gray-400">Total XP</span>
        </div>
        
        <div className="w-1 bg-green-50 rounded-full"></div>

        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Crown className="text-blue-500" size={28} fill="currentColor" />
          </div>
          <span className="text-2xl font-black text-gray-800">Lvl 5</span>
          <span className="text-sm font-bold text-gray-400">Current Rank</span>
        </div>
      </div>

      {/* Progress to next level */}
      <div className="mb-10">
        <div className="flex justify-between font-bold mb-2">
          <span className="text-green-700">Level 5</span>
          <span className="text-gray-400">Level 6</span>
        </div>
        <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: "60%" }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="absolute right-0 top-0 w-4 h-4 bg-white/30 rounded-full"></div>
          </motion.div>
        </div>
        <p className="text-center text-sm font-bold text-green-600 mt-2">80 XP to next level!</p>
      </div>

      {/* Badges Grid */}
      <div>
        <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
          <Medal className="text-gray-400" size={24} /> Badge Collection
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {badges.map((badge, index) => (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.05 }}
              className={`p-4 rounded-3xl border-2 flex flex-col items-center justify-center text-center gap-2 ${
                badge.unlocked ? badge.color : 'bg-gray-50 border-gray-200 text-gray-400 grayscale opacity-70'
              }`}
            >
              <div className="text-4xl mb-1">{badge.icon}</div>
              <span className="font-bold text-sm">{badge.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

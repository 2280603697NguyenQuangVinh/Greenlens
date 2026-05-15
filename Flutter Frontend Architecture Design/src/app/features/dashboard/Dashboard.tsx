import { motion } from "motion/react";
import { Flame, Star, Compass, Camera, Calendar, Award } from "lucide-react";
import { Link } from "react-router";

export function Dashboard() {
  const activities = [
    { title: "Plant a Tree", status: "completed", xp: 50 },
    { title: "Recycle 3 Items", status: "pending", xp: 30 },
    { title: "Nature Walk", status: "pending", xp: 40 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-green-50 font-['Nunito',sans-serif] px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 mt-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-2xl shadow-sm border-2 border-green-200">
            <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center text-2xl">
              🦸‍♂️
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-green-900 leading-tight">Hi, Alex!</h2>
            <p className="text-green-600 font-bold text-sm">Lvl 5 Eco-Hero</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-orange-100 px-3 py-1.5 rounded-full border-2 border-orange-200">
            <Flame className="text-orange-500" size={18} strokeWidth={3} fill="#f97316" />
            <span className="font-bold text-orange-700">7</span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-100 px-3 py-1.5 rounded-full border-2 border-yellow-200">
            <Star className="text-yellow-500" size={18} strokeWidth={3} fill="#eab308" />
            <span className="font-bold text-yellow-700">120</span>
          </div>
        </div>
      </div>

      {/* Main Action Banner */}
      <Link to="/app/camera">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-6 text-white shadow-lg shadow-green-200 mb-8 relative overflow-hidden"
        >
          <div className="relative z-10 w-2/3">
            <h3 className="text-2xl font-black mb-2 leading-tight">Scan Nature!</h3>
            <p className="text-green-50 font-semibold mb-4 text-sm">Find a plant or animal and let AI identify it.</p>
            <div className="bg-white text-green-600 px-4 py-2 rounded-xl inline-flex items-center gap-2 font-bold text-sm shadow-sm">
              <Camera size={18} /> Open Camera
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-50">
            <Compass size={140} strokeWidth={1} />
          </div>
        </motion.div>
      </Link>

      {/* Daily Activities */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black text-green-900 flex items-center gap-2">
            <Calendar className="text-green-500" size={24} /> Daily Quests
          </h3>
          <span className="text-green-500 font-bold text-sm bg-green-100 px-3 py-1 rounded-full">1/3 Done</span>
        </div>
        
        <div className="flex flex-col gap-3">
          {activities.map((activity, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
                activity.status === 'completed' 
                ? 'bg-green-100 border-green-300' 
                : 'bg-white border-green-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  activity.status === 'completed' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-300'
                }`}>
                  {activity.status === 'completed' && <Award size={16} />}
                </div>
                <span className={`font-bold ${activity.status === 'completed' ? 'text-green-800 line-through opacity-70' : 'text-gray-700'}`}>
                  {activity.title}
                </span>
              </div>
              <div className="flex items-center gap-1 text-yellow-500 font-black text-sm">
                +{activity.xp} <Star size={14} fill="currentColor" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Play, Leaf, Star, Clock } from "lucide-react";
import { Link } from "react-router";

export default function Dashboard() {
  return (
    <div className="p-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl font-bold mb-1 text-slate-800">Hello, Explorer! 👋</h1>
      <p className="text-slate-500 mb-6 font-medium text-sm">Ready for today's nature adventure?</p>

      {/* Daily Progress */}
      <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-5 text-white mb-6 shadow-lg shadow-green-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Star className="text-yellow-300 fill-yellow-300" size={20} /> Daily Goal
          </h2>
          <span className="font-bold bg-white/20 px-3 py-1 rounded-full text-sm">2 / 3 Tasks</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-3 mb-2 overflow-hidden">
          <div className="bg-white h-3 rounded-full w-2/3 transition-all duration-1000 ease-out" />
        </div>
        <p className="text-sm font-medium opacity-90">Almost there! Keep exploring!</p>
      </div>

      <h3 className="font-bold text-lg mb-4 text-slate-800">Today's Missions</h3>
      <div className="flex flex-col gap-4 mb-8">
        <MissionCard 
          icon={<Leaf className="text-green-500" />} 
          title="Identify 3 Leaves" 
          points={50}
          completed={true}
          bg="bg-green-50"
        />
        <MissionCard 
          icon={<Play className="text-blue-500" />} 
          title="Play 'Recycle Sorting'" 
          points={30}
          completed={true}
          bg="bg-blue-50"
        />
        <MissionCard 
          icon={<Clock className="text-orange-500" />} 
          title="Take a nature walk" 
          points={100}
          completed={false}
          bg="bg-orange-50"
        />
      </div>

      <h3 className="font-bold text-lg mb-4 text-slate-800">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        <Link to="/camera" className="bg-emerald-100 p-4 rounded-3xl flex flex-col items-center gap-3 text-center active:scale-95 transition-transform">
          <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-200">
            <Camera size={28} />
          </div>
          <span className="font-bold text-emerald-800">AI Scanner</span>
        </Link>
        <Link to="/quiz" className="bg-indigo-100 p-4 rounded-3xl flex flex-col items-center gap-3 text-center active:scale-95 transition-transform">
          <div className="w-14 h-14 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-md shadow-indigo-200">
            <BrainCircuit size={28} />
          </div>
          <span className="font-bold text-indigo-800">Daily Quiz</span>
        </Link>
      </div>
    </div>
  );
}

import { Camera, BrainCircuit } from "lucide-react";

function MissionCard({ icon, title, points, completed, bg }: { icon: React.ReactNode, title: string, points: number, completed: boolean, bg: string }) {
  return (
    <div className={`${bg} p-4 rounded-2xl flex items-center gap-4 ${completed ? 'opacity-60' : ''}`}>
      <div className="bg-white p-3 rounded-xl shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className={`font-bold text-slate-700 ${completed ? 'line-through' : ''}`}>{title}</h4>
        <span className="text-xs font-bold text-slate-500">+{points} XP</span>
      </div>
      <div>
        {completed ? (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
            ✓
          </div>
        ) : (
          <div className="w-8 h-8 border-2 border-slate-300 rounded-full" />
        )}
      </div>
    </div>
  );
}

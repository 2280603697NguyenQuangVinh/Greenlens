import { Link } from "react-router";
import { Camera, BrainCircuit, Calendar, Star, Leaf, Play, Clock } from "lucide-react";
import { useAuth } from "@/state/authStore";
import { useReward } from "@/state/rewardStore";

export default function Dashboard() {
  const { user } = useAuth();
  const { streak, xp } = useReward();
  const name = user?.name || "Explorer";

  return (
    <div className="p-6 pb-20">
      <h1 className="text-2xl font-bold mb-1 text-slate-800">Hello, {name}! 👋</h1>
      <p className="text-slate-500 mb-6 font-medium text-sm">Ready for today&apos;s nature adventure?</p>

      <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-5 text-white mb-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Star className="text-yellow-300 fill-yellow-300" size={20} /> Daily Goal
          </h2>
          <span className="font-bold bg-white/20 px-3 py-1 rounded-full text-sm">
            🔥 {streak} · {xp} XP
          </span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-3 mb-2">
          <div className="bg-white h-3 rounded-full w-2/3" />
        </div>
        <p className="text-sm font-medium opacity-90">Almost there! Keep exploring!</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-800">Today&apos;s Missions</h3>
        <Link to="/app/daily" className="text-green-600 text-sm font-bold flex items-center gap-1">
          <Calendar size={16} /> View all
        </Link>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <MissionCard icon={<Leaf className="text-green-500" />} title="Identify 3 Leaves" points={50} completed />
        <MissionCard icon={<Play className="text-blue-500" />} title="Play Recycle Sorting" points={30} completed />
        <MissionCard icon={<Clock className="text-orange-500" />} title="Take a nature walk" points={100} />
      </div>

      <h3 className="font-bold text-lg mb-4 text-slate-800">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/app/camera"
          className="bg-emerald-100 p-4 rounded-3xl flex flex-col items-center gap-3 text-center"
        >
          <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center">
            <Camera size={28} />
          </div>
          <span className="font-bold text-emerald-800">AI Scanner</span>
        </Link>
        <Link
          to="/app/quiz"
          className="bg-indigo-100 p-4 rounded-3xl flex flex-col items-center gap-3 text-center"
        >
          <div className="w-14 h-14 bg-indigo-500 text-white rounded-full flex items-center justify-center">
            <BrainCircuit size={28} />
          </div>
          <span className="font-bold text-indigo-800">Daily Quiz</span>
        </Link>
      </div>
    </div>
  );
}

function MissionCard({
  icon,
  title,
  points,
  completed = false,
}: {
  icon: React.ReactNode;
  title: string;
  points: number;
  completed?: boolean;
}) {
  return (
    <div className={`bg-green-50 p-4 rounded-2xl flex items-center gap-4 ${completed ? "opacity-60" : ""}`}>
      <div className="bg-white p-3 rounded-xl shadow-sm">{icon}</div>
      <div className="flex-1">
        <h4 className={`font-bold text-slate-700 ${completed ? "line-through" : ""}`}>{title}</h4>
        <span className="text-xs font-bold text-slate-500">+{points} XP</span>
      </div>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          completed ? "bg-green-500 text-white" : "border-2 border-slate-300"
        }`}
      >
        {completed ? "✓" : ""}
      </div>
    </div>
  );
}

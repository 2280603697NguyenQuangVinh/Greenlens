import { useState } from "react";
import { Flame, Leaf, Play, Clock, CheckCircle2, Circle } from "lucide-react";
import { useReward } from "@/state/rewardStore";
import { Link } from "react-router";

interface Mission {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  icon: React.ReactNode;
  bg: string;
}

const INITIAL_MISSIONS: Mission[] = [
  {
    id: "m1",
    title: "Identify 3 Leaves",
    points: 50,
    completed: true,
    icon: <Leaf className="text-green-500" size={22} />,
    bg: "bg-green-50",
  },
  {
    id: "m2",
    title: "Play 'Recycle Sorting'",
    points: 30,
    completed: true,
    icon: <Play className="text-blue-500" size={22} />,
    bg: "bg-blue-50",
  },
  {
    id: "m3",
    title: "Take a nature walk",
    points: 100,
    completed: false,
    icon: <Clock className="text-orange-500" size={22} />,
    bg: "bg-orange-50",
  },
];

export default function DailyActivity() {
  const { streak, addXp } = useReward();
  const [missions, setMissions] = useState(INITIAL_MISSIONS);

  const completedCount = missions.filter((m) => m.completed).length;
  const progress = Math.round((completedCount / missions.length) * 100);

  const toggleMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== id || m.completed) return m;
        addXp(m.points);
        return { ...m, completed: true };
      }),
    );
  };

  return (
    <div className="p-6 pb-24 animate-in fade-in duration-500">
      <h1 className="text-2xl font-black text-slate-800 mb-1">Daily Activity</h1>
      <p className="text-slate-500 font-medium text-sm mb-6">Complete missions to grow your streak</p>

      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-5 text-white mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="text-yellow-200" size={24} />
            <span className="font-bold text-lg">{streak} Day Streak</span>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">+50 XP bonus</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm mt-2 opacity-90">{completedCount} of {missions.length} missions done today</p>
      </div>

      <h2 className="font-bold text-lg text-slate-800 mb-4">Today&apos;s Missions</h2>
      <div className="flex flex-col gap-3 mb-6">
        {missions.map((mission) => (
          <button
            key={mission.id}
            type="button"
            onClick={() => toggleMission(mission.id)}
            disabled={mission.completed}
            className={`${mission.bg} p-4 rounded-2xl flex items-center gap-4 text-left ${
              mission.completed ? "opacity-70" : "hover:ring-2 hover:ring-green-300"
            }`}
          >
            <div className="bg-white p-3 rounded-xl shadow-sm">{mission.icon}</div>
            <div className="flex-1">
              <h4
                className={`font-bold text-slate-700 ${
                  mission.completed ? "line-through" : ""
                }`}
              >
                {mission.title}
              </h4>
              <span className="text-xs font-bold text-slate-500">+{mission.points} XP</span>
            </div>
            {mission.completed ? (
              <CheckCircle2 className="text-green-500" size={28} />
            ) : (
              <Circle className="text-slate-300" size={28} />
            )}
          </button>
        ))}
      </div>

      <Link
        to="/app"
        className="block text-center text-green-600 font-bold text-sm hover:underline"
      >
        ← Back to Home
      </Link>
    </div>
  );
}

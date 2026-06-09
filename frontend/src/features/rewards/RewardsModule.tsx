import { useEffect, useState } from "react";
import { Trophy, Star, Medal, Flame, Lock } from "lucide-react";
import { fetchRewardProfile } from "@/services/rewardApi";
import { useReward } from "@/state/rewardStore";
import type { Badge } from "@/services/rewardApi";

export default function RewardsModule() {
  const { level, xp, xpToNextLevel, streak, badges, setProfile, addXp } = useReward();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewardProfile().then((profile) => {
      setProfile(profile);
      setLoading(false);
    });
  }, [setProfile]);

  const xpProgress = Math.min(100, Math.round((xp / xpToNextLevel) * 100));

  if (loading) {
    return (
      <div className="p-6 text-slate-500 font-bold">Loading rewards...</div>
    );
  }

  return (
    <div className="p-6 pb-24 bg-orange-50 min-h-full">
      <h1 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Trophy className="text-orange-500" /> My Rewards
      </h1>

      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-6 text-white mb-8 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="uppercase text-orange-100 font-bold text-xs">Current Level</span>
            <h2 className="text-3xl font-black">Level {level}</h2>
          </div>
          <Medal size={32} className="text-yellow-300" />
        </div>
        <div className="flex justify-between text-sm font-bold mb-2">
          <span>{xp.toLocaleString()} XP</span>
          <span className="text-orange-100">{xpToNextLevel.toLocaleString()} XP</span>
        </div>
        <div className="w-full bg-black/20 h-4 rounded-full p-1">
          <div className="bg-white h-full rounded-full transition-all" style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl mb-8 flex items-center gap-4 shadow-sm border border-slate-100">
        <Flame size={32} className="text-orange-500" />
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">{streak} Day Streak!</h3>
          <p className="text-sm text-slate-500">Play tomorrow to keep it alive</p>
        </div>
        <button
          type="button"
          onClick={() => addXp(50)}
          className="bg-orange-50 text-orange-600 font-bold px-3 py-1 rounded-full text-sm"
        >
          Claim +50 XP
        </button>
      </div>

      <h3 className="font-bold text-xl mb-4 text-slate-800">Badges</h3>
      <div className="grid grid-cols-2 gap-4">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div
      className={`p-4 rounded-3xl flex flex-col items-center text-center relative border-2 ${
        badge.earned ? "bg-white border-transparent shadow-sm" : "bg-slate-50 border-slate-100 opacity-80"
      }`}
    >
      {!badge.earned && (
        <Lock size={14} className="absolute top-3 right-3 text-slate-300" />
      )}
      <div className="text-3xl mb-3">{badge.icon}</div>
      <h4 className="font-bold text-sm mb-1 text-slate-800">{badge.title}</h4>
      <p className="text-xs text-slate-500 mb-2">{badge.description}</p>
      {!badge.earned && badge.progress && (
        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full">
          {badge.progress}
        </span>
      )}
    </div>
  );
}

import { Trophy, Star, Medal, Flame, ChevronRight, Lock } from "lucide-react";

export default function RewardsModule() {
  return (
    <div className="p-6 pb-24 bg-orange-50 min-h-full animate-in fade-in duration-500">
      <h1 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Trophy className="text-orange-500" /> My Rewards
      </h1>

      {/* Level Card */}
      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-6 text-white mb-8 shadow-xl shadow-orange-200 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 text-white/20">
          <Star size={120} className="animate-[spin_20s_linear_infinite]" />
        </div>
        
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div>
            <span className="uppercase text-orange-100 font-bold text-xs tracking-wider">Current Level</span>
            <h2 className="text-3xl font-black">Level 5</h2>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/30">
            <Medal size={32} className="text-yellow-300 drop-shadow-md" />
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between text-sm font-bold mb-2">
            <span>2,450 XP</span>
            <span className="text-orange-100">3,000 XP</span>
          </div>
          <div className="w-full bg-black/20 h-4 rounded-full overflow-hidden p-1">
            <div className="bg-white h-full rounded-full w-[80%] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-[shimmer_2s_infinite]" />
            </div>
          </div>
          <p className="text-xs font-bold text-orange-100 mt-2 text-center">
            Only 550 XP to Level 6! Keep going!
          </p>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-white p-5 rounded-3xl mb-8 flex items-center gap-4 shadow-sm border border-slate-100">
        <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center relative">
          <Flame size={32} className="text-orange-500 absolute z-10" />
          <Flame size={32} className="text-orange-300 absolute blur-sm z-0" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">5 Day Streak!</h3>
          <p className="text-sm font-medium text-slate-500">Play tomorrow to keep it alive!</p>
        </div>
        <div className="bg-orange-50 text-orange-600 font-bold px-3 py-1 rounded-full text-sm">
          🔥 +50 XP
        </div>
      </div>

      <h3 className="font-bold text-xl mb-4 text-slate-800">Badges</h3>
      <div className="grid grid-cols-2 gap-4">
        <BadgeCard 
          icon="🦋"
          title="Bug Catcher"
          desc="Scan 5 insects"
          earned={true}
          color="bg-purple-100"
          textColor="text-purple-600"
        />
        <BadgeCard 
          icon="🌱"
          title="Botanist"
          desc="Scan 10 plants"
          earned={true}
          color="bg-green-100"
          textColor="text-green-600"
        />
        <BadgeCard 
          icon="♻️"
          title="Recycler"
          desc="Sort 20 items"
          earned={false}
          color="bg-blue-100"
          textColor="text-blue-600"
          progress="15/20"
        />
        <BadgeCard 
          icon="🌎"
          title="Earth Saver"
          desc="Reach Level 10"
          earned={false}
          color="bg-teal-100"
          textColor="text-teal-600"
          progress="Lvl 5/10"
        />
      </div>
      
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function BadgeCard({ icon, title, desc, earned, color, textColor, progress }: any) {
  return (
    <div className={`p-4 rounded-3xl flex flex-col items-center text-center relative border-2 ${earned ? `bg-white border-transparent shadow-sm` : `bg-slate-50 border-slate-100 grayscale-[0.5] opacity-80`}`}>
      {!earned && (
        <div className="absolute top-3 right-3 text-slate-300">
          <Lock size={14} />
        </div>
      )}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 ${earned ? color : 'bg-slate-200'}`}>
        {icon}
      </div>
      <h4 className={`font-bold text-sm mb-1 ${earned ? 'text-slate-800' : 'text-slate-500'}`}>{title}</h4>
      <p className="text-xs font-medium text-slate-500 leading-tight mb-2">{desc}</p>
      
      {!earned && progress && (
        <div className="mt-auto bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full w-full">
          {progress}
        </div>
      )}
    </div>
  );
}

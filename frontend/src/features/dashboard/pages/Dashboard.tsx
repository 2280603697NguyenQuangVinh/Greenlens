import { Link } from "react-router";
import { MASCOT_IMAGE } from "@/assets";

import { Star, Lock, Play } from "lucide-react";
import { useAuth } from "@/redux/authStore";
import { useReward } from "@/redux/rewardStore";

export default function Dashboard() {
  const { user } = useAuth();
  const { xp } = useReward();
  const name = user?.name || "Phúc";
  const xpDisplay = xp || 1280;
  const xpMax = 1500;
  const xpPercent = Math.min(100, Math.round((xpDisplay / xpMax) * 100));

  return (
    <div
      className="min-h-full pb-4"
      style={{
        backgroundColor: "#e8f8ef",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 border-3 border-white shadow-md flex items-center justify-center text-2xl overflow-hidden">
          🧒
        </div>
        <h1 className="flex-1 text-xl font-bold text-slate-800">Chào, {name}!</h1>
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="flex-1 h-3 bg-white/80 rounded-full overflow-hidden border border-green-200">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{xpDisplay} XP</span>
          <Star className="text-amber-400 fill-amber-400 shrink-0" size={22} />
        </div>
      </div>

      {/* Mascot + speech */}
      <div className="px-4 flex items-end gap-2 mb-4">
        <img
          src={MASCOT_IMAGE}
          alt="Mascot"
          className="h-16 w-auto shrink-0 object-contain"
          draggable={false}
        />
        <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border-2 border-green-100 flex-1">
          <p className="text-sm font-semibold text-slate-700 leading-snug">
            Chào {name}! Sẵn sàng cho thử thách hôm nay chưa? 🔥
          </p>
        </div>
      </div>

      {/* Today's mission */}
      <section className="mx-4 mb-4 bg-white rounded-3xl overflow-hidden shadow-md border-2 border-green-100">
        <div className="bg-gradient-to-r from-green-100 to-emerald-50 px-4 py-2.5 border-b border-green-100">
          <h2 className="font-bold text-green-800 text-center text-sm">Nhiệm Vụ Hôm Nay</h2>
        </div>
        <div className="p-4">
          <div className="flex gap-3 mb-3">
            <div className="text-4xl">🗑️♻️</div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                Thử Thách Ngày 1: Chụp Ảnh Rác
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Hãy tìm 2 rác tái chế trong nhà và sử dụng Camera chụp chúng!
              </p>
            </div>
            <div className="text-3xl">🏅</div>
          </div>
          <div className="flex items-center gap-3 mb-4 text-sm font-bold">
            <span className="flex items-center gap-1 text-amber-600">
              🪙 +15 XP
            </span>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
              First Scan
            </span>
          </div>
          <Link
            to="/app/camera"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-white font-bold text-base shadow-lg shadow-green-200 active:scale-[0.98]"
          >
            Bắt đầu ngay! <Play size={18} fill="white" />
          </Link>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="mx-4 mb-4 bg-white rounded-3xl overflow-hidden shadow-md border-2 border-orange-100">
        <div className="bg-gradient-to-r from-orange-200 to-amber-100 px-4 py-2.5">
          <h2 className="font-bold text-orange-900 text-center text-sm">Xếp Hạng</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {[{ rank: 1, name, xp: xpDisplay, highlight: true }].map((row) => (
            <li
              key={row.rank}
              className={`flex items-center gap-3 px-4 py-3 ${
                row.highlight ? "bg-green-50" : ""
              }`}
            >
              <span className="w-6 font-black text-slate-500">{row.rank}.</span>
              <span className="flex-1 font-bold text-slate-800">{row.name}</span>
              <span className="font-bold text-green-600 text-sm">{row.xp} XP</span>
            </li>
          ))}
          <li className="px-4 py-3 text-center text-xs font-semibold text-slate-500">
            Chưa có người chơi khác.
          </li>
        </ul>
      </section>

      {/* Badges */}
      <section className="mx-4 mb-6 bg-white rounded-3xl overflow-hidden shadow-md border-2 border-blue-100">
        <div className="bg-gradient-to-r from-sky-200 to-blue-100 px-4 py-2.5">
          <h2 className="font-bold text-blue-900 text-center text-sm">
            Huy Hiệu Của {name}
          </h2>
        </div>
        <div className="flex justify-around gap-2 p-5">
          <BadgeSlot unlocked emoji="☕" label="First Scan" />
          <BadgeSlot locked />
          <BadgeSlot locked />
          <BadgeSlot locked />
        </div>
      </section>
    </div>
  );
}

function BadgeSlot({
  unlocked,
  emoji,
  label,
}: {
  unlocked?: boolean;
  emoji?: string;
  label?: string;
}) {
  if (unlocked) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="w-14 h-14 rounded-full bg-amber-100 border-3 border-amber-300 flex items-center justify-center text-2xl shadow-inner">
          {emoji}
        </div>
        {label && <span className="text-[10px] font-bold text-slate-600">{label}</span>}
      </div>
    );
  }
  return (
    <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
      <Lock className="text-slate-400" size={20} />
    </div>
  );
}

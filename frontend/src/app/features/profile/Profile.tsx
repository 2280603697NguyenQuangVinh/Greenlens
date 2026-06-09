import { useState } from "react";
import { motion } from "motion/react";
import { Edit, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/state/authStore";
import { useReward } from "@/state/rewardStore";
import { logout } from "@/features/auth/authService";
import { AvatarPreview } from "@/shared/components/AvatarPreview";

// ---------------------------------------------------------------------------
// Achievement data — matches business spec badges
// ---------------------------------------------------------------------------

const ACHIEVEMENTS = [
  {
    id: "first_scan",
    label: "Quét Rác\nLần Đầu",
    emoji: "♻️",
    unlocked: true,
    date: "05/11/2026",
  },
  {
    id: "quiz_star",
    label: "Siêu Sao\nCâu Đố",
    emoji: "⭐",
    unlocked: false,
    date: null,
  },
  {
    id: "game_king",
    label: "Vua Trò\nChơi",
    emoji: "🎮",
    unlocked: false,
    date: null,
  },
  {
    id: "cleaner",
    label: "Nhà Vệ\nSinh Nhỏ",
    emoji: "🧹",
    unlocked: false,
    date: null,
  },
  {
    id: "streak7",
    label: "Thách Thức\n7 ngày",
    emoji: "📅",
    unlocked: false,
    date: null,
    star: true,
  },
  {
    id: "eco_hero",
    label: "Vệ Sĩ\nCây Xanh",
    emoji: "🌿",
    unlocked: false,
    date: null,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Profile() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const { xp } = useReward();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const name = user?.name || "Nguyễn Văn P";
  const xpDisplay = xp || 1280;
  const xpMax = 2500;
  const xpPercent = Math.min(100, Math.round((xpDisplay / xpMax) * 100));

  const avatarCfg = (user as any)?.avatarConfig;

  const handleLogout = async () => {
    await logout();
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className="min-h-full pb-8"
      style={{
        backgroundColor: "#d4f5e4",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2322c55e' fill-opacity='0.07'%3E%3Cpath d='M20 3L3 20l17 17 17-17z'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Recycle icon top-center */}
      <div className="flex justify-center pt-5 mb-1">
        <span className="text-3xl">♻️</span>
      </div>

      {/* Title */}
      <h1
        className="text-center font-black text-green-800 mb-5"
        style={{ fontSize: "1.7rem", fontFamily: "'Fredoka', sans-serif" }}
      >
        Hồ Sơ Của Em
      </h1>

      {/* Avatar circle */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-green-600 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
            {avatarCfg ? (
              <div className="w-full h-full flex items-center justify-center">
                <AvatarPreview avatar={avatarCfg} size={112} />
              </div>
            ) : (
              <span className="text-6xl">🧒</span>
            )}
          </div>
          <button
            onClick={() => navigate("/avatar")}
            className="absolute -bottom-1 -right-1 w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
          >
            <Edit size={16} className="text-white" />
          </button>
        </div>

        <h2 className="mt-3 text-xl font-black text-green-900">{name}</h2>
      </div>

      {/* XP bar */}
      <div className="mx-5 mb-6 bg-white rounded-2xl px-4 py-3 shadow-sm border border-green-200">
        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[11px]">Cấp 3</span>
          <span>{xpDisplay} / {xpMax} XP</span>
        </div>
        <div className="h-4 bg-green-100 rounded-full overflow-hidden border border-green-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full bg-gradient-to-r from-[#4ade80] to-[#22c55e]"
          />
        </div>
      </div>

      {/* Achievements */}
      <div className="mx-4 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((ach) => (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 relative ${
                ach.unlocked
                  ? "bg-[#d4ecc5] border-2 border-green-300"
                  : "bg-[#c8c8c8]/70 border-2 border-gray-300"
              }`}
            >
              {ach.star && (
                <span className="absolute top-1.5 right-1.5 text-sm">⭐</span>
              )}
              {!ach.unlocked && (
                <span className="absolute top-1.5 right-1.5 text-base">🔒</span>
              )}

              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                  ach.unlocked ? "bg-[#a8d98a]" : "bg-gray-400/50"
                }`}
              >
                <span style={{ filter: ach.unlocked ? "none" : "grayscale(1) opacity(0.5)" }}>
                  {ach.emoji}
                </span>
              </div>

              <span
                className={`text-[10px] font-bold text-center leading-tight whitespace-pre-line ${
                  ach.unlocked ? "text-green-800" : "text-gray-500"
                }`}
              >
                {ach.label}
              </span>

              {ach.unlocked && ach.date && (
                <span className="text-[9px] text-green-600 font-semibold">{ach.date}</span>
              )}
              {!ach.unlocked && (
                <span className="text-[9px] text-gray-400 font-semibold">Chưa h/thành</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="mx-5">
        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border-2 border-red-200 text-red-600 font-bold text-sm"
          >
            <LogOut size={18} />
            Đăng Xuất
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-4 border-2 border-red-200">
            <p className="text-center font-bold text-slate-700 text-sm mb-3">
              Bạn có chắc muốn đăng xuất?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm"
              >
                Đăng Xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

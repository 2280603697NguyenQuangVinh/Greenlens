import React from "react"
import type { UserProfile } from "@/services/greenLens"
import { Mascot } from "@/features/dashboard/components/Mascot"
import { BottomNav } from "@/features/dashboard/components/BottomNav"
import { FF_FREDOKA } from "@/utils/constants"
import type { AvatarConfig } from "@/utils/types"

import { BACKGROUND_IMAGE, ACHIEVEMENTS, DEFAULT_UNLOCKED } from "@/assets"
import { AchievementBadgeCard } from "@/features/dashboard/components/AchievementBadge"
import { XpLevelBar } from "@/features/dashboard/components/XpLevelBar"

const BG = BACKGROUND_IMAGE

export function ProfileScreen({
  cfg,
  go,
  profile,
  onEditAvatar,
  onLogout,
  onAdminLogin,
  adminAuthenticated = false,
}: {
  cfg: AvatarConfig
  go: (s: number) => void
  profile: UserProfile
  onEditAvatar: () => void
  onLogout: () => void
  onAdminLogin: () => void
  adminAuthenticated?: boolean
}) {
  const xp = profile.xp ?? 0

  const isUnlocked = (id: string) => DEFAULT_UNLOCKED.includes(id as (typeof DEFAULT_UNLOCKED)[number])
  const badgeCards = ACHIEVEMENTS.map((achievement) => ({
    achievement,
    unlocked: isUnlocked(achievement.id),
    date: isUnlocked(achievement.id) ? "05/11/2026" : "Chưa h/thành",
  }))

  return (
    <div className="h-full flex flex-col" style={{ backgroundImage: `url("${BG}")`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="px-4 pt-5 pb-3 text-center">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-black text-[#285f2e] drop-shadow-sm" style={{ ...FF_FREDOKA, fontWeight: 700 }}>
            Hồ Sơ Của Em
          </h1>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full bg-[#ef4444] px-3 py-1.5 text-xs font-bold text-white active:scale-95"
          >
            Đăng xuất
          </button>
        </div>

        <div className="mx-auto mt-4 h-40 w-40 rounded-full border-2 border-[#1d4120] bg-[#6fa26f] flex items-center justify-center overflow-hidden">
          <Mascot cfg={cfg} size={152} />
        </div>
        <button
          type="button"
          onClick={onEditAvatar}
          className="-mt-12 ml-[68%] flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1d4120] bg-[#5f915f] text-2xl active:scale-95"
          title="Chỉnh sửa avatar"
        >
          ✎
        </button>

        <h2 className="mt-2 text-[22px] font-black text-black">
          {profile.characterName?.trim() || "Nhân vật của em"}
        </h2>

        <XpLevelBar xp={xp} profile className="mx-auto mt-3 w-full max-w-[320px] px-1" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-2">
        <div className="grid grid-cols-3 gap-3">
          {badgeCards.map(({ achievement, unlocked, date }) => (
            <AchievementBadgeCard
              key={achievement.id}
              achievement={achievement}
              unlocked={unlocked}
              date={date}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          className="mx-auto mt-4 block rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700"
        >
          ← Về Trang Chủ
        </button>
        <button
          type="button"
          onClick={onEditAvatar}
          className="mx-auto mt-2 block rounded-full bg-[#22c55e] px-4 py-2 text-sm font-bold text-white active:scale-95"
        >
          Chỉnh sửa Avatar
        </button>
        <button
          type="button"
          onClick={onAdminLogin}
          className={`mx-auto mt-3 block rounded-full px-4 py-2 text-sm font-bold border active:scale-95 ${
            adminAuthenticated
              ? "bg-green-600 border-green-700 text-white"
              : "bg-white/90 border-green-300 text-green-700"
          }`}
        >
          {adminAuthenticated ? "Admin mode đang bật" : "Admin Login"}
        </button>
      </div>

      <BottomNav screen={5} go={go} avatarCfg={cfg} />
    </div>
  )
}

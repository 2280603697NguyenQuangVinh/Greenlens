import React from "react"
import type { UserProfile } from "@/services/greenLens"
import { Mascot } from "@/features/dashboard/components/Mascot"
import { BottomNav } from "@/features/dashboard/components/BottomNav"
import { FF_QUIZ } from "@/utils/constants"
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
}: {
  cfg: AvatarConfig
  go: (s: number) => void
  profile: UserProfile
  onEditAvatar: () => void
  onLogout: () => void
}) {
  const xp = profile.xp ?? 0

  const isUnlocked = (id: string) => DEFAULT_UNLOCKED.includes(id as (typeof DEFAULT_UNLOCKED)[number])
  const badgeCards = ACHIEVEMENTS.map((achievement) => ({
    achievement,
    unlocked: isUnlocked(achievement.id),
    date: isUnlocked(achievement.id) ? "05/11/2026" : undefined,
  }))

  return (
    <div
      className="flex h-full flex-col"
      style={{
        ...FF_QUIZ,
        backgroundImage: `url("${BG}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="px-4 pt-5 pb-3 text-center">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-black text-[#285f2e] drop-shadow-sm" style={{ ...FF_QUIZ, fontWeight: 800 }}>
            Hồ Sơ Của Em
          </h1>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-rose-300 bg-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 active:scale-95"
            style={FF_QUIZ}
          >
            Đăng xuất
          </button>
        </div>

        <div className="mx-auto mt-4 h-40 w-40 rounded-full border-2 border-emerald-300/50 bg-[#8FBC8F]/80 flex items-center justify-center overflow-hidden shadow-[0_8px_24px_rgba(45,106,79,0.12)]">
          <Mascot cfg={cfg} size={152} />
        </div>
        <button
          type="button"
          onClick={onEditAvatar}
          className="-mt-12 ml-[68%] flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-300/50 bg-[#7CB47C] text-2xl active:scale-95 shadow-[0_4px_12px_rgba(45,106,79,0.15)]"
          title="Chỉnh sửa avatar"
        >
          ✎
        </button>

        <h2 className="mt-2 text-[22px] font-black text-green-900" style={{ ...FF_QUIZ, fontWeight: 800 }}>
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
          style={FF_QUIZ}
        >
          ← Về Trang Chủ
        </button>
        <button
          type="button"
          onClick={onEditAvatar}
          className="mx-auto mt-2 block rounded-[1.25rem] px-5 py-3 text-sm font-bold text-white active:scale-[0.97] border-b-[4px] border-[#15803D] shadow-[0_8px_20px_rgba(34,197,94,0.22)]"
          style={{ ...FF_QUIZ, background: "linear-gradient(180deg, #6EE7A8 0%, #34D399 48%, #22C55E 100%)" }}
        >
          Chỉnh sửa Avatar
        </button>
      </div>

      <BottomNav screen={5} go={go} avatarCfg={cfg} />
    </div>
  )
}

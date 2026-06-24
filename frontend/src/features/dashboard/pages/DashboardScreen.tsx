import { useMemo } from "react"
import { motion } from "motion/react"
import type { UserProfile } from "@/services/greenLens"
import { BottomNav } from "@/features/dashboard/components/BottomNav"
import { FF_FREDOKA } from "@/utils/constants"
import type { AvatarConfig } from "@/utils/types"
import { Mascot } from "@/features/dashboard/components/Mascot"
import { useStreak } from "@/hooks/useStreak"
import { StreakSection } from "@/features/streak"

import { BACKGROUND_IMAGE, ACHIEVEMENTS, DEFAULT_UNLOCKED } from "@/assets"
import { AchievementBadgeCircle } from "@/features/dashboard/components/AchievementBadge"

const BG = BACKGROUND_IMAGE

const MOCK_LEADERBOARD = [
  { name: "Người A", xp: 1180 },
  { name: "Người B", xp: 1050 },
  { name: "Lan", xp: 920 },
]

export function DashboardScreen({
  cfg,
  go,
  profile,
  streakRefreshKey = 0,
}: {
  cfg: AvatarConfig
  go: (s: number) => void
  profile: UserProfile
  streakRefreshKey?: number
}) {
  const {
    data: streakData,
    loading: streakLoading,
    error: streakError,
    streakIncreased,
    rewardUnlocked,
    clearAnimations,
  } = useStreak(streakRefreshKey)

  const xp = profile.xp ?? 0
  const xpMax = 2500
  const xpPct = Math.min(100, Math.max(4, Math.round((xp / xpMax) * 100)))
  const displayName = profile.characterName?.trim() || cfg.characterName?.trim() || "bạn"
  const dashboardBadges = ACHIEVEMENTS.slice(0, 4)
  const isUnlocked = (id: string) => DEFAULT_UNLOCKED.includes(id as (typeof DEFAULT_UNLOCKED)[number])

  const leaderboard = useMemo(() => {
    return [
      { name: displayName, xp, isUser: true },
      ...MOCK_LEADERBOARD.map((row) => ({ ...row, isUser: false })),
    ]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 3)
      .map((row, index) => ({ ...row, rank: index + 1 }))
  }, [displayName, xp])

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundImage: `url("${BG}")`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <header className="flex items-center gap-3 px-3 pb-2.5 pt-3">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1b3a1b] bg-[#a8dcae] shadow-sm">
          <Mascot cfg={cfg} size={60} rounded />
        </div>
        <div className="min-w-0 flex-1">
          <h1
            className="truncate text-2xl font-black leading-tight text-black"
            style={{ ...FF_FREDOKA, fontWeight: 700 }}
          >
            Chào, {displayName}!
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-3.5 flex-1 overflow-hidden rounded-full border border-white/80 bg-white/70">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.7 }}
                className="h-full rounded-full bg-[#7ED957]"
              />
            </div>
            <span className="shrink-0 text-base font-black text-[#1b4332]">{xp} XP ⭐</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 pb-2">
        <StreakSection
          data={streakData}
          loading={streakLoading}
          error={streakError}
          displayName={displayName}
          streakIncreased={streakIncreased}
          rewardUnlocked={rewardUnlocked}
          onClearAnimations={clearAnimations}
          onNavigate={go}
        />

        <div className="mb-2 grid min-h-[148px] grid-cols-2 gap-2.5">
          <section className="flex flex-col overflow-hidden rounded-2xl border-2 border-[#f2aa58] bg-[#ffd39b]">
            <h2 className="shrink-0 py-2 text-center text-[15px] font-black">🏆 Xếp hạng</h2>
            <div className="flex flex-1 flex-col justify-center bg-white/45 px-2.5 pb-2.5">
              {leaderboard.map((row) => (
                <div
                  key={`${row.rank}-${row.name}`}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[14px] font-black ${
                    row.isUser ? "bg-[#b9f0af]" : ""
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {row.rank}. {row.name}
                    {row.isUser ? " (bạn)" : ""}
                  </span>
                  <span className="ml-1 shrink-0 text-[13px]">{row.xp} XP</span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col overflow-hidden rounded-2xl border-2 border-[#3da9f5] bg-[#63b8ff]">
            <h2 className="shrink-0 py-2 text-center text-[15px] font-black">🎖️ Huy hiệu</h2>
            <div className="flex flex-1 items-center justify-center gap-1 bg-white/40 px-1.5 pb-2.5 pt-1">
              {dashboardBadges.map((achievement) => (
                <AchievementBadgeCircle
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={isUnlocked(achievement.id)}
                  size="md"
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      <BottomNav screen={1} go={go} avatarCfg={cfg} />
    </div>
  )
}

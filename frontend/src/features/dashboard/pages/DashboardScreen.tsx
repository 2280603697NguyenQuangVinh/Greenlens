import { useMemo } from "react"
import type { UserProfile } from "@/services/greenLens"
import { BottomNav } from "@/features/dashboard/components/BottomNav"
import { FF_FREDOKA } from "@/utils/constants"
import type { AvatarConfig } from "@/utils/types"
import { Mascot } from "@/features/dashboard/components/Mascot"
import { useStreak } from "@/hooks/useStreak"
import { StreakSection } from "@/features/streak"

import { BACKGROUND_IMAGE, ACHIEVEMENTS, DEFAULT_UNLOCKED } from "@/assets"
import { AchievementBadgeCircle } from "@/features/dashboard/components/AchievementBadge"
import { XpLevelBar } from "@/features/dashboard/components/XpLevelBar"
import { hasSavedChild } from "@/services/childProfileStorage"

const BG = BACKGROUND_IMAGE

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
    showStreakMark,
    rewardUnlocked,
    unlockedMilestone,
    showXpFloat,
    clearAnimations,
  } = useStreak(streakRefreshKey)

  const xp = profile.xp ?? 0
  const displayName = profile.characterName?.trim() || cfg.characterName?.trim() || "bạn"
  const hasAccount = hasSavedChild()
  const isUnlocked = (id: string) => DEFAULT_UNLOCKED.includes(id as (typeof DEFAULT_UNLOCKED)[number])

  const dashboardBadges = useMemo(() => {
    return [...ACHIEVEMENTS]
      .sort((a, b) => {
        const aUnlocked = isUnlocked(a.id)
        const bUnlocked = isUnlocked(b.id)
        if (aUnlocked === bUnlocked) return 0
        return aUnlocked ? -1 : 1
      })
      .slice(0, 4)
  }, [])

  const leaderboard = useMemo(() => {
    if (!hasAccount) return []
    const userXp = xp
    return [
      { rank: 1, name: displayName, xp: userXp, isUser: true },
      { rank: 2, name: "Người A", xp: Math.max(0, userXp - 5), isUser: false },
      { rank: 3, name: "Người B", xp: Math.max(0, userXp - 10), isUser: false },
    ]
  }, [displayName, hasAccount, xp])

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
            className="truncate text-2xl font-normal leading-tight text-black"
            style={{ ...FF_FREDOKA, fontWeight: 400 }}
          >
            Chào, {displayName}!
          </h1>
          <XpLevelBar xp={xp} className="mt-2" compact />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 pb-2">
        <StreakSection
          data={streakData}
          loading={streakLoading}
          error={streakError}
          displayName={displayName}
          streakIncreased={streakIncreased}
          showStreakMark={showStreakMark}
          rewardUnlocked={rewardUnlocked}
          unlockedMilestone={unlockedMilestone}
          showXpFloat={showXpFloat}
          onClearAnimations={clearAnimations}
          onNavigate={go}
        />

        <div className={`mb-2 grid min-h-[148px] gap-2.5 ${hasAccount ? "grid-cols-2" : "grid-cols-1"}`}>
          {hasAccount ? (
            <section className="flex flex-col overflow-hidden rounded-2xl border-2 border-[#f2aa58] bg-[#ffd39b]">
              <h2 className="shrink-0 py-2 text-center text-[15px]">Xếp hạng</h2>
              <div className="flex flex-1 flex-col justify-center bg-white/45 px-2.5 pb-2.5">
                {leaderboard.map((row) => (
                  <div
                    key={`${row.rank}-${row.name}`}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[14px] ${
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
          ) : null}

          <section className="flex flex-col overflow-hidden rounded-2xl border-2 border-[#3da9f5] bg-[#63b8ff]">
            <h2 className="shrink-0 py-2 text-center text-[15px]">Huy Hiệu</h2>
            <div
              className={`grid flex-1 place-items-center gap-2 bg-white/40 px-2 pb-2.5 pt-1 ${
                hasAccount ? "grid-cols-2 grid-rows-2" : "grid-cols-4"
              }`}
            >
              {dashboardBadges.map((achievement) => (
                <AchievementBadgeCircle
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={isUnlocked(achievement.id)}
                  size={hasAccount ? "sm" : "md"}
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

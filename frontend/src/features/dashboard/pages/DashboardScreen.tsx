import { useEffect, useMemo, useState } from "react"
import type { UserProfile } from "@/services/greenLens"
import { BottomNav } from "@/features/dashboard/components/BottomNav"
import { FF_QUIZ, FF_NUNITO } from "@/utils/constants"
import type { AvatarConfig } from "@/utils/types"
import { Mascot } from "@/features/dashboard/components/Mascot"
import { useStreak } from "@/hooks/useStreak"
import { StreakSection } from "@/features/streak"

import { BACKGROUND_IMAGE, ACHIEVEMENTS, DEFAULT_UNLOCKED } from "@/assets"
import { AchievementBadgeCircle } from "@/features/dashboard/components/AchievementBadge"
import { XpLevelBar } from "@/features/dashboard/components/XpLevelBar"
import { hasSavedChild } from "@/services/childProfileStorage"
import {
  getChildProfileLeaderboard,
  type LeaderboardEntry,
} from "@/services/childProfile"
import { applyLocalLeaderboardTotals } from "@/features/dashboard/utils/leaderboardUtils"

const BG = BACKGROUND_IMAGE

export function DashboardScreen({
  cfg,
  go,
  profile,
  streakRefreshKey = 0,
  leaderboardRefreshKey = 0,
}: {
  cfg: AvatarConfig
  go: (s: number) => void
  profile: UserProfile
  streakRefreshKey?: number
  leaderboardRefreshKey?: number
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardError, setLeaderboardError] = useState(false)

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

  useEffect(() => {
    if (!hasAccount) {
      setLeaderboard([])
      return
    }

    let cancelled = false
    setLeaderboardError(false)

    void getChildProfileLeaderboard(profile.badgeId, 10)
      .then((rows) => {
        if (!cancelled) {
          setLeaderboard(applyLocalLeaderboardTotals(rows, profile.badgeId))
        }
      })
      .catch(() => {
        if (cancelled) return
        setLeaderboardError(true)
        setLeaderboard(
          applyLocalLeaderboardTotals(
            [
              {
                rank: 1,
                childId: profile.badgeId,
                name: displayName,
                miniGameHighScore: 0,
                isCurrentUser: true,
              },
            ],
            profile.badgeId,
          ),
        )
      })

    return () => {
      cancelled = true
    }
  }, [displayName, hasAccount, profile.badgeId, xp, leaderboardRefreshKey])

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
      <header className="flex items-center gap-3 px-3 pb-2.5 pt-3">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1b3a1b] bg-[#a8dcae] shadow-sm">
          <Mascot cfg={cfg} size={60} rounded />
        </div>
        <div className="min-w-0 flex-1">
          <h1
            className="truncate text-2xl font-normal leading-tight text-black"
            style={{ ...FF_QUIZ, fontWeight: 700 }}
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

        <div className={`mb-2 grid gap-2.5 ${hasAccount ? "grid-cols-2" : "grid-cols-1"}`}>
          {hasAccount ? (
            <section
              className="flex max-h-[220px] flex-col overflow-hidden rounded-2xl border-2 border-[#f2aa58] bg-[#ffd39b]"
              style={FF_NUNITO}
            >
              <h2 className="shrink-0 py-2 text-center text-[15px] font-semibold">Xếp hạng</h2>
              <div className="min-h-0 flex-1 overflow-y-auto bg-white/45 px-2.5 pb-2.5">
                {leaderboard.map((row) => (
                  <div
                    key={row.childId}
                    className={`mb-1 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] last:mb-0 ${
                      row.isCurrentUser ? "bg-[#b9f0af]" : ""
                    }`}
                  >
                    <span className="min-w-0 truncate font-normal">
                      {row.rank}. {row.name}
                      {row.isCurrentUser ? " (bạn)" : ""}
                    </span>
                    <span className="ml-1 shrink-0 text-[12px] font-normal tabular-nums">
                      {row.miniGameHighScore} điểm
                    </span>
                  </div>
                ))}
                {leaderboard.length < 2 ? (
                  <p className="px-2 pt-1 text-center text-[11px] text-slate-600">
                    {leaderboardError
                      ? "Đang dùng dữ liệu của bạn."
                      : "Chưa có người chơi khác."}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="flex flex-col overflow-hidden rounded-2xl border-2 border-[#3da9f5] bg-[#63b8ff]">
            <h2 className="shrink-0 py-2 text-center text-[15px] font-semibold" style={FF_QUIZ}>Huy Hiệu</h2>
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

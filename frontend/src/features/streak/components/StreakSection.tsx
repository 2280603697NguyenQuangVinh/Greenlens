import { useCallback, useEffect } from "react"
import { motion } from "motion/react"
import mascotPng from "@/assets/Character/mascot/mascot.png"
import { CharacterSpeechBubble } from "@/features/dashboard/components/CharacterSpeechBubble"
import { StreakCard } from "./StreakCard"
import { WeeklyCalendar } from "./WeeklyCalendar"
import { DailyGoalProgress } from "./DailyGoalProgress"
import { RewardMilestones } from "./RewardMilestones"
import { RewardUnlockModal } from "./RewardUnlockModal"
import { StreakCelebrateOverlay } from "./StreakCelebrateOverlay"
import { XpFloatToast } from "./XpFloatToast"
import { getMascotStreakMessage } from "@/features/streak/utils/streakUi"
import { getStreakStatusBanner } from "@/features/streak/utils/streakStatus"
import type { StreakBundle, RewardMilestone } from "@/services/streak/types"
import { fireScanConfetti } from "@/features/camera/utils/scanConfetti"
import { playRewardChime } from "@/features/streak/utils/streakSounds"
import { unlockSupertonicOnGesture } from "@/services/supertonic/preload"

function StreakSkeleton() {
  return (
    <div className="mb-3">
      <div className="mb-2.5 flex animate-pulse items-end gap-2 px-1">
        <div className="h-20 w-16 shrink-0 rounded-2xl bg-white/50" />
        <div className="h-14 flex-1 rounded-2xl bg-white/50" />
      </div>
      <div className="animate-pulse overflow-hidden rounded-3xl border-2 border-white/60 bg-white/50 p-4">
        <div className="mb-2 h-12 rounded-2xl bg-orange-200/50" />
        <div className="mb-2 h-8 rounded-xl bg-slate-200/60" />
        <div className="h-20 rounded-xl bg-slate-200/60" />
      </div>
    </div>
  )
}

export function StreakSection({
  data,
  loading,
  error,
  displayName,
  streakIncreased,
  showStreakMark,
  rewardUnlocked,
  unlockedMilestone,
  showXpFloat,
  onClearAnimations,
  onNavigate,
}: {
  data: StreakBundle | null
  loading: boolean
  error: string | null
  displayName: string
  streakIncreased?: boolean
  showStreakMark?: boolean
  rewardUnlocked?: boolean
  unlockedMilestone?: RewardMilestone | null
  showXpFloat?: boolean
  onClearAnimations?: () => void
  onNavigate?: (screen: number) => void
}) {
  const handleCelebrateComplete = useCallback(() => {
    onClearAnimations?.()
  }, [onClearAnimations])

  useEffect(() => {
    if (!rewardUnlocked) return
    fireScanConfetti()
    playRewardChime()
    const timer = window.setTimeout(() => onClearAnimations?.(), 3500)
    return () => window.clearTimeout(timer)
  }, [rewardUnlocked, onClearAnimations])

  useEffect(() => {
    if (!streakIncreased || showStreakMark) return
    const timer = window.setTimeout(() => onClearAnimations?.(), 2600)
    return () => window.clearTimeout(timer)
  }, [showStreakMark, streakIncreased, onClearAnimations])

  const handleNavigate = (screen: number) => {
    void unlockSupertonicOnGesture()
    onNavigate?.(screen)
  }

  if (loading && !data) {
    return <StreakSkeleton />
  }

  if (error && !data) {
    return (
      <div className="mb-3 rounded-2xl border-2 border-red-200 bg-red-50 p-2.5 text-center text-xs text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  const { streak, dailyActivity, rewards, milestones, streakStatus, gapAnchorDate, freezeGapDayKeys } = data
  const statusBanner = getStreakStatusBanner(streakStatus)
  const mascotMessage = getMascotStreakMessage(
    streak,
    rewards,
    dailyActivity,
    streakStatus,
  )
  const showWelcome =
    streak.currentStreak === 0 && dailyActivity.completedCount === 0

  const showCelebrate = Boolean(showStreakMark)

  return (
    <section className="relative mb-3">
      <StreakCelebrateOverlay
        open={showCelebrate}
        currentStreak={streak.currentStreak}
        lastActiveDate={streak.lastActiveDate}
        todayCompletedCount={dailyActivity.completedCount}
        streakStatus={streakStatus}
        gapAnchorDate={gapAnchorDate}
        freezeGapDayKeys={freezeGapDayKeys}
        onComplete={handleCelebrateComplete}
      />

      <XpFloatToast show={Boolean(showXpFloat)} />

      <RewardUnlockModal
        open={Boolean(rewardUnlocked && unlockedMilestone)}
        title={unlockedMilestone?.label ?? rewards.nextRewardName}
        imageUrl={unlockedMilestone?.imageUrl}
        onClose={() => onClearAnimations?.()}
      />

      <div className="mb-2.5 flex items-center gap-1.5 px-0.5">
        <motion.div
          className="shrink-0"
          animate={showCelebrate ? { y: [0, -8, 0], scale: [1, 1.05, 1] } : { y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <img
            src={mascotPng}
            alt="Mascot"
            className="h-[4.75rem] w-auto object-contain drop-shadow-md sm:h-[5.25rem]"
            draggable={false}
          />
        </motion.div>
        <CharacterSpeechBubble>
          {showWelcome
            ? `Bắt đầu hành trình xanh hôm nay, ${displayName}!`
            : mascotMessage}
        </CharacterSpeechBubble>
      </div>

      <div className="overflow-hidden rounded-3xl border-2 border-white/80 bg-white/95 shadow-[0_4px_24px_rgba(45,106,79,0.14)] backdrop-blur-sm">
        <div className="p-4">
          <StreakCard
            streak={streak}
            rewards={rewards}
            pulse={showCelebrate || Boolean(streakIncreased)}
            compact
            statusBanner={statusBanner}
          />

          <div className="my-3 h-px bg-[#e8f0ea]" aria-hidden />

          <WeeklyCalendar
            currentStreak={streak.currentStreak}
            lastActiveDate={streak.lastActiveDate}
            todayCompletedCount={dailyActivity.completedCount}
            streakStatus={streakStatus}
            gapAnchorDate={gapAnchorDate}
            freezeGapDayKeys={freezeGapDayKeys}
            compact
          />

          <div className="my-3 h-px bg-[#e8f0ea]" aria-hidden />

          <div className="rounded-2xl border-2 border-[#6bc97a] bg-[#e8f8ef] p-3.5 shadow-[0_2px_12px_rgba(82,183,136,0.18)]">
            <DailyGoalProgress daily={dailyActivity} onNavigate={handleNavigate} compact />
          </div>

          <div className="my-3 h-px bg-[#e8f0ea]" aria-hidden />

          <RewardMilestones
            milestones={milestones}
            currentStreak={streak.currentStreak}
            compact
          />
        </div>
      </div>
    </section>
  )
}

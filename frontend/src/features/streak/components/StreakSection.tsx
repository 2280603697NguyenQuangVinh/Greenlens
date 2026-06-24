import { useEffect } from "react"
import { motion } from "motion/react"
import mascotPng from "@/assets/Character/mascot/mascot.png"
import { CharacterSpeechBubble } from "@/features/dashboard/components/CharacterSpeechBubble"
import { StreakCard } from "./StreakCard"
import { WeeklyCalendar } from "./WeeklyCalendar"
import { DailyGoalProgress } from "./DailyGoalProgress"
import { RewardMilestones } from "./RewardMilestones"
import { getMascotStreakMessage } from "@/features/streak/utils/streakUi"
import type { StreakBundle } from "@/services/streak/types"
import { fireScanConfetti } from "@/features/camera/utils/scanConfetti"
import { unlockSupertonicOnGesture } from "@/services/supertonic/preload"

function StreakSkeleton() {
  return (
    <div className="mb-3 animate-pulse overflow-hidden rounded-3xl border-2 border-white/60 bg-white/50 p-3">
      <div className="mb-2 h-12 rounded-2xl bg-orange-200/50" />
      <div className="mb-2 h-8 rounded-xl bg-slate-200/60" />
      <div className="h-20 rounded-xl bg-slate-200/60" />
    </div>
  )
}

export function StreakSection({
  data,
  loading,
  error,
  displayName,
  streakIncreased,
  rewardUnlocked,
  onClearAnimations,
  onNavigate,
}: {
  data: StreakBundle | null
  loading: boolean
  error: string | null
  displayName: string
  streakIncreased?: boolean
  rewardUnlocked?: boolean
  onClearAnimations?: () => void
  onNavigate?: (screen: number) => void
}) {
  useEffect(() => {
    if (!rewardUnlocked) return
    fireScanConfetti()
    const timer = window.setTimeout(() => onClearAnimations?.(), 2500)
    return () => window.clearTimeout(timer)
  }, [rewardUnlocked, onClearAnimations])

  useEffect(() => {
    if (!streakIncreased) return
    const timer = window.setTimeout(() => onClearAnimations?.(), 2000)
    return () => window.clearTimeout(timer)
  }, [streakIncreased, onClearAnimations])

  const handleNavigate = (screen: number) => {
    void unlockSupertonicOnGesture()
    onNavigate?.(screen)
  }

  if (loading && !data) {
    return <StreakSkeleton />
  }

  if (error && !data) {
    return (
      <div className="mb-3 rounded-2xl border-2 border-red-200 bg-red-50 p-2.5 text-center text-xs font-bold text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  const { streak, dailyActivity, rewards, milestones } = data
  const mascotMessage = getMascotStreakMessage(streak, rewards, dailyActivity)
  const showWelcome =
    streak.currentStreak === 0 && dailyActivity.completedCount === 0

  return (
    <section className="mb-3 overflow-hidden rounded-3xl border-2 border-white/70 bg-white/85 shadow-[0_4px_20px_rgba(45,106,79,0.1)] backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-[#d8f3dc] px-4 py-3">
        <motion.img
          src={mascotPng}
          alt="Mascot"
          className="h-[72px] w-auto shrink-0 object-contain"
          draggable={false}
          animate={streakIncreased ? { y: [0, -6, 0] } : { y: 0 }}
          transition={{ duration: 0.45 }}
        />
        <CharacterSpeechBubble>
          {showWelcome ? (
            <span className="text-[15px] leading-snug">
              Bắt đầu hành trình xanh hôm nay, {displayName}! 🌱
            </span>
          ) : (
            <span className="text-[15px] leading-snug">{mascotMessage}</span>
          )}
        </CharacterSpeechBubble>
      </div>

      <div className="space-y-3.5 p-4">
        <StreakCard streak={streak} rewards={rewards} pulse={streakIncreased} compact />

        <WeeklyCalendar
          weeklyProgress={streak.weeklyProgress}
          currentStreak={streak.currentStreak}
          todayHasActivity={dailyActivity.completedCount > 0}
          compact
        />

        <div className="rounded-2xl bg-[#f0fdf4]/80 p-3.5">
          <DailyGoalProgress daily={dailyActivity} onNavigate={handleNavigate} compact />
        </div>

        <RewardMilestones
          milestones={milestones}
          currentStreak={streak.currentStreak}
          compact
        />

        {rewardUnlocked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border-2 border-[#7ED957] bg-[#d8f3dc] px-3 py-2 text-center text-xs font-black text-[#1b4332]"
          >
            🏅 {rewards.nextRewardName} Unlocked!
          </motion.div>
        ) : null}
      </div>
    </section>
  )
}

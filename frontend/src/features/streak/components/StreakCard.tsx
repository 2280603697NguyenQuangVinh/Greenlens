import { motion } from "motion/react"
import { STREAK_ICON } from "@/assets"
import { FF_QUIZ } from "@/utils/constants"
import type { StreakInfo, StreakRewardInfo } from "@/services/streak/types"
import { formatNextRewardDayLabel } from "@/features/streak/utils/streakUi"

export function StreakCard({
  streak,
  rewards,
  pulse,
  compact = false,
  statusBanner = null,
}: {
  streak: StreakInfo
  rewards: StreakRewardInfo
  pulse?: boolean
  compact?: boolean
  statusBanner?: string | null
}) {
  const isEmpty = streak.currentStreak === 0
  const nextRewardText = formatNextRewardDayLabel(rewards.nextRewardDay)

  const statsBlock = (
    <div className={`space-y-1 ${compact ? "text-[12px] leading-relaxed sm:text-[13px]" : "text-sm leading-relaxed"}`}>
      <p>
        Chuỗi hiện tại: {streak.currentStreak} ngày
      </p>
      <p>
        Kỷ lục: {streak.bestStreak} ngày
      </p>
      {!isEmpty ? (
        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 opacity-95">
          <span>Phần thưởng tiếp theo:</span>
          <span>{nextRewardText}</span>
        </p>
      ) : (
        <p className="opacity-90">Hoàn thành 1 nhiệm vụ để bắt đầu</p>
      )}
    </div>
  )

  const dropSize = compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10"

  const headline = (
    <div className="flex min-w-0 flex-1 items-start gap-2">
      <img
        src={STREAK_ICON}
        alt=""
        className={`${dropSize} shrink-0 object-contain drop-shadow-md ${isEmpty ? "opacity-70" : ""}`}
        draggable={false}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs opacity-90">Chuỗi ngày học tập</p>
        <motion.p
          key={streak.currentStreak}
          className={compact ? "mt-0.5 text-lg leading-snug sm:text-xl" : "text-xl"}
          style={FF_QUIZ}
          initial={!compact && pulse ? { scale: 1.4, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
        >
          {isEmpty ? "Chưa bắt đầu" : `${streak.currentStreak} ngày liên tiếp`}
        </motion.p>
      </div>
    </div>
  )

  if (compact) {
    return (
      <div
        className={`rounded-[1.35rem] px-5 py-4 text-white shadow-[0_4px_16px_rgba(232,93,76,0.35)] ${
          isEmpty
            ? "bg-gradient-to-r from-[#52b788] to-[#2d6a4f] shadow-[0_4px_16px_rgba(45,106,79,0.3)]"
            : "bg-gradient-to-b from-[#ff8c42] to-[#e85d4c]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          {headline}
          {pulse ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="shrink-0 rounded-full bg-white/25 px-2.5 py-1 text-xs"
            >
              +1
            </motion.span>
          ) : null}
        </div>
        <div className="mt-2.5 border-t border-white/20 pt-2">{statsBlock}</div>
        {statusBanner ? (
          <p className="mt-2 rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] leading-snug sm:text-xs">
            {statusBanner}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rounded-[1.75rem] bg-gradient-to-br from-orange-400 to-red-500 p-5 text-white shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        {headline}
        {pulse ? (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: -4 }}
            className="rounded-full bg-white/25 px-3 py-1 text-sm"
          >
            +1 ngày
          </motion.span>
        ) : null}
      </div>
      {statsBlock}
    </div>
  )
}

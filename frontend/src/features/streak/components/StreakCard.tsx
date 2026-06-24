import { motion } from "motion/react"
import { Flame } from "lucide-react"
import { FF_FREDOKA } from "@/utils/constants"
import type { StreakInfo, StreakRewardInfo } from "@/services/streak/types"
import { formatNextRewardLabel } from "@/features/streak/utils/streakUi"

export function StreakCard({
  streak,
  rewards,
  pulse,
  compact = false,
}: {
  streak: StreakInfo
  rewards: StreakRewardInfo
  pulse?: boolean
  compact?: boolean
}) {
  const isEmpty = streak.currentStreak === 0

  if (compact) {
    return (
      <div
        className={`rounded-2xl px-4 py-3.5 text-white shadow-sm ${
          isEmpty
            ? "bg-gradient-to-r from-[#52b788] to-[#2d6a4f]"
            : "bg-gradient-to-r from-[#ff8c42] to-[#e85d4c]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <motion.div
              animate={pulse ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.6 }}
              className="shrink-0"
            >
              <Flame className="text-yellow-200" size={28} />
            </motion.div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide opacity-90">
                Chuỗi ngày học tập
              </p>
              <motion.p
                key={streak.currentStreak}
                className="truncate text-xl font-black leading-tight"
                style={FF_FREDOKA}
              >
                {isEmpty ? "Chưa bắt đầu" : `${streak.currentStreak} ngày liên tiếp`}
              </motion.p>
            </div>
          </div>
          <div className="shrink-0 text-right text-[13px] font-bold leading-tight">
            <p>Kỷ lục: {streak.bestStreak} ngày</p>
            {!isEmpty ? (
              <p className="opacity-90">{formatNextRewardLabel(rewards.nextRewardDay, rewards.nextRewardName)}</p>
            ) : (
              <p className="max-w-[120px] opacity-90">Hoàn thành 1 nhiệm vụ để bắt đầu</p>
            )}
          </div>
          {pulse ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="shrink-0 rounded-full bg-white/25 px-2.5 py-1 text-xs font-black"
            >
              +1
            </motion.span>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 p-4 text-white shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <motion.div
            animate={pulse ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Flame className="text-yellow-200" size={28} />
          </motion.div>
          <div>
            <p className="text-sm font-bold opacity-90">🔥 Chuỗi ngày học tập</p>
            <motion.p
              key={streak.currentStreak}
              initial={pulse ? { scale: 1.4, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xl font-black"
              style={FF_FREDOKA}
            >
              {isEmpty ? "Chưa bắt đầu" : `🔥 ${streak.currentStreak} ngày liên tiếp`}
            </motion.p>
          </div>
        </div>
        {pulse ? (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: -4 }}
            className="rounded-full bg-white/25 px-3 py-1 text-sm font-black"
          >
            +1 ngày
          </motion.span>
        ) : null}
      </div>

      <div className="space-y-1 text-sm font-semibold">
        <p>Chuỗi hiện tại: <span className="font-black">{streak.currentStreak} ngày</span></p>
        <p>Kỷ lục: <span className="font-black">{streak.bestStreak} ngày</span></p>
        {!isEmpty ? (
          <p className="opacity-95">
            Phần thưởng tiếp theo:{" "}
            <span className="font-black">
              {formatNextRewardLabel(rewards.nextRewardDay, rewards.nextRewardName)}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

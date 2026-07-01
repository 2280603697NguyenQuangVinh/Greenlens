import { motion } from "motion/react"
import {
  getDayLabels,
  getTodayWeekIndex,
  getWeekDayState,
  getRecoverFreezeStaggerDelay,
  isRecoveredFreezeWeekDay,
  shouldPlayFreezeRecoverAnimation,
  type WeekDayState,
} from "@/features/streak/utils/streakUi"
import { CHECK_ICON, FREEZING_ICON, STREAK_ICON } from "@/assets"
import { FreezeToFireIcon } from "./FreezeToFireIcon"
import type { StreakStatusInfo } from "@/services/streak/types"

const STATE_STYLES: Record<WeekDayState, string> = {
  today: "bg-[#ecfdf3] border-[#52b788] ring-2 ring-[#7ED957]/40",
  current: "bg-[#FFD166] border-[#f4a261] ring-1 ring-[#f4a261]",
  "today-done": "bg-[#ecfdf3] border-[#7ED957] ring-2 ring-[#7ED957]/50",
  streak: "bg-[#fff3e8] border-[#f4a261]",
  frozen: "bg-[#e8f4fc] border-[#7ec8e3]",
  upcoming: "bg-white border-slate-200",
  empty: "bg-white border-slate-200",
}

const STATE_LABELS: Record<WeekDayState, string> = {
  "today-done": "Đã giữ chuỗi",
  streak: "Chuỗi ngày",
  frozen: "Đóng băng",
  current: "Hôm nay — chưa xong",
  today: "Hôm nay",
  upcoming: "Sắp tới",
  empty: "Chưa học",
}

function DayIcon({
  state,
  compact,
}: {
  state: WeekDayState
  compact: boolean
}) {
  const iconSize = compact ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6"

  if (state === "today-done") {
    return (
      <img
        src={CHECK_ICON}
        alt=""
        className={`object-contain ${iconSize}`}
        draggable={false}
        aria-hidden
      />
    )
  }
  if (state === "streak") {
    return (
      <img
        src={STREAK_ICON}
        alt=""
        className={`object-contain ${iconSize}`}
        draggable={false}
        aria-hidden
      />
    )
  }
  if (state === "frozen") {
    return (
      <img
        src={FREEZING_ICON}
        alt=""
        className="h-full w-full object-contain p-0"
        draggable={false}
        aria-hidden
      />
    )
  }
  return null
}

export function WeeklyCalendar({
  currentStreak = 0,
  lastActiveDate = null,
  todayCompletedCount = 0,
  streakStatus,
  gapAnchorDate = null,
  freezeGapDayKeys = [],
  animateToday = false,
  compact = false,
}: {
  currentStreak?: number
  lastActiveDate?: string | null
  todayCompletedCount?: number
  streakStatus?: StreakStatusInfo
  gapAnchorDate?: string | null
  freezeGapDayKeys?: string[]
  animateToday?: boolean
  compact?: boolean
}) {
  const labels = getDayLabels()
  const todayIndex = getTodayWeekIndex()
  const dotSize = compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-11 w-11"
  const playFreezeRecover =
    animateToday &&
    shouldPlayFreezeRecoverAnimation(streakStatus, todayCompletedCount, freezeGapDayKeys)

  return (
    <div
      className={
        compact
          ? ""
          : "rounded-2xl border-2 border-[#a8e6b8] bg-white p-3 shadow-sm"
      }
    >
      <h3 className="mb-2.5 text-sm text-[#1b4332] sm:text-base">
        Theo dõi 7 ngày
      </h3>
      <div className="flex justify-between gap-0.5 sm:gap-1">
        {labels.map((label, index) => {
          const state = getWeekDayState({
            index,
            todayIndex,
            currentStreak,
            lastActiveDate,
            todayCompletedCount,
            streakStatus,
            gapAnchorDate,
            freezeGapDayKeys,
          })
          const style = STATE_STYLES[state]
          const isToday = index === todayIndex
          const isRecoverDay =
            playFreezeRecover &&
            isRecoveredFreezeWeekDay({
              index,
              todayIndex,
              todayCompletedCount,
              currentStreak,
              streakStatus,
              lastActiveDate,
              gapAnchorDate,
              freezeGapDayKeys,
            })
          const recoverDelay = getRecoverFreezeStaggerDelay(index, streakStatus, freezeGapDayKeys)

          const shouldBounce =
            animateToday &&
            !isRecoverDay &&
            (state === "today-done" || state === "streak")

          const dot = (
            <motion.div
              className={`flex items-center justify-center rounded-full border-2 ${dotSize} ${style}`}
              title={STATE_LABELS[state]}
              aria-label={`${label}: ${STATE_LABELS[state]}`}
              animate={
                isRecoverDay && playFreezeRecover
                  ? {
                      backgroundColor: ["#e8f4fc", "#fff3e8"],
                      borderColor: ["#7ec8e3", "#f4a261"],
                    }
                  : undefined
              }
              transition={
                isRecoverDay
                  ? { duration: 0.45, delay: recoverDelay + 0.2, ease: "easeOut" }
                  : undefined
              }
            >
              {isRecoverDay ? (
                <FreezeToFireIcon
                  play={playFreezeRecover}
                  delay={recoverDelay}
                  compact={compact}
                />
              ) : (
                <DayIcon state={state} compact={compact} />
              )}
            </motion.div>
          )

          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={`${compact ? "text-[10px] sm:text-[11px]" : "text-xs"} ${
                  isToday ? "text-[#2d6a4f]" : "text-slate-500"
                }`}
              >
                {label}
              </span>
              {shouldBounce ? (
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: [0.4, 1.2, 1], opacity: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 16 }}
                >
                  {dot}
                </motion.div>
              ) : (
                dot
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

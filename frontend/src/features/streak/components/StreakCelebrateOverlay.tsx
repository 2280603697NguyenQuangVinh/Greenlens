import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { CHECK_ICON, FREEZING_ICON, STREAK_ICON } from "@/assets"
import { FF_FREDOKA } from "@/utils/constants"
import {
  getDayLabels,
  getTodayWeekIndex,
  getWeekDayState,
  getRecoverFreezeStaggerDelay,
  isRecoveredFreezeWeekDay,
  shouldPlayFreezeRecoverAnimation,
  type WeekDayState,
} from "@/features/streak/utils/streakUi"
import { playRewardChime } from "@/features/streak/utils/streakSounds"
import { FreezeToFireIcon } from "./FreezeToFireIcon"
import type { StreakStatusInfo } from "@/services/streak/types"

type TodayPhase = "idle" | "ticked" | "settled"

const TICK_DRAW_MS = 400
const TICK_HOLD_MS = 100
const OVERLAY_FADE_MS = 320

const DOT_STYLES: Record<WeekDayState, string> = {
  today: "bg-[#ecfdf3] border-[#52b788] ring-2 ring-[#7ED957]/40",
  current: "bg-[#FFD166] border-[#f4a261] ring-1 ring-[#f4a261]",
  "today-done": "bg-[#ecfdf3] border-[#7ED957] ring-2 ring-[#7ED957]/50",
  streak: "bg-[#fff3e8] border-[#f4a261]",
  frozen: "bg-[#e8f4fc] border-[#7ec8e3]",
  upcoming: "bg-white border-slate-200",
  empty: "bg-white border-slate-200",
}

function AnimatedCheck({ play }: { play: boolean }) {
  return (
    <motion.svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <motion.path
        d="M5 13l4 4L19 7"
        fill="none"
        stroke="#2d6a4f"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={play ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: TICK_DRAW_MS / 1000, ease: "easeOut" }}
      />
    </motion.svg>
  )
}

function OverlayDayIcon({ state }: { state: WeekDayState }) {
  if (state === "today-done") {
    return (
      <img src={CHECK_ICON} alt="" className="h-6 w-6 object-contain" draggable={false} aria-hidden />
    )
  }
  if (state === "streak") {
    return (
      <img src={STREAK_ICON} alt="" className="h-5 w-5 object-contain" draggable={false} aria-hidden />
    )
  }
  if (state === "frozen") {
    return (
      <img src={FREEZING_ICON} alt="" className="h-6 w-6 object-contain p-0.5" draggable={false} aria-hidden />
    )
  }
  return null
}

export function StreakCelebrateOverlay({
  open,
  currentStreak,
  lastActiveDate,
  todayCompletedCount,
  streakStatus,
  gapAnchorDate,
  freezeGapDayKeys,
  recoveredGapDayKeys,
  onComplete,
}: {
  open: boolean
  currentStreak: number
  lastActiveDate: string | null
  todayCompletedCount: number
  streakStatus?: StreakStatusInfo
  gapAnchorDate?: string | null
  freezeGapDayKeys?: string[]
  recoveredGapDayKeys?: string[]
  onComplete: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [todayPhase, setTodayPhase] = useState<TodayPhase>("idle")
  const labels = getDayLabels()
  const todayIndex = getTodayWeekIndex()

  useEffect(() => {
    if (!open) {
      setVisible(false)
      setTodayPhase("idle")
      return
    }

    setVisible(true)
    setTodayPhase("idle")
    playRewardChime()

    const hasRecoverDay = getDayLabels().some((_, index) =>
      index !== todayIndex &&
      isRecoveredFreezeWeekDay({
        index,
        todayIndex,
        todayCompletedCount,
        currentStreak,
        streakStatus,
        lastActiveDate,
        gapAnchorDate,
        freezeGapDayKeys,
        recoveredGapDayKeys,
      }),
    )

    const tickStart = hasRecoverDay ? 600 : 480
    const overlayHide = tickStart + TICK_DRAW_MS + TICK_HOLD_MS + 520
    const completeAt = overlayHide + OVERLAY_FADE_MS

    const tickTimer = window.setTimeout(() => setTodayPhase("ticked"), tickStart)
    const settleTimer = window.setTimeout(() => setTodayPhase("settled"), tickStart + TICK_DRAW_MS + TICK_HOLD_MS)
    const hideTimer = window.setTimeout(() => setVisible(false), overlayHide)
    const doneTimer = window.setTimeout(() => onComplete(), completeAt)

    return () => {
      window.clearTimeout(tickTimer)
      window.clearTimeout(settleTimer)
      window.clearTimeout(hideTimer)
      window.clearTimeout(doneTimer)
    }
  }, [
    open,
    onComplete,
    todayIndex,
    todayCompletedCount,
    currentStreak,
    streakStatus,
    lastActiveDate,
    gapAnchorDate,
    freezeGapDayKeys,
    recoveredGapDayKeys,
  ])

  const displayStreak = Math.max(currentStreak, 1)
  const playFreezeRecover =
    visible &&
    shouldPlayFreezeRecoverAnimation(streakStatus, todayCompletedCount, freezeGapDayKeys)

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: OVERLAY_FADE_MS / 1000 }}
          role="dialog"
          aria-live="polite"
          aria-label="Đã giữ chuỗi hôm nay"
        >
          <motion.div
            className="absolute inset-0 bg-white/90 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-sm rounded-3xl border-2 border-[#a8e6b8] bg-white px-5 py-8 text-center shadow-[0_8px_32px_rgba(45,106,79,0.12)]"
            initial={{ scale: 0.82, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            <motion.img
              src={STREAK_ICON}
              alt=""
              className="mx-auto h-16 w-16 object-contain"
              draggable={false}
              aria-hidden
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.15, 1], opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />

            <motion.p
              className="mt-2 text-6xl font-bold leading-none text-[#1b4332]"
              style={FF_FREDOKA}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.15 }}
            >
              {displayStreak}
            </motion.p>
            <p className="mt-1 text-lg text-[#f4a261]" style={FF_FREDOKA}>
              ngày streak!
            </p>

            <div className="mt-6 rounded-2xl border border-[#d8f3dc] bg-[#f8fdf9] px-2 py-3">
            <div className="flex justify-between gap-1">
              {labels.map((label, index) => {
                const isToday = index === todayIndex
                const state = getWeekDayState({
                  index,
                  todayIndex,
                  currentStreak,
                  lastActiveDate,
                  todayCompletedCount:
                    isToday && todayPhase === "idle" ? 0 : todayCompletedCount,
                  streakStatus,
                  gapAnchorDate,
                  freezeGapDayKeys,
                  recoveredGapDayKeys,
                })
                const style = DOT_STYLES[isToday && todayPhase !== "idle" ? "today-done" : state]
                const isRecoverDay =
                  !isToday &&
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
                    recoveredGapDayKeys,
                  })
                const recoverDelay = getRecoverFreezeStaggerDelay(
                  index,
                  streakStatus,
                  freezeGapDayKeys,
                )

                return (
                  <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <span
                      className={`text-[10px] sm:text-xs ${
                        isToday ? "font-medium text-[#2d6a4f]" : "text-slate-500"
                      }`}
                    >
                      {label}
                    </span>

                    {isToday ? (
                      <motion.div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 sm:h-11 sm:w-11 ${style}`}
                        animate={{ scale: todayPhase === "ticked" ? [1, 1.1, 1] : 1 }}
                        transition={{ duration: 0.35 }}
                      >
                        {todayPhase === "ticked" ? (
                          <AnimatedCheck play />
                        ) : todayPhase === "settled" ? (
                          <img
                            src={CHECK_ICON}
                            alt=""
                            className="h-6 w-6 object-contain"
                            draggable={false}
                            aria-hidden
                          />
                        ) : null}
                      </motion.div>
                    ) : isRecoverDay ? (
                      <motion.div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 sm:h-11 sm:w-11 ${DOT_STYLES.frozen}`}
                        animate={{
                          backgroundColor: ["#e8f4fc", "#fff3e8"],
                          borderColor: ["#7ec8e3", "#f4a261"],
                        }}
                        transition={{
                          duration: 0.45,
                          delay: recoverDelay + 0.2,
                          ease: "easeOut",
                        }}
                      >
                        <FreezeToFireIcon
                          play={playFreezeRecover}
                          delay={recoverDelay}
                          compact
                        />
                      </motion.div>
                    ) : (
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 sm:h-11 sm:w-11 ${DOT_STYLES[state]}`}
                      >
                        <OverlayDayIcon state={state} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            </div>

            <motion.p
              className="mt-5 text-sm text-[#2d6a4f]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              Giỏi lắm! Đã giữ chuỗi hôm nay
            </motion.p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

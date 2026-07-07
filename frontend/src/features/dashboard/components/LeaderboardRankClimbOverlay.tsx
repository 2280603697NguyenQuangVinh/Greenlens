import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { FF_FREDOKA, FF_NUNITO } from "@/utils/constants"
import { playRewardChime } from "@/features/streak/utils/streakSounds"
import type { LeaderboardEntry } from "@/services/childProfile"

const ROW_HEIGHT = 40

export type RankClimbEvent = {
  fromRank: number
  toRank: number
  entries: LeaderboardEntry[]
  roundScore: number
  totalScore: number
}

export function LeaderboardRankClimbOverlay({
  event,
  onComplete,
}: {
  event: RankClimbEvent | null
  onComplete: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [displayRank, setDisplayRank] = useState(0)

  const handleDismiss = useCallback(() => {
    setVisible(false)
    window.setTimeout(() => onComplete(), 280)
  }, [onComplete])

  useEffect(() => {
    if (!event) {
      setVisible(false)
      setDisplayRank(0)
      return
    }

    setVisible(true)
    setDisplayRank(event.fromRank)
    playRewardChime()

    const countTimer = window.setTimeout(() => {
      setDisplayRank(event.toRank)
    }, 450)

    return () => window.clearTimeout(countTimer)
  }, [event])

  if (!event) return null

  const slideOffset = (event.fromRank - event.toRank) * ROW_HEIGHT

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[210] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          role="dialog"
          aria-modal="true"
          aria-label="Leo hạng xếp hạng"
        >
          <motion.div
            className="absolute inset-0 bg-white/90 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          <motion.div
            className="relative w-full max-w-sm rounded-3xl border-2 border-[#a8e6b8] bg-white px-5 py-7 text-center shadow-[0_8px_32px_rgba(45,106,79,0.14)]"
            style={FF_NUNITO}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            <p className="text-xl font-bold text-[#1b4332]">Leo hạng!</p>
            <p className="mt-2 text-sm font-normal text-slate-600">
              +{event.roundScore} điểm ·{" "}
              <span className="font-semibold text-[#f4a261]">{event.totalScore} điểm</span>
            </p>

            <motion.p
              className="mt-3 text-4xl font-extrabold leading-none text-[#1b4332] tabular-nums"
              style={FF_FREDOKA}
              key={displayRank}
              initial={{ scale: 1.15, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
            >
              #{displayRank}
            </motion.p>
            <p className="mt-1 text-sm font-normal text-[#2d6a4f]">
              Bạn đã leo từ hạng {event.fromRank} lên hạng {event.toRank}!
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[#d8f3dc] bg-[#f8fdf9] px-2 py-2">
              <div className="relative">
                {event.entries.map((row) => (
                  <motion.div
                    key={row.childId}
                    className={`flex h-10 items-center justify-between rounded-lg px-2.5 text-[13px] font-normal ${
                      row.isCurrentUser ? "bg-[#b9f0af]" : ""
                    }`}
                    initial={
                      row.isCurrentUser
                        ? { y: slideOffset, scale: 1.02 }
                        : false
                    }
                    animate={{ y: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 340,
                      damping: 26,
                      delay: row.isCurrentUser ? 0.15 : 0,
                    }}
                  >
                    <span className="min-w-0 truncate text-left">
                      {row.rank}. {row.name}
                      {row.isCurrentUser ? " (bạn)" : ""}
                    </span>
                    <span className="ml-2 shrink-0 text-[12px] font-normal tabular-nums text-slate-600">
                      {row.miniGameHighScore} điểm
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="mt-5 w-full rounded-2xl bg-[#2dd62d] py-3.5 text-base font-bold text-white shadow-md transition active:scale-[0.99]"
            >
              TIẾP TỤC
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

import { motion, AnimatePresence } from "motion/react"
import { STREAK_ICON } from "@/assets"
import { FF_FREDOKA } from "@/utils/constants"

export function StreakDayUpToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="pointer-events-none absolute left-1/2 top-2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-[#f4a261] bg-white px-4 py-2 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <img src={STREAK_ICON} alt="" className="h-7 w-7 object-contain" draggable={false} />
          <span className="text-base text-[#e85d4c]" style={FF_FREDOKA}>
            +1 ngày!
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

import { motion, AnimatePresence } from "motion/react"
import { XP_REWARD_ICON } from "@/assets"
import { FF_FREDOKA } from "@/utils/constants"

export function XpFloatToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: [0, -28, -48, -64] }}
          transition={{ duration: 1.8, times: [0, 0.15, 0.7, 1] }}
          className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 shadow-md"
          aria-hidden
        >
          <img src={XP_REWARD_ICON} alt="" className="h-5 w-5 object-contain" draggable={false} />
          <span className="text-sm font-medium text-[#e85d4c]" style={FF_FREDOKA}>
            +20 XP
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

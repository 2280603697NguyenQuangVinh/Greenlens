import { motion } from "motion/react"

const SCAN_POINTS = 10

export function ScanRewardBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, type: "spring", stiffness: 260, damping: 22 }}
      className="mb-3 rounded-[20px] border-2 border-[#F4A261]/60 bg-gradient-to-r from-[#FFF3B0] to-[#FFE066] px-3.5 py-2.5 text-center shadow-[0_4px_14px_rgba(244,162,97,0.18)]"
    >
      <p className="text-[16px] font-black text-[#1B4332]">
        🎉 Tuyệt vời!{" "}
        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-[13px] text-[#E76F51]">
          ⭐ +{SCAN_POINTS} Green Points
        </span>
      </p>
      <p className="mt-0.5 text-[12px] font-bold text-[#52796F]">
      </p>
    </motion.section>
  )
}

export { SCAN_POINTS }

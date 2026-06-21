import { motion } from "motion/react"
import type { AiCameraResult } from "@/services/aiCamera"
import {
  WASTE_BINS,
  resolveActiveBinId,
} from "@/features/camera/utils/wasteBins"
import { BinCharacter } from "@/features/camera/components/result/BinCharacter"

type Props = {
  result: AiCameraResult
}

export function BinCharacterPicker({ result }: Props) {
  const activeId = resolveActiveBinId(result.binColor, result.wasteCategory)
  const activeBin = WASTE_BINS.find((b) => b.id === activeId)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 22 }}
      className="mb-3 rounded-[20px] border-2 border-[#95D5B2]/50 bg-white px-3.5 py-3 shadow-[0_4px_16px_rgba(45,106,79,0.08)]"
    >
      <h3 className="text-center text-[15px] font-black text-[#1B4332]">
        Giúp Robo chọn đúng thùng rác nhé!
      </h3>
      <p className="mt-0.5 text-center text-[12px] font-semibold text-[#52796F]">
        Thùng đúng đang sáng lên nè ✨
      </p>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {WASTE_BINS.map((bin) => (
          <BinCharacter key={bin.id} bin={bin} active={bin.id === activeId} />
        ))}
      </div>

      {activeBin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className={`mt-3 flex h-[36px] w-full items-center justify-center rounded-full ${activeBin.chipClass}`}
        >
          <span className="text-[13px] font-black text-white">
            👉 {activeBin.label} {activeBin.emoji}
          </span>
        </motion.div>
      )}
    </motion.section>
  )
}

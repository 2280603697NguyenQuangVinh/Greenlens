import { motion } from "motion/react"
import type { AiCameraResult } from "@/services/aiCamera"
import { translateCategory, translateWasteLabel } from "@/services/aiCamera"
import {
  getCategoryBadgeStyle,
  getCategoryEmoji,
  resolveActiveBinId,
} from "@/features/camera/utils/wasteBins"

type Props = {
  result: AiCameraResult
  capturedImage: string
}

export function ResultHeroCard({ result, capturedImage }: Props) {
  const name = translateWasteLabel(result.wasteName)
  const categoryLabel = translateCategory(result.wasteCategory)
  const activeBinId = resolveActiveBinId(result.binColor, result.wasteCategory)
  const categoryEmoji = getCategoryEmoji(categoryLabel)

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="mb-3 overflow-hidden rounded-[20px] border-2 border-[#95D5B2]/50 bg-gradient-to-br from-[#E8F8EF] to-[#D4F1E4] px-3.5 py-3 shadow-[0_4px_16px_rgba(45,106,79,0.08)]"
    >
      <p className="text-center text-[13px] font-bold text-[#40916C]">
        AI nhận diện thành công!
      </p>

      <div className="mt-2.5 flex min-h-[52px] items-center gap-3">
        <img
          src={capturedImage}
          alt=""
          className="h-12 w-12 shrink-0 rounded-2xl border-2 border-white object-cover shadow-sm"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <h3 className="truncate text-[20px] font-bold leading-tight text-[#1B4332]">{name}</h3>
          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold leading-none shadow-sm ${getCategoryBadgeStyle(activeBinId)}`}
          >
            {categoryEmoji} {categoryLabel}
          </span>
        </div>
      </div>
    </motion.section>
  )
}

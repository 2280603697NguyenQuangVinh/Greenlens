import { motion } from "motion/react"
import { LEVEL_ICON } from "@/assets"
import { getLevelProgress } from "@/utils/levelProgress"

export function XpLevelBar({
  xp,
  className = "",
  compact = false,
  profile = false,
  animate = true,
}: {
  xp: number
  className?: string
  compact?: boolean
  profile?: boolean
  animate?: boolean
}) {
  const levelProgress = getLevelProgress(xp)
  const xpPct = levelProgress.isMaxLevel ? 100 : Math.max(4, levelProgress.progressPercent)
  const xpLabel = levelProgress.isMaxLevel
    ? `${xp} XP · Tối đa`
    : `${levelProgress.xpIntoLevel} / ${levelProgress.xpForLevelUp} XP`

  const fillWidth = { width: `${xpPct}%` }

  if (compact) {
    return (
      <div className={className}>
        <div className="rounded-full border-2 border-red-500 bg-[#d3d3d3] p-0.5">
          <div className="relative flex h-6 items-center overflow-hidden rounded-full bg-[#d3d3d3] pl-2.5 pr-0.5">
            {animate ? (
              <motion.div
                initial={{ width: 0 }}
                animate={fillWidth}
                transition={{ duration: 0.7 }}
                className="absolute inset-y-0 left-0 rounded-full bg-[#7edd55]"
              />
            ) : (
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#7edd55]"
                style={fillWidth}
              />
            )}
            <span className="relative z-10 min-w-0 flex-1 truncate text-[11px] text-black">
              Cấp {levelProgress.level}
            </span>
            <img
              src={LEVEL_ICON}
              alt=""
              className="relative z-10 h-5 w-5 shrink-0 object-contain drop-shadow-sm"
              draggable={false}
              aria-hidden
            />
          </div>
        </div>
      </div>
    )
  }

  const barHeight = profile ? "h-8" : "h-7"
  const textSize = profile ? "text-[13px]" : "text-[12px]"
  const iconSize = profile ? "h-7 w-7" : "h-6 w-6"

  return (
    <div className={className}>
      <div className="rounded-full border-[3px] border-red-500 bg-[#d3d3d3] p-1">
        <div
          className={`relative flex ${barHeight} items-center gap-1 overflow-hidden rounded-full bg-[#d3d3d3] pl-3 pr-1.5`}
        >
          {animate ? (
            <motion.div
              initial={{ width: 0 }}
              animate={fillWidth}
              transition={{ duration: 0.7 }}
              className="absolute inset-y-0 left-0 rounded-full bg-[#7edd55]"
            />
          ) : (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#7edd55]"
              style={fillWidth}
            />
          )}
          <span className={`relative z-10 shrink-0 ${textSize} text-black`}>
            Cấp {levelProgress.level}
          </span>
          <span className={`relative z-10 min-w-0 flex-1 truncate text-right ${textSize} text-black`}>
            {xpLabel}
          </span>
          <img
            src={LEVEL_ICON}
            alt=""
            className={`relative z-10 shrink-0 object-contain drop-shadow-sm ${iconSize}`}
            draggable={false}
            aria-hidden
          />
        </div>
      </div>
    </div>
  )
}

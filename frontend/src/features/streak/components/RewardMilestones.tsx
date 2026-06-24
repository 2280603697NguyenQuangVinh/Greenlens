import { PADLOCK_ICON } from "@/assets"
import type { RewardMilestone } from "@/services/streak/types"
import { getMilestoneStatus } from "@/features/streak/utils/streakUi"

function MilestoneBadge({
  milestone,
  unlocked,
  current,
  compact,
}: {
  milestone: RewardMilestone
  unlocked: boolean
  current: boolean
  compact: boolean
}) {
  const imgSize = compact ? "h-12" : "h-14"

  if (milestone.imageUrl) {
    return (
      <div className={`relative flex items-center justify-center ${imgSize} w-full`}>
        <img
          src={milestone.imageUrl}
          alt={milestone.label}
          className={`${imgSize} w-auto max-w-full object-contain ${
            unlocked ? "" : "opacity-45 grayscale"
          }`}
          draggable={false}
        />
        {!unlocked && (
          <>
            <div className="absolute inset-0 rounded-full bg-white/25" aria-hidden />
            <img
              src={PADLOCK_ICON}
              alt=""
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-sm ${
                compact ? "h-5 w-5" : "h-6 w-6"
              }`}
              draggable={false}
              aria-hidden
            />
          </>
        )}
        {current && !unlocked ? (
          <span
            className="absolute -bottom-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#f4a261] ring-2 ring-white"
            aria-hidden
          />
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 ${
        compact ? "h-11 w-11 text-base" : "h-12 w-12 text-xl"
      } ${
        unlocked
          ? "border-[#7ED957] bg-[#7ED957] text-white shadow-sm"
          : current
            ? "border-[#f4a261] bg-[#FFD166]"
            : "border-slate-200 bg-white"
      }`}
    >
      {milestone.icon ?? "+"}
    </div>
  )
}

export function RewardMilestones({
  milestones,
  currentStreak,
  compact = false,
}: {
  milestones: RewardMilestone[]
  currentStreak: number
  compact?: boolean
}) {
  const labelSize = compact ? "text-[9px] sm:text-[10px]" : "text-xs"
  const lineTop = compact ? "top-6" : "top-7"

  return (
    <div
      className={
        compact
          ? "rounded-2xl border-2 border-[#f2c94c] bg-[#fff9eb] p-3.5 shadow-[0_2px_12px_rgba(244,162,97,0.15)]"
          : "rounded-2xl border-2 border-[#f2c94c] bg-[#fff9eb] p-3 shadow-sm"
      }
    >
      {!compact ? (
        <h3 className="mb-3 text-base text-[#1b4332]">Mốc phần thưởng</h3>
      ) : (
        <p className="mb-2 text-sm text-[#1b4332]">Mốc thưởng</p>
      )}
      <div className="relative flex items-start justify-between gap-1 overflow-x-auto pb-1">
        <div
          className={`absolute left-4 right-4 rounded-full bg-[#d8f3dc] ${lineTop} h-1`}
          aria-hidden
        />
        {milestones.map((milestone) => {
          const status = getMilestoneStatus(milestone, currentStreak)
          const active = status === "unlocked"
          const current = status === "current"

          return (
            <div
              key={milestone.day}
              className={`relative z-10 flex flex-col items-center ${compact ? "min-w-[72px] max-w-[80px]" : "min-w-[84px]"}`}
            >
              <MilestoneBadge
                milestone={milestone}
                unlocked={active}
                current={current}
                compact={compact}
              />
              <p className={`mt-1 text-center text-slate-500 ${labelSize}`}>
                Ngày {milestone.day}
              </p>
              <p
                className={`mt-0.5 text-center leading-tight ${labelSize} ${
                  active ? "text-[#2d6a4f]" : "text-slate-500"
                }`}
              >
                {milestone.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

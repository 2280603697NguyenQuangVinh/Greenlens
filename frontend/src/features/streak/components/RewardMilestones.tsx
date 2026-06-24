import type { RewardMilestone } from "@/services/streak/types"
import { getMilestoneStatus } from "@/features/streak/utils/streakUi"

export function RewardMilestones({
  milestones,
  currentStreak,
  compact = false,
}: {
  milestones: RewardMilestone[]
  currentStreak: number
  compact?: boolean
}) {
  const size = compact ? "h-11 w-11 text-base" : "h-12 w-12 text-xl"
  const labelSize = compact ? "text-[11px]" : "text-xs"

  return (
    <div className={compact ? "" : "rounded-2xl bg-white/80 p-3 shadow-sm"}>
      {!compact ? (
        <h3 className="mb-3 text-base font-black text-[#1b4332]">🏅 Mốc phần thưởng</h3>
      ) : (
        <p className="mb-2 text-sm font-black text-[#1b4332]">🏅 Mốc thưởng</p>
      )}
      <div className="relative flex items-start justify-between gap-1 overflow-x-auto pb-1">
        <div
          className={`absolute left-4 right-4 rounded-full bg-[#d8f3dc] ${compact ? "top-5 h-1" : "top-6 h-1"}`}
          aria-hidden
        />
        {milestones.map((milestone) => {
          const status = getMilestoneStatus(milestone, currentStreak)
          const active = status === "unlocked"
          const current = status === "current"

          return (
            <div
              key={milestone.day}
              className={`relative z-10 flex flex-col items-center ${compact ? "min-w-[68px]" : "min-w-[76px]"}`}
            >
              <div
                className={`flex items-center justify-center rounded-full border-2 ${size} ${
                  active
                    ? "border-[#7ED957] bg-[#7ED957] shadow-sm"
                    : current
                      ? "border-[#f4a261] bg-[#FFD166]"
                      : "border-slate-200 bg-white"
                }`}
              >
                {milestone.icon}
              </div>
              <p className={`mt-0.5 text-center font-black text-slate-500 ${labelSize}`}>
                D{milestone.day}
              </p>
              {!compact ? (
                <p
                  className={`text-center font-bold leading-tight ${labelSize} ${
                    active ? "text-[#2d6a4f]" : "text-slate-500"
                  }`}
                >
                  {milestone.label}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

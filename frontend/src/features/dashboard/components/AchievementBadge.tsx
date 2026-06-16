import type { AchievementDef } from "@/assets/achievementAssets"

const BADGE_SIZES = {
  sm: "h-14",
  md: "h-[72px]",
  lg: "h-20",
} as const

export function AchievementBadgeCircle({
  achievement,
  unlocked,
  className = "",
  size = "md",
}: {
  achievement: AchievementDef
  unlocked: boolean
  className?: string
  size?: keyof typeof BADGE_SIZES
}) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <img
        src={achievement.image}
        alt={achievement.title}
        className={`${BADGE_SIZES[size]} w-auto object-contain ${unlocked ? "" : "opacity-50 grayscale"}`}
        draggable={false}
      />
      {!unlocked && (
        <span className="absolute inset-0 flex items-center justify-center text-2xl drop-shadow-sm">🔒</span>
      )}
    </div>
  )
}

export function AchievementBadgeCard({
  achievement,
  unlocked,
  date,
}: {
  achievement: AchievementDef
  unlocked: boolean
  date: string
}) {
  return (
    <div
      className={`relative rounded-3xl border border-slate-200 px-2 py-3 text-center ${
        unlocked ? "bg-[#d9eebf]" : "bg-[#aab8ac]/60 opacity-70"
      }`}
    >
      <div className="mx-auto flex h-20 items-center justify-center">
        <img
          src={achievement.image}
          alt={achievement.title}
          className={`h-20 w-auto object-contain ${unlocked ? "" : "opacity-50 grayscale"}`}
          draggable={false}
        />
      </div>
      <p className="mt-2 whitespace-pre-line text-[13px] font-bold leading-tight">{achievement.titleShort}</p>
      <p className="mt-1 text-[12px] font-semibold text-slate-700">{date}</p>
      {!unlocked && <div className="absolute right-2 top-2 text-2xl">🔒</div>}
    </div>
  )
}

import type { AchievementDef } from "@/assets/achievementAssets"
import { PADLOCK_ICON } from "@/assets/iconAssets"
import { FF_QUIZ } from "@/utils/constants"

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
        <img
          src={PADLOCK_ICON}
          alt=""
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.3] object-contain drop-shadow-sm ${
            size === "sm" ? "h-5 w-5" : size === "lg" ? "h-7 w-7" : "h-6 w-6"
          }`}
          draggable={false}
          aria-hidden
        />
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
  date?: string
}) {
  return (
    <div
      className={`relative rounded-3xl border border-slate-200 px-2 py-3 text-center ${
        unlocked ? "bg-[#d9eebf]" : "bg-[#aab8ac]/60 opacity-70"
      }`}
    >
      <div className="relative mx-auto flex h-20 w-full items-center justify-center">
        <img
          src={achievement.image}
          alt={achievement.title}
          className={`h-20 w-auto object-contain ${unlocked ? "" : "opacity-50 grayscale"}`}
          draggable={false}
        />
        {!unlocked && (
          <img
            src={PADLOCK_ICON}
            alt=""
            className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 scale-[1.3] object-contain drop-shadow-sm"
            draggable={false}
            aria-hidden
          />
        )}
      </div>
      <p className="mt-2 whitespace-pre-line text-[13px] font-bold leading-tight" style={FF_QUIZ}>
        {achievement.titleShort}
      </p>
      {unlocked && date ? (
        <p className="mt-1 text-[12px] font-semibold text-slate-700" style={FF_QUIZ}>{date}</p>
      ) : null}
    </div>
  )
}

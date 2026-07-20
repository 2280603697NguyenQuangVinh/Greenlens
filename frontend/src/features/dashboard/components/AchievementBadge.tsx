import type { AchievementDef } from "@/assets/achievementAssets"
import { PADLOCK_ICON } from "@/assets/iconAssets"
import { FF_QUIZ } from "@/utils/constants"
import { KIDS_SQUIRCLE } from "@/utils/kidsUiStyles"

const BADGE_SIZES = {
  sm: "h-14",
  md: "h-[72px]",
  lg: "h-20",
} as const

const LOCKED_IMAGE = "opacity-[0.58] saturate-[0.85]"
const UNLOCKED_IMAGE = ""

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
    <div
      className={`relative inline-flex items-center justify-center ${
        unlocked ? "" : "rounded-full border border-dashed border-emerald-200/60 bg-white/50 p-1"
      } ${className}`}
    >
      <img
        src={achievement.image}
        alt={achievement.title}
        className={`${BADGE_SIZES[size]} w-auto object-contain ${unlocked ? UNLOCKED_IMAGE : LOCKED_IMAGE}`}
        draggable={false}
      />
      {!unlocked && (
        <img
          src={PADLOCK_ICON}
          alt=""
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.2] object-contain drop-shadow-[0_2px_6px_rgba(45,106,79,0.15)] ${
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
      className={`relative ${KIDS_SQUIRCLE} px-3 py-4 text-center shadow-[0_6px_20px_rgba(45,106,79,0.06)] ${
        unlocked
          ? "border border-emerald-200/70 bg-emerald-50/85"
          : "border border-dashed border-emerald-200/55 bg-white/75"
      }`}
    >
      <div className="relative mx-auto flex h-20 w-full items-center justify-center">
        <img
          src={achievement.image}
          alt={achievement.title}
          className={`h-20 w-auto object-contain ${unlocked ? UNLOCKED_IMAGE : LOCKED_IMAGE}`}
          draggable={false}
        />
        {!unlocked && (
          <img
            src={PADLOCK_ICON}
            alt=""
            className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 scale-[1.2] object-contain drop-shadow-[0_2px_6px_rgba(45,106,79,0.15)]"
            draggable={false}
            aria-hidden
          />
        )}
      </div>
      <p className="mt-2.5 whitespace-pre-line text-[13px] font-bold leading-tight text-green-900" style={FF_QUIZ}>
        {achievement.titleShort}
      </p>
      {unlocked && date ? (
        <p className="mt-1.5 text-[12px] font-semibold text-slate-600" style={FF_QUIZ}>{date}</p>
      ) : null}
    </div>
  )
}

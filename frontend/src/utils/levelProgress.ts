export type LevelMilestone = {
  level: number
  requiredXp: number
}

/** Cấp 0 bắt đầu từ 0 XP; mỗi cấp cao hơn cần thêm nhiều XP hơn. */
export const LEVEL_MILESTONES: readonly LevelMilestone[] = [
  { level: 0, requiredXp: 0 },
  { level: 1, requiredXp: 30 },
  { level: 2, requiredXp: 80 },
  { level: 3, requiredXp: 150 },
  { level: 4, requiredXp: 250 },
  { level: 5, requiredXp: 380 },
  { level: 6, requiredXp: 550 },
  { level: 7, requiredXp: 780 },
  { level: 8, requiredXp: 1080 },
  { level: 9, requiredXp: 1480 },
  { level: 10, requiredXp: 2000 },
]

export type LevelProgress = {
  level: number
  xp: number
  currentLevelXp: number
  nextLevel: number | null
  nextLevelXp: number | null
  xpIntoLevel: number
  xpForLevelUp: number
  xpNeededForNext: number
  progressPercent: number
  isMaxLevel: boolean
}

export function getLevelFromXp(xp: number): number {
  const safeXp = Math.max(0, xp)
  let level = 0
  for (const milestone of LEVEL_MILESTONES) {
    if (safeXp >= milestone.requiredXp) level = milestone.level
  }
  return level
}

export function getLevelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, xp)
  let current = LEVEL_MILESTONES[0]
  for (const milestone of LEVEL_MILESTONES) {
    if (safeXp >= milestone.requiredXp) current = milestone
  }

  const currentIndex = LEVEL_MILESTONES.findIndex((m) => m.level === current.level)
  const next = LEVEL_MILESTONES[currentIndex + 1] ?? null

  if (!next) {
    const xpIntoLevel = safeXp - current.requiredXp
    return {
      level: current.level,
      xp: safeXp,
      currentLevelXp: current.requiredXp,
      nextLevel: null,
      nextLevelXp: null,
      xpIntoLevel,
      xpForLevelUp: 0,
      xpNeededForNext: 0,
      progressPercent: 100,
      isMaxLevel: true,
    }
  }

  const xpIntoLevel = safeXp - current.requiredXp
  const xpForLevelUp = next.requiredXp - current.requiredXp
  const xpNeededForNext = next.requiredXp - safeXp
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpIntoLevel / xpForLevelUp) * 100)),
  )

  return {
    level: current.level,
    xp: safeXp,
    currentLevelXp: current.requiredXp,
    nextLevel: next.level,
    nextLevelXp: next.requiredXp,
    xpIntoLevel,
    xpForLevelUp,
    xpNeededForNext,
    progressPercent,
    isMaxLevel: false,
  }
}

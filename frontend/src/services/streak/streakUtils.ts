import type { RewardMilestone, StreakInfo, StreakRewardInfo } from "./types"

const REWARD_MILESTONES: Array<{ day: number; label: string; icon: string }> = [
  { day: 3, label: "+20 XP", icon: "🪙" },
  { day: 7, label: "Eco Badge", icon: "🌿" },
  { day: 14, label: "Green Hero Badge", icon: "🦸" },
  { day: 30, label: "Special Reward", icon: "🏆" },
]

const BEST_STREAK_PREFIX = "gl_best_streak_"

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function buildWeeklyProgress(
  currentStreak: number,
  lastActiveDate: string | null,
): boolean[] {
  const result = Array<boolean>(7).fill(false)
  if (currentStreak <= 0 || !lastActiveDate) return result

  const activeEnd = new Date(`${lastActiveDate}T12:00:00`)
  if (Number.isNaN(activeEnd.getTime())) return result

  const monday = getMondayOfWeek(new Date())

  for (let i = 0; i < currentStreak; i++) {
    const d = new Date(activeEnd)
    d.setDate(d.getDate() - i)
    const weekIdx = Math.floor(
      (d.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000),
    )
    if (weekIdx >= 0 && weekIdx < 7) result[weekIdx] = true
  }

  return result
}

export function getNextRewardDay(currentStreak: number): number {
  for (const milestone of REWARD_MILESTONES) {
    if (currentStreak < milestone.day) return milestone.day
  }
  return REWARD_MILESTONES[REWARD_MILESTONES.length - 1].day
}

export function getNextRewardName(nextRewardDay: number): string {
  const milestone = REWARD_MILESTONES.find((m) => m.day === nextRewardDay)
  return milestone?.label ?? "Special Reward"
}

export function buildRewardMilestones(currentStreak: number): RewardMilestone[] {
  return REWARD_MILESTONES.map((m) => ({
    ...m,
    unlocked: currentStreak >= m.day,
  }))
}

export function buildStreakRewardInfo(currentStreak: number): StreakRewardInfo {
  const nextRewardDay = getNextRewardDay(currentStreak)
  return {
    currentRewardProgress: currentStreak,
    nextRewardDay,
    nextRewardName: getNextRewardName(nextRewardDay),
  }
}

export function readBestStreak(childId: string, currentStreak: number): number {
  const key = `${BEST_STREAK_PREFIX}${childId}`
  const stored = Number(localStorage.getItem(key) ?? 0)
  const best = Math.max(stored, currentStreak)
  if (best > stored) localStorage.setItem(key, String(best))
  return best
}

export function toStreakInfo(
  childId: string,
  currentStreak: number,
  lastActiveDate: string | null,
): StreakInfo {
  const bestStreak = readBestStreak(childId, currentStreak)
  const activeDate =
    currentStreak > 0 ? lastActiveDate ?? new Date().toISOString().slice(0, 10) : null

  return {
    childId,
    currentStreak,
    bestStreak,
    lastActiveDate: activeDate,
    nextRewardDay: getNextRewardDay(currentStreak),
    weeklyProgress: buildWeeklyProgress(currentStreak, activeDate),
  }
}

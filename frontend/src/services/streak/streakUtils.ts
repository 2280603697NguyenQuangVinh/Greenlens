import type { RewardMilestone, StreakInfo, StreakRewardInfo } from "./types"
import {
  addDaysToDateKey,
  getMondayKeyForWeek,
  getVietnamTodayKey,
} from "@/utils/appDate"
import {
  dayHadActivity,
  findDailyRecordForDayKey,
  readAllDailyRecords,
} from "./dailyActivityStorage"
import type { AchievementId } from "@/assets/achievementAssets"
import { getAchievement } from "@/assets/achievementAssets"
import { STREAK_30_ICON, XP_REWARD_ICON } from "@/assets/iconAssets"

const REWARD_MILESTONES: Array<{
  day: number
  label: string
  icon?: string
  badgeId?: AchievementId
  rewardImageUrl?: string
}> = [
  { day: 3, label: "20XP", rewardImageUrl: XP_REWARD_ICON },
  { day: 7, label: "Huy hiệu 'Thách thức 7 ngày'", badgeId: "challenge-7" },
  { day: 14, label: "Huy hiệu 'Vệ sĩ cây xanh'", badgeId: "tree-guard" },
  { day: 30, label: "Phần thưởng đặc biệt", rewardImageUrl: STREAK_30_ICON },
]
const BEST_STREAK_PREFIX = "gl_best_streak_"

/** Các ngày check-in streak liên tiếp (từ lastActiveDate lùi về). */
export function getStreakCheckInDayKeys(
  currentStreak: number,
  lastActiveDate: string | null,
): string[] {
  if (currentStreak <= 0 || !lastActiveDate) return []
  const last = lastActiveDate.slice(0, 10)
  const keys: string[] = []
  for (let i = 0; i < currentStreak; i++) {
    keys.push(addDaysToDateKey(last, -i))
  }
  return keys
}

function maxConsecutiveActiveDaysFromStorage(): number {
  const all = readAllDailyRecords()
  const activeDays = new Set<string>()

  for (const [key, record] of Object.entries(all)) {
    if (!dayHadActivity(record)) continue
    const dayKey = record.date?.slice(0, 10) ?? key.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) activeDays.add(dayKey)
  }

  if (activeDays.size === 0) return 0

  const sorted = [...activeDays].sort()
  let maxRun = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === addDaysToDateKey(sorted[i - 1], 1)) {
      run++
      maxRun = Math.max(maxRun, run)
    } else {
      run = 1
    }
  }
  return maxRun
}

export function buildWeeklyProgress(
  currentStreak: number,
  lastActiveDate: string | null,
): boolean[] {
  const result = Array<boolean>(7).fill(false)
  const today = getVietnamTodayKey()
  const monday = getMondayKeyForWeek(today)
  const all = readAllDailyRecords()
  const streakDays = new Set(getStreakCheckInDayKeys(currentStreak, lastActiveDate))

  for (let i = 0; i < 7; i++) {
    const dayKey = addDaysToDateKey(monday, i)
    const hadDaily = dayHadActivity(findDailyRecordForDayKey(all, dayKey))
    result[i] = hadDaily || streakDays.has(dayKey)
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
  return milestone?.label ?? "Phần thưởng đặc biệt"
}

export function buildRewardMilestones(currentStreak: number): RewardMilestone[] {
  return REWARD_MILESTONES.map((m) => {
    const achievement = m.badgeId ? getAchievement(m.badgeId) : undefined
    return {
      day: m.day,
      label: m.label,
      icon: m.icon,
      badgeId: m.badgeId,
      imageUrl: achievement?.image ?? m.rewardImageUrl,
      unlocked: currentStreak >= m.day,
    }
  })
}
export function buildStreakRewardInfo(currentStreak: number): StreakRewardInfo {
  const nextRewardDay = getNextRewardDay(currentStreak)
  return {
    currentRewardProgress: currentStreak,
    nextRewardDay,
    nextRewardName: getNextRewardName(nextRewardDay),
  }
}

/** Kỷ lục — chỉ tăng khi có bằng chứng (chuỗi BE / log nhiệm vụ), gỡ số phình từ local cũ. */
export function resolveBestStreak(
  childId: string,
  currentStreak: number,
  _lastActiveDate: string | null,
): number {
  const key = `${BEST_STREAK_PREFIX}${childId}`
  let stored = Number(localStorage.getItem(key) ?? 0)

  const provable = Math.max(
    currentStreak,
    maxConsecutiveActiveDaysFromStorage(),
  )

  if (stored > provable) {
    stored = provable
    localStorage.setItem(key, String(stored))
  }

  if (currentStreak > stored) {
    stored = currentStreak
    localStorage.setItem(key, String(stored))
  }

  return Math.max(currentStreak, stored)
}

export function toStreakInfo(
  childId: string,
  currentStreak: number,
  lastActiveDate: string | null,
): StreakInfo {
  const bestStreak = resolveBestStreak(childId, currentStreak, lastActiveDate)
  const activeDate =
    currentStreak > 0
      ? lastActiveDate ?? getVietnamTodayKey()
      : lastActiveDate

  return {
    childId,
    currentStreak,
    bestStreak,
    lastActiveDate: activeDate,
    nextRewardDay: getNextRewardDay(currentStreak),
    weeklyProgress: buildWeeklyProgress(currentStreak, activeDate),
  }
}

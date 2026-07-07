import type { StreakInfo, StreakRewardInfo, DailyActivityStatus, RewardMilestone, StreakStatusInfo } from "@/services/streak/types"
import { getStreakCheckInDayKeys } from "@/services/streak/streakUtils"
import { addDaysToDateKey, getMondayKeyForWeek, getVietnamTodayKey, getVietnamWeekDayIndex, isSameDay } from "@/utils/appDate"
import { getStreakStatusMascotHint } from "@/features/streak/utils/streakStatus"

export function getMascotStreakMessage(
  streak: StreakInfo,
  rewards: StreakRewardInfo,
  dailyActivity: DailyActivityStatus,
  streakStatus?: StreakStatusInfo,
): string {
  const statusHint = streakStatus ? getStreakStatusMascotHint(streakStatus) : null
  if (statusHint && streak.currentStreak === 0) return statusHint
  if (streak.currentStreak === 0) {
    if (dailyActivity.completedCount >= 1) {
      const left = dailyActivity.totalCount - dailyActivity.completedCount
      if (left > 0) {
        return `Giỏi lắm! Đã giữ chuỗi hôm nay. Còn ${left} nhiệm vụ nữa nhé!`
      }
      return "Tuyệt vời! Con đã hoàn thành tất cả nhiệm vụ hôm nay!"
    }
    return "Bắt đầu hành trình xanh ngay hôm nay!"
  }

  const daysLeft = rewards.nextRewardDay - streak.currentStreak

  if (daysLeft === 1) {
    const isBadgeReward = rewards.nextRewardDay >= 7
    return isBadgeReward
      ? "Cố lên nhé! Chỉ còn 1 ngày nữa là nhận được huy hiệu mới."
      : `Cố lên nhé! Chỉ còn 1 ngày nữa là nhận được ${rewards.nextRewardName}.`
  }

  if (
    dailyActivity.completedCount >= 1 &&
    dailyActivity.completedCount < dailyActivity.totalCount
  ) {
    const left = dailyActivity.totalCount - dailyActivity.completedCount
    return `Tuyệt! Đã giữ chuỗi hôm nay. Còn ${left} nhiệm vụ nữa nhé!`
  }

  if (dailyActivity.completedCount === dailyActivity.totalCount) {
    return "Tuyệt vời! Con đã hoàn thành tất cả nhiệm vụ hôm nay!"
  }

  if (statusHint) return statusHint

  return `Tuyệt vời! Con đã học ${streak.currentStreak} ngày liên tiếp rồi!`
}

export function getDayLabels(): string[] {
  return ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
}

export function getTodayWeekIndex(): number {
  return getVietnamWeekDayIndex()
}

export type WeekDayState =
  | "upcoming"
  | "empty"
  | "today"
  | "current"
  | "today-done"
  | "streak"
  | "frozen"

function getFreezeGapDayKeys(lastActiveDate: string | null, today: string): string[] {
  if (!lastActiveDate) return []
  const keys: string[] = []
  let cursor = addDaysToDateKey(lastActiveDate.slice(0, 10), 1)
  while (cursor < today) {
    keys.push(cursor)
    cursor = addDaysToDateKey(cursor, 1)
  }
  return keys
}

function isFreezeGapDay(
  dayKey: string,
  today: string,
  lastActive: string | null,
  gapAnchor: string | null,
  freezeGapDayKeys: string[],
): boolean {
  if (freezeGapDayKeys.includes(dayKey)) return true
  // Danh sách gap đã lưu là nguồn đúng — không suy ra thêm từ anchor (tránh nhầm ngày streak).
  if (freezeGapDayKeys.length > 0) return false

  const anchor =
    gapAnchor && gapAnchor < today
      ? gapAnchor
      : lastActive && lastActive < today
        ? lastActive
        : null

  if (!anchor) return false
  return getFreezeGapDayKeys(anchor, today).includes(dayKey)
}

function getFreezeDaysUsed(streakStatus?: StreakStatusInfo): number {
  if (!streakStatus) return 0
  return Math.max(
    streakStatus.freezeDaysUsed,
    streakStatus.missedDaysCoveredByFreeze,
  )
}

function shouldShowRecoveredFireOnGap(
  streakStatus: StreakStatusInfo | undefined,
  todayCompletedCount: number,
  freezeGapDayKeys: string[] = [],
): boolean {
  if (todayCompletedCount < 1) return false
  const status = streakStatus?.status ?? "NotStarted"
  if (status === "Expired" || status === "Reset") return false
  if (status === "Frozen") return true
  if (getFreezeDaysUsed(streakStatus) > 0) return true
  if (status === "FreezeUsed") return true
  return freezeGapDayKeys.length > 0
}

/** Có nên chạy animation băng → lửa (vừa recover sau freeze). */
export function shouldPlayFreezeRecoverAnimation(
  streakStatus: StreakStatusInfo | undefined,
  todayCompletedCount: number,
  freezeGapDayKeys: string[] = [],
): boolean {
  if (todayCompletedCount < 1) return false
  const status = streakStatus?.status ?? "NotStarted"
  if (status === "Expired" || status === "Reset") return false
  if (getFreezeDaysUsed(streakStatus) > 0) return true
  return freezeGapDayKeys.length > 0
}

/** Ô lịch từng là ngày đóng băng, giờ đã recover thành lửa. */
export function isRecoveredFreezeWeekDay(params: {
  index: number
  todayIndex: number
  todayCompletedCount: number
  currentStreak: number
  streakStatus?: StreakStatusInfo
  lastActiveDate: string | null
  gapAnchorDate?: string | null
  freezeGapDayKeys?: string[]
  recoveredGapDayKeys?: string[]
}): boolean {
  const {
    index,
    todayIndex,
    todayCompletedCount,
    currentStreak,
    streakStatus,
    lastActiveDate,
    gapAnchorDate,
    freezeGapDayKeys = [],
    recoveredGapDayKeys = [],
  } = params
  if (index >= todayIndex || !shouldShowRecoveredFireOnGap(streakStatus, todayCompletedCount, freezeGapDayKeys)) {
    return false
  }

  const today = getVietnamTodayKey()
  const monday = getMondayKeyForWeek(today)
  const dayKey = addDaysToDateKey(monday, index)
  const lastActive = lastActiveDate?.slice(0, 10) ?? null
  const gapAnchor = gapAnchorDate?.slice(0, 10) ?? null

  if (recoveredGapDayKeys.includes(dayKey)) {
    return false
  }

  // Ngày check-in streak thật (vd. T3) — không phải ngày đóng băng.
  if (getStreakCheckInDayKeys(currentStreak, lastActive).includes(dayKey)) {
    return false
  }

  if (freezeGapDayKeys.length > 0) {
    return freezeGapDayKeys.includes(dayKey)
  }

  if (isFreezeGapDay(dayKey, today, lastActive, gapAnchor, freezeGapDayKeys)) {
    return true
  }

  const freezeUsed = getFreezeDaysUsed(streakStatus)
  if (freezeUsed <= 0) return false

  const status = streakStatus?.status ?? "NotStarted"
  if (status === "Expired") return false

  if (lastActive && isSameDay(lastActive, today)) {
    for (let i = 1; i <= freezeUsed; i++) {
      if (dayKey === addDaysToDateKey(today, -i)) return true
    }
    return false
  }

  if (lastActive) {
    return getFreezeGapDayKeys(lastActive, today).includes(dayKey)
  }

  return false
}

/** Delay stagger (giây) — ngày xa hôm nay hơn tan băng trước. */
export function getRecoverFreezeStaggerDelay(
  index: number,
  streakStatus: StreakStatusInfo | undefined,
  freezeGapDayKeys: string[] = [],
): number {
  const today = getVietnamTodayKey()
  const monday = getMondayKeyForWeek(today)
  const dayKey = addDaysToDateKey(monday, index)

  const freezeUsed = getFreezeDaysUsed(streakStatus)
  if (freezeUsed > 0) {
    for (let i = freezeUsed; i >= 1; i--) {
      if (dayKey === addDaysToDateKey(today, -i)) {
        return (freezeUsed - i) * 0.14
      }
    }
  }

  if (freezeGapDayKeys.length > 0) {
    const sorted = [...freezeGapDayKeys].sort()
    const gapIndex = sorted.indexOf(dayKey)
    if (gapIndex >= 0) return gapIndex * 0.14
  }

  return 0
}

/** Ngày hiển thị lửa — gồm chuỗi + ngày gap đã recover sau đóng băng (≤2 ngày miss, BE max 3 ngày vắng). */
function getStreakFireDayKeys(
  currentStreak: number,
  lastActive: string | null,
  today: string,
  streakStatus: StreakStatusInfo | undefined,
  todayCompletedCount: number,
  gapAnchorDate?: string | null,
  recoveredGapDayKeys: string[] = [],
): Set<string> {
  const keys = new Set<string>()
  if (!lastActive) return keys

  for (const dayKey of recoveredGapDayKeys) {
    if (dayKey < today) keys.add(dayKey)
  }

  const status = streakStatus?.status ?? "NotStarted"
  const freezeUsed = getFreezeDaysUsed(streakStatus)
  const recoveredFromFreeze =
    todayCompletedCount >= 1 &&
    freezeUsed > 0 &&
    status !== "Expired"

  const gapAnchor = gapAnchorDate?.slice(0, 10) ?? null
  const gapSource =
    lastActive && !isSameDay(lastActive, today)
      ? lastActive
      : gapAnchor && gapAnchor < today
        ? gapAnchor
        : lastActive

  if (currentStreak <= 0) {
    if (recoveredFromFreeze && gapSource) {
      for (const k of getFreezeGapDayKeys(gapSource, today)) keys.add(k)
    }
    return keys
  }

  if (recoveredFromFreeze && isSameDay(lastActive, today)) {
    for (const k of getStreakCheckInDayKeys(currentStreak, lastActive)) keys.add(k)
    for (let i = 1; i <= freezeUsed; i++) keys.add(addDaysToDateKey(today, -i))
    const preLast = addDaysToDateKey(today, -(freezeUsed + 1))
    for (const k of getStreakCheckInDayKeys(Math.max(currentStreak - 1, 1), preLast)) {
      keys.add(k)
    }
    return keys
  }

  if (recoveredFromFreeze) {
    for (const k of getStreakCheckInDayKeys(currentStreak, lastActive)) keys.add(k)
    for (const k of getFreezeGapDayKeys(gapSource, today)) keys.add(k)
    return keys
  }

  for (const k of getStreakCheckInDayKeys(currentStreak, lastActive)) keys.add(k)
  return keys
}

/** Trạng thái từng ô lịch 7 ngày — tick hôm nay, lửa chuỗi, băng khi freeze. */
export function getWeekDayState(params: {
  index: number
  todayIndex: number
  currentStreak: number
  lastActiveDate: string | null
  todayCompletedCount: number
  streakStatus?: StreakStatusInfo
  gapAnchorDate?: string | null
  freezeGapDayKeys?: string[]
  recoveredGapDayKeys?: string[]
}): WeekDayState {
  const {
    index,
    todayIndex,
    currentStreak,
    lastActiveDate,
    todayCompletedCount,
    streakStatus,
    gapAnchorDate,
    freezeGapDayKeys = [],
    recoveredGapDayKeys = [],
  } = params

  const today = getVietnamTodayKey()
  const monday = getMondayKeyForWeek(today)
  const dayKey = addDaysToDateKey(monday, index)
  const lastActive = lastActiveDate?.slice(0, 10) ?? null
  const gapAnchor = gapAnchorDate?.slice(0, 10) ?? null
  const status = streakStatus?.status ?? "NotStarted"
  const isRecoveredGap = recoveredGapDayKeys.includes(dayKey)
  const isGap =
    !isRecoveredGap &&
    isFreezeGapDay(dayKey, today, lastActive, gapAnchor, freezeGapDayKeys)

  if (status === "Expired" || status === "Reset") {
    if (index === todayIndex) {
      if (todayCompletedCount >= 1) return "today-done"
      return "today"
    }
    if (index < todayIndex && isGap) return "frozen"
    if (index < todayIndex) return "empty"
    return "upcoming"
  }

  if (index > todayIndex) return "upcoming"

  if (index === todayIndex) {
    if (todayCompletedCount >= 1) return "today-done"
    if (currentStreak > 0 || status === "Frozen") return "current"
    return "today"
  }

  const streakDays = getStreakFireDayKeys(
    currentStreak,
    lastActive,
    today,
    streakStatus,
    todayCompletedCount,
    gapAnchor,
    recoveredGapDayKeys,
  )

  if (isRecoveredGap && index < todayIndex && currentStreak > 0) {
    return "streak"
  }

  if (streakDays.has(dayKey) && (currentStreak > 0 || todayCompletedCount >= 1)) {
    return "streak"
  }

  if (index < todayIndex && isGap) {
    if (shouldShowRecoveredFireOnGap(streakStatus, todayCompletedCount, freezeGapDayKeys)) {
      return "streak"
    }
    return "frozen"
  }

  if (index < todayIndex) return "empty"

  return "upcoming"
}

export function formatNextRewardDayLabel(nextRewardDay: number): string {
  return `Ngày thứ ${nextRewardDay}`
}

export function formatNextRewardLabel(nextRewardDay: number, _nextRewardName: string): string {
  return formatNextRewardDayLabel(nextRewardDay)
}

export function getMilestoneStatus(
  milestone: RewardMilestone,
  currentStreak: number,
): "unlocked" | "current" | "locked" {
  if (currentStreak === 0) return "locked"
  if (milestone.unlocked || currentStreak >= milestone.day) return "unlocked"
  const prevDays = [0, 3, 7, 14]
  const days = [3, 7, 14, 30]
  const idx = days.indexOf(milestone.day)
  const prevDay = idx > 0 ? prevDays[idx] : 0
  if (currentStreak >= prevDay && currentStreak < milestone.day) return "current"
  return "locked"
}

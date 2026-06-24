import type { StreakInfo, StreakRewardInfo, DailyActivityStatus, RewardMilestone } from "@/services/streak/types"

export function getMascotStreakMessage(
  streak: StreakInfo,
  rewards: StreakRewardInfo,
  dailyActivity: DailyActivityStatus,
): string {
  if (streak.currentStreak === 0) {
    if (dailyActivity.completedCount === dailyActivity.totalCount) {
      return "Tuyệt vời! Con đã hoàn thành tất cả nhiệm vụ hôm nay! 🔥"
    }
    if (dailyActivity.completedCount > 0) {
      const left = dailyActivity.totalCount - dailyActivity.completedCount
      return `Giỏi lắm! Còn ${left} nhiệm vụ nữa để hoàn thành hôm nay nhé!`
    }
    return "Bắt đầu hành trình xanh ngay hôm nay!"
  }

  const daysLeft = rewards.nextRewardDay - streak.currentStreak

  if (daysLeft === 1) {
    return `Cố lên nhé! Chỉ còn 1 ngày nữa là nhận được ${rewards.nextRewardName}.`
  }

  if (dailyActivity.completedCount === dailyActivity.totalCount) {
    return `Tuyệt vời! Con đã hoàn thành tất cả nhiệm vụ hôm nay! 🔥`
  }

  return `Tuyệt vời! Con đã học ${streak.currentStreak} ngày liên tiếp rồi!`
}

export function getDayLabels(): string[] {
  return ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
}

export function getTodayWeekIndex(): number {
  return (new Date().getDay() + 6) % 7
}

export type WeekDayState = "completed" | "current" | "today" | "upcoming" | "missed"

export function getWeekDayState(
  index: number,
  weeklyProgress: boolean[],
  todayIndex: number,
  currentStreak = 0,
  todayHasActivity = false,
): WeekDayState {
  if (index === todayIndex) {
    if (weeklyProgress[index] || todayHasActivity) return "completed"
    if (currentStreak === 0) return "today"
    return "current"
  }

  if (currentStreak === 0) {
    return "upcoming"
  }

  if (index > todayIndex) return "upcoming"
  return weeklyProgress[index] ? "completed" : "missed"
}

export function formatNextRewardLabel(nextRewardDay: number, _nextRewardName: string): string {
  return `Ngày thứ ${nextRewardDay}`
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

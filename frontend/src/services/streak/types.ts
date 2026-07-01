/** Task-spec streak response shape */
export interface StreakInfo {
  childId: string
  currentStreak: number
  bestStreak: number
  lastActiveDate: string | null
  nextRewardDay: number
  weeklyProgress: boolean[]
}

export interface DailyActivityStatus {
  cameraCompleted: boolean
  quizCompleted: boolean
  gameCompleted: boolean
  completedCount: number
  totalCount: number
}

export interface StreakRewardInfo {
  currentRewardProgress: number
  nextRewardDay: number
  nextRewardName: string
}

export interface RewardMilestone {
  day: number
  label: string
  /** Emoji fallback when no badge image (e.g. +20 XP). */
  icon?: string
  badgeId?: string
  imageUrl?: string
  unlocked: boolean
}

export interface BadgeStatusDto {
  code: string
  name: string
  description: string
  unlockCondition: string
  isUnlocked: boolean
  progressCurrent: number
  progressTarget: number
}

/** Backend GET/POST /child-profiles/{childId}/streak */
export interface BackendStreakResponse {
  childId: string
  currentStreak: number
  targetStreakDays: number
  daysToStreak30: number
  progressPercent: number
  isStreak30Unlocked: boolean
  lastStreakDate?: string | null
  maxFreezeDays?: number
  freezeDaysUsed?: number
  freezeDaysRemaining?: number
  missedDaysCoveredByFreeze?: number
  streakStatus?: string
  badge: BadgeStatusDto
}

/** Backend GET /child-profiles/{childId} (subset) */
export interface BackendChildProfile {
  childId: string
  streak: number
  badgeCatalog?: BadgeStatusDto[]
}

export interface StreakStatusInfo {
  status: string
  freezeDaysRemaining: number
  freezeDaysUsed: number
  missedDaysCoveredByFreeze: number
  maxFreezeDays: number
}

export interface StreakBundle {
  streak: StreakInfo
  dailyActivity: DailyActivityStatus
  rewards: StreakRewardInfo
  milestones: RewardMilestone[]
  streakStatus: StreakStatusInfo
  /** Ngày hoạt động cuối trước khoảng miss — hiển thị băng sau Reset. */
  gapAnchorDate?: string | null
  /** Các ngày trong tuần từng đóng băng (persist local). */
  freezeGapDayKeys?: string[]
}

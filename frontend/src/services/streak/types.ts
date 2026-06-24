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
  icon: string
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

/** Backend GET /child-profiles/{childId}/streak */
export interface BackendStreakResponse {
  childId: string
  currentStreak: number
  targetStreakDays: number
  daysToStreak30: number
  progressPercent: number
  isStreak30Unlocked: boolean
  badge: BadgeStatusDto
}

/** Backend GET /child-profiles/{childId} (subset) */
export interface BackendChildProfile {
  childId: string
  streak: number
  badgeCatalog?: BadgeStatusDto[]
}

export interface StreakBundle {
  streak: StreakInfo
  dailyActivity: DailyActivityStatus
  rewards: StreakRewardInfo
  milestones: RewardMilestone[]
}

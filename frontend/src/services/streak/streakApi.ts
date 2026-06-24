import { ApiError, NetworkError } from "@/services/errors"
import { ensureBearerToken, mapAuthErrorMessage } from "@/services/authToken"
import { apiUrl } from "@/services/http"
import { getChildId } from "@/services/childProfileStorage"
import { loadSavedProfile } from "@/services/greenLens"
import { getTodayDailyActivity } from "./dailyActivityStorage"
import { ensureStreakSyncedFromDaily, getEffectiveLocalStreak } from "./localStreakStorage"
import {
  buildRewardMilestones,
  buildStreakRewardInfo,
  getNextRewardDay,
  toStreakInfo,
} from "./streakUtils"
import type { UserProfile } from "@/services/greenLens"
import type {
  BackendChildProfile,
  BackendStreakResponse,
  DailyActivityStatus,
  StreakBundle,
  StreakInfo,
  StreakRewardInfo,
} from "./types"

async function readApiErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}))
  const record = body as { message?: string; detail?: string; title?: string }
  return (
    record.message?.trim() ||
    record.detail?.trim() ||
    record.title?.trim() ||
    res.statusText ||
    fallback
  )
}

function isJsonResponse(res: Response): boolean {
  const contentType = res.headers.get("content-type") ?? ""
  return contentType.includes("application/json")
}

/** Returns null on 404, HTML/non-JSON, or unimplemented endpoints — never throws parse errors. */
async function authorizedGetOptional<T>(path: string): Promise<T | null> {
  let token: string
  try {
    token = await ensureBearerToken()
  } catch {
    return null
  }

  let res: Response
  try {
    res = await fetch(apiUrl(path), {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    return null
  }

  if (res.status === 404 || !isJsonResponse(res)) return null

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      const raw = await readApiErrorMessage(res, "Không tải được dữ liệu streak.")
      throw new ApiError(mapAuthErrorMessage(raw, res.status))
    }
    return null
  }

  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

function mockStreakBundle(childId: string): StreakBundle {
  const streak = toStreakInfo(childId, 5, new Date().toISOString().slice(0, 10))
  const daily = getTodayDailyActivity()
  const dailyActivity: DailyActivityStatus = {
    cameraCompleted: daily.cameraCompleted,
    quizCompleted: daily.quizCompleted,
    gameCompleted: daily.gameCompleted,
    completedCount:
      Number(daily.cameraCompleted) +
      Number(daily.quizCompleted) +
      Number(daily.gameCompleted),
    totalCount: 3,
  }

  if (!daily.cameraCompleted && !daily.quizCompleted && !daily.gameCompleted) {
    dailyActivity.cameraCompleted = true
    dailyActivity.gameCompleted = true
    dailyActivity.completedCount = 2
  }

  return {
    streak,
    dailyActivity,
    rewards: buildStreakRewardInfo(streak.currentStreak),
    milestones: buildRewardMilestones(streak.currentStreak),
  }
}

function localDailyActivity(): DailyActivityStatus {
  const daily = getTodayDailyActivity()
  const completedCount =
    Number(daily.cameraCompleted) +
    Number(daily.quizCompleted) +
    Number(daily.gameCompleted)

  return {
    cameraCompleted: daily.cameraCompleted,
    quizCompleted: daily.quizCompleted,
    gameCompleted: daily.gameCompleted,
    completedCount,
    totalCount: 3,
  }
}

function mergeStreakSources(
  childId: string,
  backendStreak: BackendStreakResponse | null,
  backendProfile: BackendChildProfile | null,
  cachedProfile: UserProfile | null,
  localStreak: ReturnType<typeof getEffectiveLocalStreak>,
): StreakInfo {
  const backendCurrent =
    backendStreak?.currentStreak ??
    backendProfile?.streak ??
    cachedProfile?.streak ??
    0

  const useLocal = localStreak.currentStreak >= backendCurrent
  const current = Math.max(localStreak.currentStreak, backendCurrent)
  const lastActive = useLocal
    ? localStreak.lastActiveDate
    : backendCurrent > 0
      ? new Date().toISOString().slice(0, 10)
      : null

  const streak = toStreakInfo(childId, current, lastActive)
  streak.bestStreak = Math.max(
    streak.bestStreak,
    localStreak.bestStreak,
    backendCurrent,
  )
  streak.nextRewardDay = getNextRewardDay(current)
  return streak
}

function applyBadgeCatalog(
  milestones: ReturnType<typeof buildRewardMilestones>,
  badgeCatalog: BackendChildProfile["badgeCatalog"],
): void {
  if (!badgeCatalog) return

  const eco = badgeCatalog.find((b) => b.code === "streak_7_days")
  const hero = badgeCatalog.find((b) => b.code === "streak_30_days")

  if (eco) {
    const m = milestones.find((item) => item.day === 7)
    if (m) {
      m.label = eco.name
      m.unlocked = eco.isUnlocked
    }
  }
  if (hero) {
    const m = milestones.find((item) => item.day === 30)
    if (m) {
      m.label = hero.name
      m.unlocked = hero.isUnlocked
    }
  }
}

export async function fetchStreakBundle(): Promise<StreakBundle> {
  const childId = getChildId()
  if (!childId) {
    throw new ApiError("Bạn cần tạo nhân vật trước khi tiếp tục.")
  }

  if (import.meta.env.VITE_USE_MOCK === "true") {
    return mockStreakBundle(childId)
  }

  const cachedProfile = loadSavedProfile()
  const localStreak = ensureStreakSyncedFromDaily(childId)

  const [backendStreak, backendProfile, taskStreak, taskDaily, taskRewards] =
    await Promise.all([
      authorizedGetOptional<BackendStreakResponse>(`/child-profiles/${childId}/streak`),
      authorizedGetOptional<BackendChildProfile>(`/child-profiles/${childId}`),
      authorizedGetOptional<StreakInfo>(`/users/${childId}/streak`),
      authorizedGetOptional<DailyActivityStatus>(`/users/${childId}/daily-activity`),
      authorizedGetOptional<StreakRewardInfo>(`/users/${childId}/streak-rewards`),
    ])

  let streak: StreakInfo

  if (taskStreak) {
    const mergedCurrent = Math.max(taskStreak.currentStreak, localStreak.currentStreak)
    const lastActive =
      localStreak.currentStreak >= taskStreak.currentStreak
        ? localStreak.lastActiveDate
        : taskStreak.lastActiveDate

    streak = {
      ...taskStreak,
      currentStreak: mergedCurrent,
      bestStreak: Math.max(
        taskStreak.bestStreak,
        localStreak.bestStreak,
        mergedCurrent,
      ),
      lastActiveDate: lastActive,
      weeklyProgress:
        taskStreak.weeklyProgress?.length === 7 && mergedCurrent === taskStreak.currentStreak
          ? taskStreak.weeklyProgress
          : toStreakInfo(childId, mergedCurrent, lastActive).weeklyProgress,
      nextRewardDay: getNextRewardDay(mergedCurrent),
    }
  } else {
    streak = mergeStreakSources(
      childId,
      backendStreak,
      backendProfile,
      cachedProfile,
      localStreak,
    )
  }

  const dailyActivity = taskDaily ?? localDailyActivity()
  const rewards = taskRewards ?? buildStreakRewardInfo(streak.currentStreak)
  const milestones = buildRewardMilestones(streak.currentStreak)
  applyBadgeCatalog(milestones, backendProfile?.badgeCatalog)

  return { streak, dailyActivity, rewards, milestones }
}

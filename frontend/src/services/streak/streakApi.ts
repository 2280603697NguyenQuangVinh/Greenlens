import { ApiError, NetworkError } from "@/services/errors"
import { ensureBearerToken, mapAuthErrorMessage } from "@/services/authToken"
import { apiUrl } from "@/services/http"
import { getChildId } from "@/services/childProfileStorage"
import { loadSavedProfile } from "@/services/greenLens"
import { getTodayDailyActivity } from "./dailyActivityStorage"
import {
  ensureStreakSyncedFromDaily,
  getEffectiveLocalStreak,
  syncLocalStreakFromBackend,
} from "./localStreakStorage"
import {
  checkInStreak,
  clearCheckInSessionIfServerMismatch,
} from "./streakCheckIn"
import { getVietnamTodayKey, isSameDay } from "@/utils/appDate"
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
} from "./types"
import { buildStreakStatusInfo } from "./streakStatus"

export { checkInStreak } from "./streakCheckIn"

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
    streakStatus: buildStreakStatusInfo(null),
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

function resolveStreakInfo(
  childId: string,
  backendStreak: BackendStreakResponse | null,
  backendProfile: BackendChildProfile | null,
  cachedProfile: UserProfile | null,
  localStreak: ReturnType<typeof getEffectiveLocalStreak>,
  dailyActivity: DailyActivityStatus,
): StreakInfo {
  const today = getVietnamTodayKey()
  let current = 0
  let lastActive: string | null = null

  if (backendStreak) {
    current = Math.max(backendStreak.currentStreak, 0)
    lastActive = backendStreak.lastStreakDate?.slice(0, 10) ?? null
  } else {
    const syncedLocal =
      dailyActivity.completedCount >= 1
        ? ensureStreakSyncedFromDaily(childId)
        : localStreak

    current = Math.max(
      backendProfile?.streak ?? 0,
      cachedProfile?.streak ?? 0,
      syncedLocal.currentStreak,
      0,
    )
    lastActive = syncedLocal.lastActiveDate

    if (dailyActivity.completedCount >= 1 && current === 0) {
      current = Math.max(syncedLocal.currentStreak, 1)
      lastActive = lastActive ?? today
    }
  }

  const streak = toStreakInfo(childId, current, lastActive)
  streak.nextRewardDay = getNextRewardDay(current)
  return streak
}

function applyBadgeCatalog(
  milestones: ReturnType<typeof buildRewardMilestones>,
  badgeCatalog: BackendChildProfile["badgeCatalog"],
  backendStreak: BackendStreakResponse | null,
): void {
  if (backendStreak?.badge?.code === "streak_30_days") {
    const m = milestones.find((item) => item.day === 30)
    if (m) {
      m.unlocked = backendStreak.badge.isUnlocked
    }
  }

  if (!badgeCatalog) return

  const eco = badgeCatalog.find((b) => b.code === "streak_7_days")
  const hero = badgeCatalog.find((b) => b.code === "streak_30_days")

  if (eco) {
    const m = milestones.find((item) => item.day === 7)
    if (m) {
      m.unlocked = eco.isUnlocked
    }
  }
  if (hero) {
    const m = milestones.find((item) => item.day === 30)
    if (m) {
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
  const localStreak = getEffectiveLocalStreak(childId)
  const dailyActivity = localDailyActivity()

  let backendStreak = await authorizedGetOptional<BackendStreakResponse>(
    `/child-profiles/${childId}/streak`,
  )

  clearCheckInSessionIfServerMismatch(backendStreak?.lastStreakDate)

  const today = getVietnamTodayKey()
  const serverCheckedInToday = isSameDay(backendStreak?.lastStreakDate, today)
  const needsBackfillCheckIn =
    dailyActivity.completedCount >= 1 && !serverCheckedInToday

  if (needsBackfillCheckIn) {
    const checkInResult = await checkInStreak(childId, {
      notify: false,
      skipIfDone: false,
    })
    backendStreak =
      checkInResult ??
      (await authorizedGetOptional<BackendStreakResponse>(
        `/child-profiles/${childId}/streak`,
      ))
  }

  const backendProfile = await authorizedGetOptional<BackendChildProfile>(
    `/child-profiles/${childId}`,
  )

  if (backendStreak) {
    syncLocalStreakFromBackend(
      childId,
      backendStreak.currentStreak,
      backendStreak.lastStreakDate,
    )
  }

  const streak = resolveStreakInfo(
    childId,
    backendStreak,
    backendProfile,
    cachedProfile,
    localStreak,
    dailyActivity,
  )

  const rewards = buildStreakRewardInfo(streak.currentStreak)
  const milestones = buildRewardMilestones(streak.currentStreak)
  applyBadgeCatalog(milestones, backendProfile?.badgeCatalog, backendStreak)

  return {
    streak,
    dailyActivity,
    rewards,
    milestones,
    streakStatus: buildStreakStatusInfo(backendStreak),
  }
}

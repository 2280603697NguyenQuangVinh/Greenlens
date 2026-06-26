import { authorizedJsonRequest } from "@/services/backendHttp"
import { getChildId } from "@/services/childProfileStorage"
import { getVietnamTodayKey, isSameDay } from "@/utils/appDate"
import { getTodayDailyActivity } from "./dailyActivityStorage"
import { notifyStreakChanged } from "./localStreakStorage"
import type { BackendStreakResponse } from "./types"

const CHECKIN_DATE_KEY = "gl_streak_checkin_date"

let checkInInFlight: Promise<BackendStreakResponse | null> | null = null

function todayDailyCompletedCount(): number {
  const daily = getTodayDailyActivity()
  return (
    Number(daily.cameraCompleted) +
    Number(daily.quizCompleted) +
    Number(daily.gameCompleted)
  )
}

export function hasCheckedInToday(): boolean {
  return sessionStorage.getItem(CHECKIN_DATE_KEY) === getVietnamTodayKey()
}

function markCheckedInToday(): void {
  sessionStorage.setItem(CHECKIN_DATE_KEY, getVietnamTodayKey())
}

export function clearCheckInSessionIfServerMismatch(
  serverLastStreakDate: string | null | undefined,
): void {
  if (!hasCheckedInToday()) return
  if (!isSameDay(serverLastStreakDate, getVietnamTodayKey())) {
    sessionStorage.removeItem(CHECKIN_DATE_KEY)
  }
}

type CheckInOptions = {
  notify?: boolean
  skipIfDone?: boolean
}

/** POST /child-profiles/{childId}/streak/check-in */
export async function checkInStreak(
  childId?: string | null,
  options: CheckInOptions = {},
): Promise<BackendStreakResponse | null> {
  const { notify = false, skipIfDone = false } = options
  const id = childId ?? getChildId()
  if (!id) return null

  if (skipIfDone && hasCheckedInToday()) {
    return null
  }

  if (checkInInFlight) {
    return checkInInFlight
  }

  checkInInFlight = (async () => {
    try {
      const result = await authorizedJsonRequest<BackendStreakResponse>(
        `/child-profiles/${id}/streak/check-in`,
        { method: "POST" },
      )
      markCheckedInToday()
      const { syncLocalStreakFromBackend } = await import("./localStreakStorage")
      syncLocalStreakFromBackend(id, result.currentStreak, result.lastStreakDate)
      if (notify) notifyStreakChanged()
      return result
    } catch {
      sessionStorage.removeItem(CHECKIN_DATE_KEY)
      return null
    } finally {
      checkInInFlight = null
    }
  })()

  return checkInInFlight
}

/** Call after marking a daily task complete. */
export function requestStreakCheckInAfterDailyTask(): void {
  if (todayDailyCompletedCount() < 1) return

  void (async () => {
    const result = await checkInStreak(undefined, { notify: false, skipIfDone: true })
    if (!result) {
      const { syncStreakAfterDailyActivity } = await import("./localStreakStorage")
      syncStreakAfterDailyActivity(undefined, { notify: false })
    }
    notifyStreakChanged()
  })()
}

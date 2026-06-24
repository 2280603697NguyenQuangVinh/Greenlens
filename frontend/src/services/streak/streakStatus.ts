import type { BackendStreakResponse, StreakStatusInfo } from "./types"

const DEFAULT_STATUS: StreakStatusInfo = {
  status: "NotStarted",
  freezeDaysRemaining: 2,
  freezeDaysUsed: 0,
  missedDaysCoveredByFreeze: 0,
  maxFreezeDays: 2,
}

export function buildStreakStatusInfo(
  backend: BackendStreakResponse | null,
): StreakStatusInfo {
  if (!backend) return DEFAULT_STATUS

  return {
    status: backend.streakStatus ?? "NotStarted",
    freezeDaysRemaining: backend.freezeDaysRemaining ?? 0,
    freezeDaysUsed: backend.freezeDaysUsed ?? 0,
    missedDaysCoveredByFreeze: backend.missedDaysCoveredByFreeze ?? 0,
    maxFreezeDays: backend.maxFreezeDays ?? 2,
  }
}

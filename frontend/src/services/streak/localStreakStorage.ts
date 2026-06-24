import { getChildId } from "@/services/childProfileStorage"

const STORAGE_KEY = "gl_local_streak_v1"
const DAILY_ACTIVITY_KEY = "gl_daily_activity_v1"
export const STREAK_REFRESH_EVENT = "gl-streak-refresh"

export type LocalStreakRecord = {
  childId: string
  currentStreak: number
  bestStreak: number
  lastActiveDate: string | null
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function readAll(): Record<string, LocalStreakRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, LocalStreakRecord>
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, LocalStreakRecord>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function daysBetween(earlier: string, later: string): number {
  const a = new Date(`${earlier}T12:00:00`)
  const b = new Date(`${later}T12:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000))
}

function dailyCompletedCount(): number {
  try {
    const raw = localStorage.getItem(DAILY_ACTIVITY_KEY)
    if (!raw) return 0
    const all = JSON.parse(raw) as Record<
      string,
      { cameraCompleted: boolean; quizCompleted: boolean; gameCompleted: boolean }
    >
    const record = all[todayKey()]
    if (!record) return 0
    return (
      Number(record.cameraCompleted) +
      Number(record.quizCompleted) +
      Number(record.gameCompleted)
    )
  } catch {
    return 0
  }
}

export function notifyStreakChanged(): void {
  window.dispatchEvent(new CustomEvent(STREAK_REFRESH_EVENT))
}

export function getLocalStreak(childId: string): LocalStreakRecord {
  const all = readAll()
  return (
    all[childId] ?? {
      childId,
      currentStreak: 0,
      bestStreak: 0,
      lastActiveDate: null,
    }
  )
}

/** Streak is still valid through today if last activity was yesterday or today. */
export function getEffectiveLocalStreak(childId: string): LocalStreakRecord {
  const record = getLocalStreak(childId)
  if (!record.lastActiveDate || record.currentStreak <= 0) {
    return record
  }

  const gap = daysBetween(record.lastActiveDate, todayKey())
  if (gap <= 1) return record

  return {
    childId,
    currentStreak: 0,
    bestStreak: record.bestStreak,
    lastActiveDate: record.lastActiveDate,
  }
}

export function syncStreakAfterDailyActivity(childId?: string | null): LocalStreakRecord | null {
  const id = childId ?? getChildId()
  if (!id) {
    notifyStreakChanged()
    return null
  }

  if (dailyCompletedCount() < 1) {
    return getEffectiveLocalStreak(id)
  }

  const today = todayKey()
  const all = readAll()
  const record = getLocalStreak(id)

  if (record.lastActiveDate === today) {
    notifyStreakChanged()
    return record
  }

  let nextStreak = 1
  if (record.lastActiveDate) {
    const gap = daysBetween(record.lastActiveDate, today)
    if (gap === 1) {
      nextStreak = record.currentStreak + 1
    } else if (gap > 1) {
      nextStreak = 1
    } else {
      nextStreak = record.currentStreak
    }
  }

  const updated: LocalStreakRecord = {
    childId: id,
    currentStreak: nextStreak,
    bestStreak: Math.max(record.bestStreak, nextStreak),
    lastActiveDate: today,
  }

  all[id] = updated
  writeAll(all)
  notifyStreakChanged()
  return updated
}

/** Backfill streak for users who completed tasks before streak sync existed. */
export function ensureStreakSyncedFromDaily(childId: string): LocalStreakRecord {
  if (dailyCompletedCount() < 1) {
    return getEffectiveLocalStreak(childId)
  }
  return syncStreakAfterDailyActivity(childId) ?? getEffectiveLocalStreak(childId)
}

import { getChildId } from "@/services/childProfileStorage"
import { getVietnamTodayKey } from "@/utils/appDate"
import { recordFreezeGapContext } from "./streakGapAnchor"

const STORAGE_KEY = "gl_local_streak_v1"
export const STREAK_REFRESH_EVENT = "gl-streak-refresh"

export type LocalStreakRecord = {
  childId: string
  currentStreak: number
  bestStreak: number
  lastActiveDate: string | null
  previousLastActiveDate?: string | null
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

import { getTodayDailyActivity } from "./dailyActivityStorage"

function dailyCompletedCount(): number {
  const daily = getTodayDailyActivity()
  return (
    Number(daily.cameraCompleted) +
    Number(daily.quizCompleted) +
    Number(daily.gameCompleted)
  )
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

  const gap = daysBetween(record.lastActiveDate, getVietnamTodayKey())
  if (gap <= 1) return record

  return {
    childId,
    currentStreak: 0,
    bestStreak: record.bestStreak,
    lastActiveDate: record.lastActiveDate,
  }
}

/** Đồng bộ gl_local_streak_v1 theo BE — tránh local lệch (vd. BE=2, local=1). */
export function syncLocalStreakFromBackend(
  childId: string,
  currentStreak: number,
  lastStreakDate: string | null | undefined,
): LocalStreakRecord {
  const all = readAll()
  const existing = getLocalStreak(childId)
  const lastActive = lastStreakDate?.slice(0, 10) ?? null
  const current = Math.max(currentStreak, 0)
  const today = getVietnamTodayKey()
  const prev = existing.lastActiveDate?.slice(0, 10) ?? null

  if (prev && lastActive === today && prev < today && daysBetween(prev, today) > 1) {
    recordFreezeGapContext(childId, prev, today)
  }

  const updated: LocalStreakRecord = {
    childId,
    currentStreak: current,
    bestStreak: Math.max(existing.bestStreak, current),
    lastActiveDate: current > 0 ? lastActive : null,
    previousLastActiveDate:
      prev && prev !== lastActive ? prev : existing.previousLastActiveDate ?? null,
  }

  all[childId] = updated
  writeAll(all)
  return updated
}

export function syncStreakAfterDailyActivity(
  childId?: string | null,
  options: { notify?: boolean } = {},
): LocalStreakRecord | null {
  const { notify = true } = options
  const id = childId ?? getChildId()
  if (!id) {
    if (notify) notifyStreakChanged()
    return null
  }

  if (dailyCompletedCount() < 1) {
    return getEffectiveLocalStreak(id)
  }

  const today = getVietnamTodayKey()
  const all = readAll()
  const record = getLocalStreak(id)

  if (record.lastActiveDate === today) {
    if (notify) notifyStreakChanged()
    return record
  }

  let nextStreak = 1
  if (record.lastActiveDate) {
    const gap = daysBetween(record.lastActiveDate, today)
    if (gap === 1) {
      nextStreak = record.currentStreak + 1
    } else if (gap > 1) {
      nextStreak = 1
      recordFreezeGapContext(id, record.lastActiveDate, today)
    } else {
      nextStreak = record.currentStreak
    }
  }

  const prev = record.lastActiveDate?.slice(0, 10) ?? null
  const updated: LocalStreakRecord = {
    childId: id,
    currentStreak: nextStreak,
    bestStreak: Math.max(record.bestStreak, nextStreak),
    lastActiveDate: today,
    previousLastActiveDate: prev && prev !== today ? prev : record.previousLastActiveDate ?? null,
  }

  all[id] = updated
  writeAll(all)
  if (notify) notifyStreakChanged()
  return updated
}

/** Backfill streak for users who completed tasks before streak sync existed. */
export function ensureStreakSyncedFromDaily(childId: string): LocalStreakRecord {
  if (dailyCompletedCount() < 1) {
    return getEffectiveLocalStreak(childId)
  }
  return syncStreakAfterDailyActivity(childId, { notify: false }) ?? getEffectiveLocalStreak(childId)
}

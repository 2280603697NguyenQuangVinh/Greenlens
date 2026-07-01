import { addDaysToDateKey, getMondayKeyForWeek, getVietnamTodayKey, getVietnamWeekDayIndex, isSameDay } from "@/utils/appDate"
import { getStreakCheckInDayKeys } from "@/services/streak/streakUtils"

const ANCHOR_PREFIX = "gl_streak_gap_anchor_"
const GAP_DAYS_PREFIX = "gl_streak_freeze_gap_days_"

export type FreezeGapContext = {
  gapAnchorDate: string | null
  freezeGapDayKeys: string[]
}

function gapDaysFromAnchor(anchor: string, today: string): string[] {
  const keys: string[] = []
  let cursor = addDaysToDateKey(anchor.slice(0, 10), 1)
  while (cursor < today) {
    keys.push(cursor)
    cursor = addDaysToDateKey(cursor, 1)
  }
  return keys
}

function readAnchor(childId: string): string | null {
  try {
    return localStorage.getItem(`${ANCHOR_PREFIX}${childId}`)
  } catch {
    return null
  }
}

function writeAnchor(childId: string, date: string | null): void {
  try {
    const key = `${ANCHOR_PREFIX}${childId}`
    if (!date) {
      localStorage.removeItem(key)
      return
    }
    localStorage.setItem(key, date.slice(0, 10))
  } catch {
    // ignore
  }
}

function readGapDays(childId: string): string[] {
  try {
    const raw = localStorage.getItem(`${GAP_DAYS_PREFIX}${childId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((d): d is string => typeof d === "string")
      : []
  } catch {
    return []
  }
}

function writeGapDays(childId: string, days: string[]): void {
  try {
    const key = `${GAP_DAYS_PREFIX}${childId}`
    if (days.length === 0) {
      localStorage.removeItem(key)
      return
    }
    localStorage.setItem(key, JSON.stringify([...new Set(days)].sort()))
  } catch {
    // ignore
  }
}

function inferGapDaysFromFreeze(
  today: string,
  lastStreakDate: string | null,
  freezeMissed: number,
): string[] {
  const last = lastStreakDate?.slice(0, 10) ?? null
  if (!last || freezeMissed <= 0) return []

  if (last < today) return gapDaysFromAnchor(last, today)

  const keys: string[] = []
  for (let i = 1; i <= freezeMissed; i++) {
    keys.push(addDaysToDateKey(today, -i))
  }
  return keys
}

function daysBetween(earlier: string, later: string): number {
  const a = new Date(`${earlier.slice(0, 10)}T12:00:00`)
  const b = new Date(`${later.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000))
}

/** Lưu các ngày gap (miss) giữa anchor và hôm nay. */
export function recordFreezeGapContext(
  childId: string,
  anchorDate: string,
  today = getVietnamTodayKey(),
): void {
  const anchor = anchorDate.slice(0, 10)
  if (anchor >= today) return
  const days = gapDaysFromAnchor(anchor, today)
  if (days.length === 0) return
  writeAnchor(childId, anchor)
  writeGapDays(childId, mergeGapDays(readGapDays(childId), days))
}

function inferEmptyWeekDaysBeforeToday(
  currentStreak: number,
  lastActiveDate: string | null,
  bestStreak: number,
  todayCompletedCount: number,
): string[] {
  const today = getVietnamTodayKey()
  const last = lastActiveDate?.slice(0, 10) ?? null
  if (!last || todayCompletedCount < 1) return []
  if (bestStreak <= currentStreak) return []
  if (!isSameDay(last, today)) return []

  const monday = getMondayKeyForWeek(today)
  const todayIdx = getVietnamWeekDayIndex(today)
  const streakKeys = new Set(getStreakCheckInDayKeys(currentStreak, last))
  const gaps: string[] = []
  for (let i = 0; i < todayIdx; i++) {
    const dayKey = addDaysToDateKey(monday, i)
    if (!streakKeys.has(dayKey)) gaps.push(dayKey)
  }
  return gaps
}

function inferFromPreviousLocalActive(
  previousLastActiveDate: string | null | undefined,
  today: string,
): string[] {
  const prev = previousLastActiveDate?.slice(0, 10) ?? null
  if (!prev || prev >= today) return []
  if (daysBetween(prev, today) <= 1) return []
  return gapDaysFromAnchor(prev, today)
}

function mergeGapDays(...lists: string[][]): string[] {
  return [...new Set(lists.flat())].sort()
}

function clearFreezeGapCache(childId: string): void {
  writeAnchor(childId, null)
  writeGapDays(childId, [])
}

/** Giữ anchor + danh sách ngày đóng băng — không mất sau check-in / reload. */
export function resolveFreezeGapContext(
  childId: string,
  streakStatus: string | undefined,
  lastStreakDate: string | null | undefined,
  missedDaysCoveredByFreeze = 0,
  freezeDaysUsed = 0,
  options: {
    currentStreak?: number
    bestStreak?: number
    todayCompletedCount?: number
    previousLastActiveDate?: string | null
  } = {},
): FreezeGapContext {
  const freezeMissed = Math.max(missedDaysCoveredByFreeze, freezeDaysUsed)
  const today = getVietnamTodayKey()
  const anchor = lastStreakDate?.slice(0, 10) ?? null
  const {
    currentStreak = 0,
    bestStreak = 0,
    todayCompletedCount = 0,
    previousLastActiveDate = null,
  } = options

  let gapAnchor = readAnchor(childId)
  let gapDays = readGapDays(childId)

  if (streakStatus === "Expired" || streakStatus === "Frozen") {
    if (anchor && anchor < today) {
      gapAnchor = anchor
      gapDays = gapDaysFromAnchor(anchor, today)
      writeAnchor(childId, gapAnchor)
      writeGapDays(childId, gapDays)
    }
    return { gapAnchorDate: gapAnchor, freezeGapDayKeys: gapDays }
  }

  if (streakStatus === "Reset") {
    return { gapAnchorDate: gapAnchor, freezeGapDayKeys: gapDays }
  }

  if (freezeMissed > 0) {
    const inferred = inferGapDaysFromFreeze(today, anchor, freezeMissed)
    if (gapAnchor && gapAnchor < today) {
      gapDays = mergeGapDays(gapDays, gapDaysFromAnchor(gapAnchor, today))
    } else if (inferred.length > 0) {
      const firstGap = inferred[0]
      gapAnchor = addDaysToDateKey(firstGap, -1)
      writeAnchor(childId, gapAnchor)
    }
    gapDays = mergeGapDays(gapDays, inferred)
    writeGapDays(childId, gapDays)
    return { gapAnchorDate: gapAnchor, freezeGapDayKeys: gapDays }
  }

  const keepGapOnRecover =
    streakStatus === "FreezeUsed" ||
    streakStatus === "ActiveToday" ||
    streakStatus === "AlreadyCheckedIn" ||
    streakStatus === "Started"

  if (keepGapOnRecover && gapDays.length > 0) {
    return { gapAnchorDate: gapAnchor, freezeGapDayKeys: gapDays }
  }

  const localGapDays = inferFromPreviousLocalActive(previousLastActiveDate, today)
  if (localGapDays.length > 0 && previousLastActiveDate) {
    recordFreezeGapContext(childId, previousLastActiveDate, today)
    gapAnchor = readAnchor(childId)
    gapDays = readGapDays(childId)
    if (gapDays.length > 0) {
      return { gapAnchorDate: gapAnchor, freezeGapDayKeys: gapDays }
    }
  }

  const weekGapDays = inferEmptyWeekDaysBeforeToday(
    currentStreak,
    anchor,
    bestStreak,
    todayCompletedCount,
  )
  if (weekGapDays.length > 0) {
    const weekAnchor = addDaysToDateKey(weekGapDays[0], -1)
    gapAnchor = weekAnchor
    gapDays = mergeGapDays(gapDays, weekGapDays)
    writeAnchor(childId, gapAnchor)
    writeGapDays(childId, gapDays)
    return { gapAnchorDate: gapAnchor, freezeGapDayKeys: gapDays }
  }

  if (
    (streakStatus === "Continued" || streakStatus === "Active") &&
    freezeMissed <= 0 &&
    gapDays.length === 0
  ) {
    clearFreezeGapCache(childId)
    return { gapAnchorDate: null, freezeGapDayKeys: [] }
  }

  if (gapDays.length > 0) {
    return { gapAnchorDate: gapAnchor, freezeGapDayKeys: gapDays }
  }

  return { gapAnchorDate: null, freezeGapDayKeys: [] }
}

/** @deprecated use resolveFreezeGapContext */
export function readStreakGapAnchor(childId: string): string | null {
  return readAnchor(childId)
}

/** @deprecated use resolveFreezeGapContext */
export function writeStreakGapAnchor(childId: string, date: string | null): void {
  writeAnchor(childId, date)
}

/** @deprecated use resolveFreezeGapContext */
export function resolveStreakGapAnchor(
  childId: string,
  streakStatus: string | undefined,
  lastStreakDate: string | null | undefined,
): string | null {
  return resolveFreezeGapContext(childId, streakStatus, lastStreakDate).gapAnchorDate
}

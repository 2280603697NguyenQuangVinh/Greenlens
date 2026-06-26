import { getVietnamTodayKey } from "@/utils/appDate"

import { requestStreakCheckInAfterDailyTask } from "./streakCheckIn"

const STORAGE_KEY = "gl_daily_activity_v1"

type DailyRecord = {
  date: string
  cameraCompleted: boolean
  quizCompleted: boolean
  gameCompleted: boolean
}

export type { DailyRecord }

function canonicalDateKey(key: string, record?: DailyRecord): string {
  const fromRecord = record?.date?.slice(0, 10)
  if (fromRecord && /^\d{4}-\d{2}-\d{2}$/.test(fromRecord)) return fromRecord
  const fromKey = key.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(fromKey)) return fromKey
  return getVietnamTodayKey()
}

function mergeDailyRecord(
  existing: DailyRecord | undefined,
  incoming: DailyRecord,
): DailyRecord {
  return {
    date: incoming.date?.slice(0, 10) ?? existing?.date ?? "",
    cameraCompleted: Boolean(existing?.cameraCompleted || incoming.cameraCompleted),
    quizCompleted: Boolean(existing?.quizCompleted || incoming.quizCompleted),
    gameCompleted: Boolean(existing?.gameCompleted || incoming.gameCompleted),
  }
}

/** Gộp record theo ngày VN — sửa key lệch do múi giờ / dữ liệu cũ. */
function normalizeDailyRecords(
  raw: Record<string, DailyRecord>,
): Record<string, DailyRecord> {
  const normalized: Record<string, DailyRecord> = {}

  for (const [key, record] of Object.entries(raw)) {
    const dayKey = canonicalDateKey(key, record)
    const merged = mergeDailyRecord(normalized[dayKey], {
      ...record,
      date: dayKey,
    })
    normalized[dayKey] = merged
  }

  return normalized
}

function findRecordForDayKey(
  all: Record<string, DailyRecord>,
  dayKey: string,
): DailyRecord | undefined {
  if (all[dayKey]) return all[dayKey]
  return Object.values(all).find((record) => record.date?.slice(0, 10) === dayKey)
}

function readTodayRecordFromAll(
  all: Record<string, DailyRecord>,
): DailyRecord | null {
  const today = getVietnamTodayKey()
  return findRecordForDayKey(all, today)
}

function readAll(): Record<string, DailyRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, DailyRecord>
    const normalized = normalizeDailyRecords(parsed)
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      writeAll(normalized)
    }
    return normalized
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, DailyRecord>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function ensureToday(): DailyRecord {
  const all = readAll()
  const key = getVietnamTodayKey()
  const existing = readTodayRecordFromAll(all)
  if (existing) {
    if (!all[key]) {
      all[key] = { ...existing, date: key }
      writeAll(all)
    }
    return all[key]
  }
  if (!all[key]) {
    all[key] = {
      date: key,
      cameraCompleted: false,
      quizCompleted: false,
      gameCompleted: false,
    }
    writeAll(all)
  }
  return all[key]
}

function markTaskComplete(
  field: "cameraCompleted" | "quizCompleted" | "gameCompleted",
): void {
  const all = readAll()
  const key = getVietnamTodayKey()
  const existing = readTodayRecordFromAll(all)
  const record = all[key] ?? existing ?? {
    date: key,
    cameraCompleted: false,
    quizCompleted: false,
    gameCompleted: false,
  }
  if (record[field]) return
  record[field] = true
  all[key] = record
  writeAll(all)
  requestStreakCheckInAfterDailyTask()
}

export function markDailyCameraComplete(): void {
  markTaskComplete("cameraCompleted")
}

export function markDailyQuizComplete(): void {
  markTaskComplete("quizCompleted")
}

export function markDailyGameComplete(): void {
  markTaskComplete("gameCompleted")
}

export function getTodayDailyActivity(): DailyRecord {
  return ensureToday()
}

export function readAllDailyRecords(): Record<string, DailyRecord> {
  return readAll()
}

export function findDailyRecordForDayKey(
  all: Record<string, DailyRecord>,
  dayKey: string,
): DailyRecord | undefined {
  return findRecordForDayKey(all, dayKey)
}

export function dayHadActivity(record: DailyRecord | undefined): boolean {
  if (!record) return false
  return record.cameraCompleted || record.quizCompleted || record.gameCompleted
}

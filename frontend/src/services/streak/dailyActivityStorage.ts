import { syncStreakAfterDailyActivity } from "./localStreakStorage"

const STORAGE_KEY = "gl_daily_activity_v1"

type DailyRecord = {
  date: string
  cameraCompleted: boolean
  quizCompleted: boolean
  gameCompleted: boolean
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function readAll(): Record<string, DailyRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, DailyRecord>
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, DailyRecord>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function ensureToday(): DailyRecord {
  const all = readAll()
  const key = todayKey()
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
  const key = todayKey()
  const record = all[key] ?? {
    date: key,
    cameraCompleted: false,
    quizCompleted: false,
    gameCompleted: false,
  }
  if (record[field]) return
  record[field] = true
  all[key] = record
  writeAll(all)
  syncStreakAfterDailyActivity()
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

const STORAGE_KEY = "gl_minigame_leaderboard_total_v1"

type TotalStore = Record<string, number>

function readStore(): TotalStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as TotalStore
  } catch {
    return {}
  }
}

function writeStore(store: TotalStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/** Tổng điểm xếp hạng (local) — cộng dồn mỗi lần chơi, không sync BE. */
export function getLeaderboardTotal(childId: string): number {
  if (!childId.trim()) return 0
  const value = readStore()[childId]
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

/**
 * Lần đầu gặp child: seed từ điểm API (kỷ lục cũ) để không tụt hạng khi bật tính năng.
 * Các lần sau chỉ cộng thêm qua `addLeaderboardRoundScore`.
 */
export function ensureLeaderboardTotalInitialized(
  childId: string,
  apiHighScore: number,
): number {
  if (!childId.trim()) return 0

  const store = readStore()
  if (Object.prototype.hasOwnProperty.call(store, childId)) {
    return getLeaderboardTotal(childId)
  }

  const initial = Math.max(0, Math.floor(apiHighScore))
  store[childId] = initial
  writeStore(store)
  return initial
}

export function addLeaderboardRoundScore(childId: string, roundScore: number): number {
  if (!childId.trim()) return 0

  const delta = Math.max(0, Math.floor(roundScore))
  if (delta <= 0) return getLeaderboardTotal(childId)

  const store = readStore()
  const current = typeof store[childId] === "number" ? Math.max(0, store[childId]) : 0
  const next = current + delta
  store[childId] = next
  writeStore(store)
  return next
}

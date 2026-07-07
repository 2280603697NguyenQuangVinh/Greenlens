import type { LeaderboardEntry } from "@/services/childProfile"
import {
  ensureLeaderboardTotalInitialized,
  getLeaderboardTotal,
} from "@/services/miniGame/leaderboardTotalStorage"

export function findUserRankInLeaderboard(
  entries: LeaderboardEntry[],
  childId: string,
): number | null {
  const row = entries.find((entry) => entry.childId === childId)
  return row?.rank ?? null
}

/** Gắn tổng điểm local cho user hiện tại và sắp xếp lại hạng (FE-only). */
export function applyLocalLeaderboardTotals(
  entries: LeaderboardEntry[],
  currentChildId: string,
): LeaderboardEntry[] {
  const childId = currentChildId.trim()
  if (!childId || entries.length === 0) return entries

  const apiRow = entries.find((entry) => entry.childId === childId)
  const localTotal = apiRow
    ? ensureLeaderboardTotalInitialized(childId, apiRow.miniGameHighScore)
    : getLeaderboardTotal(childId)

  const merged = entries.map((entry) =>
    entry.childId === childId
      ? { ...entry, miniGameHighScore: localTotal, isCurrentUser: true }
      : entry,
  )

  const sorted = [...merged].sort((a, b) => {
    if (b.miniGameHighScore !== a.miniGameHighScore) {
      return b.miniGameHighScore - a.miniGameHighScore
    }
    if (a.isCurrentUser !== b.isCurrentUser) {
      return a.isCurrentUser ? -1 : 1
    }
    return a.rank - b.rank
  })

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    isCurrentUser: entry.childId === childId,
  }))
}

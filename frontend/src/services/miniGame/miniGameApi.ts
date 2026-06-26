import { authorizedJsonRequest } from "@/services/backendHttp"

export type TrashSortItem = {
  itemId: string
  name: string
  category: string
  binColor: string
  iconUrl: string
  difficulty: string
}

export type TrashSortBin = {
  category: string
  binColor: string
  label: string
}

export type TrashSortItemsResponse = {
  items: TrashSortItem[]
  bins: TrashSortBin[]
}

export type SubmitTrashSortPayload = {
  childId: string
  correctCount: number
  wrongCount: number
  durationSeconds: number
  completedFromDailyActivity?: boolean
}

export type SubmitTrashSortResponse = {
  resultId: string
  childId: string
  gameType: string
  score: number
  correctCount: number
  wrongCount: number
  durationSeconds: number
  xpAwarded: number
  isPersonalBest: boolean
  unlockedBadges: string[]
  dailyActivityUpdated: boolean
  createdAt: string
}

export async function getTrashSortItems(): Promise<TrashSortItemsResponse> {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    return { items: [], bins: [] }
  }

  return authorizedJsonRequest<TrashSortItemsResponse>("/mini-games/trash-sort/items")
}

export async function submitTrashSortResult(
  payload: SubmitTrashSortPayload,
): Promise<SubmitTrashSortResponse> {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    const score = Math.max(0, payload.correctCount * 10 - payload.wrongCount * 5)
    const xpAwarded = Math.max(5, Math.floor(score / 2))
    return {
      resultId: `mock_result_${Date.now()}`,
      childId: payload.childId,
      gameType: "trash_sort",
      score,
      correctCount: payload.correctCount,
      wrongCount: payload.wrongCount,
      durationSeconds: payload.durationSeconds,
      xpAwarded,
      isPersonalBest: false,
      unlockedBadges: [],
      dailyActivityUpdated: payload.completedFromDailyActivity ?? false,
      createdAt: new Date().toISOString(),
    }
  }

  return authorizedJsonRequest<SubmitTrashSortResponse>("/mini-games/trash-sort/results", {
    method: "POST",
    body: JSON.stringify({
      childId: payload.childId,
      correctCount: payload.correctCount,
      wrongCount: payload.wrongCount,
      durationSeconds: payload.durationSeconds,
      completedFromDailyActivity: payload.completedFromDailyActivity ?? true,
    }),
  })
}

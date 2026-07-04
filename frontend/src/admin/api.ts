import { getAdminSession } from "@/admin/auth"
import { apiUrl } from "@/services/http"

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = getAdminSession()
  if (!session) throw new Error("Phiên admin đã hết hạn.")

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${session.token}`,
  }

  const res = await fetch(apiUrl(path), { ...init, headers })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      (body as { message?: string; detail?: string; title?: string }).message ||
      (body as { detail?: string }).detail ||
      (body as { title?: string }).title ||
      "Admin API failed.",
    )
  }

  return body as T
}

export const adminApi = {
  getOverview: () => adminRequest<any>("/admin/overview"),
  getChildren: (search = "", status = "") =>
    adminRequest<any>(`/admin/children?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`),
  getChild: (childId: string) => adminRequest<any>(`/admin/children/${encodeURIComponent(childId)}`),
  archiveChild: (childId: string) => adminRequest(`/admin/children/${encodeURIComponent(childId)}/archive`, { method: "POST" }),
  lockChild: (childId: string) => adminRequest(`/admin/children/${encodeURIComponent(childId)}/lock`, { method: "POST" }),
  unlockChild: (childId: string) => adminRequest(`/admin/children/${encodeURIComponent(childId)}/unlock`, { method: "POST" }),
  resetChildStreak: (childId: string) => adminRequest(`/admin/children/${encodeURIComponent(childId)}/streak/reset`, { method: "POST" }),
  adjustChildXp: (childId: string, xp: number) =>
    adminRequest(`/admin/children/${encodeURIComponent(childId)}/xp-adjust`, { method: "POST", body: JSON.stringify({ xp }) }),
  getQuizFallbacks: () => adminRequest<any>("/admin/quiz/fallbacks"),
  saveQuizFallback: (payload: unknown, fallbackKey?: string) =>
    adminRequest<any>(fallbackKey ? `/admin/quiz/fallbacks/${encodeURIComponent(fallbackKey)}` : "/admin/quiz/fallbacks", {
      method: fallbackKey ? "PUT" : "POST",
      body: JSON.stringify(payload),
    }),
  archiveQuizFallback: (fallbackKey: string) =>
    adminRequest(`/admin/quiz/fallbacks/${encodeURIComponent(fallbackKey)}/archive`, { method: "POST" }),
  getQuizPool: () => adminRequest<any>("/admin/quiz/pool"),
  refillQuizPool: () => adminRequest("/admin/quiz/pool/refill", { method: "POST" }),
  getAiCameraClassifications: () => adminRequest<any>("/admin/ai-camera/classifications"),
  getMiniGameItems: () => adminRequest<any>("/admin/mini-games/items"),
  saveMiniGameItem: (payload: unknown, itemId?: string) =>
    adminRequest<any>(itemId ? `/admin/mini-games/items/${encodeURIComponent(itemId)}` : "/admin/mini-games/items", {
      method: itemId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    }),
  archiveMiniGameItem: (itemId: string) =>
    adminRequest(`/admin/mini-games/items/${encodeURIComponent(itemId)}/archive`, { method: "POST" }),
}

import { getAdminSession } from "@/admin/auth"
import { apiUrl } from "@/services/http"

function formatAdminApiError(status: number, body: unknown): string {
  const payload = body as { message?: string; detail?: string; title?: string }
  if (payload.message?.trim()) return payload.message.trim()
  if (payload.detail?.trim()) return payload.detail.trim()
  if (payload.title?.trim()) return payload.title.trim()

  if (status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
  if (status === 403) return "Tài khoản không có quyền quản trị."
  if (status === 404) return "Không tìm thấy dữ liệu yêu cầu."
  if (status >= 500) return "Máy chủ đang gặp sự cố. Hãy thử lại sau."
  return "Không tải được dữ liệu. Kiểm tra kết nối API rồi thử lại."
}

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
    throw new Error(formatAdminApiError(res.status, body))
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

import type { AvatarConfig } from "@/utils/types"
import { clearChildId, setChildId } from "@/services/childProfileStorage"
import { API_BASE } from "@/services/http"

export interface UserProfile {
  badgeId: string
  characterName?: string
  gender: number
  skin: number
  hair: number
  eyes: number
  outfit: number
  xp: number
  level: number
  streak: number
  dailyScansCompleted: number
  dailyScansTarget: number
  recentActivity: { icon: string; action: string; xpLabel: string; timeAgo: string }[]
}

export interface AuthResult {
  token: string
  profile: UserProfile
}

export interface ClassificationResult {
  label: string
  emoji: string
  category: string
  categoryKey: string
  binColor: string
  categoryColor: string
  backgroundColor: string
  guide: string
  confidence: number
  xpEarned: number
}

export interface QuizQuestion {
  id: number
  question: string
  emoji: string
  options: string[]
  correctIndex: number
  tip: string
}

const MOCK_TOKEN = "mock-greenlens-token"

const QUIZ_BY_CATEGORY: Record<string, QuizQuestion[]> = {
  recycle: [
    {
      id: 1,
      question: "Chai nhựa nên bỏ vào thùng nào?",
      emoji: "🍶",
      options: ["Thùng tái chế", "Thùng hữu cơ", "Thùng rác nguy hại"],
      correctIndex: 0,
      tip: "Nhựa PET có thể tái chế thành sản phẩm mới.",
    },
    {
      id: 2,
      question: "Giấy bẩn dầu mỡ xử lý thế nào?",
      emoji: "🧻",
      options: ["Vứt thùng tái chế", "Vứt rác thường", "Đốt ngay"],
      correctIndex: 1,
      tip: "Giấy dính dầu mỡ thường không tái chế được.",
    },
    {
      id: 3,
      question: "Vì sao cần phân loại rác từ sớm?",
      emoji: "🌍",
      options: ["Để giảm rác chôn lấp", "Cho vui", "Không cần thiết"],
      correctIndex: 0,
      tip: "Phân loại giúp tiết kiệm tài nguyên và bảo vệ môi trường.",
    },
  ],
}

function defaultProfile(badgeId: string, avatar?: AvatarConfig): UserProfile {
  return {
    badgeId,
    characterName: avatar?.characterName,
    gender: avatar?.gender ?? 0,
    skin: avatar?.skin ?? 0,
    hair: avatar?.hair ?? 1,
    eyes: avatar?.eyes ?? 0,
    outfit: avatar?.outfit ?? 1,
    xp: 120,
    level: 2,
    streak: 3,
    dailyScansCompleted: 0,
    dailyScansTarget: 3,
    recentActivity: [],
  }
}

function normalizeProfile(profile: UserProfile): UserProfile {
  const level = Math.max(1, Math.floor(profile.xp / 100) + 1)
  return { ...profile, level }
}

function updateStoredProfile(updater: (current: UserProfile) => UserProfile): UserProfile {
  const current = loadStoredProfile() ?? defaultProfile("123456")
  const next = normalizeProfile(updater(current))
  saveSession(sessionStorage.getItem("gl_token") || MOCK_TOKEN, next)
  return next
}

async function mockRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const body = init.body ? JSON.parse(String(init.body)) : {}

  if (path === "/api/auth/register") {
    const badgeId = String(body.badgeId ?? Math.floor(100000 + Math.random() * 900000))
    const profile = defaultProfile(badgeId, body.avatar)
    return { token: MOCK_TOKEN, profile } as T
  }

  if (path === "/api/auth/login") {
    const badgeId = String(body.badgeId ?? "123456")
    const profile = loadStoredProfile() ?? defaultProfile(badgeId)
    return { token: MOCK_TOKEN, profile } as T
  }

  if (path === "/api/scanner/analyze") {
    const categoryKey = "recycle"
    const result: ClassificationResult = {
      label: "Plastic Bottle",
      emoji: "🍶",
      category: "Tái chế",
      categoryKey,
      binColor: "#2563EB",
      categoryColor: "#1D4ED8",
      backgroundColor: "#EFF6FF",
      guide: "Đây là chai nhựa có thể tái chế. Hãy rửa sạch và bỏ vào thùng tái chế màu xanh.",
      confidence: 97,
      xpEarned: 15,
    }
    const profile = updateStoredProfile((p) => ({
      ...p,
      xp: p.xp + result.xpEarned,
      dailyScansCompleted: Math.min(p.dailyScansTarget, p.dailyScansCompleted + 1),
      recentActivity: [
        { icon: "📸", action: "Scanned plastic bottle", xpLabel: "+15 XP", timeAgo: "just now" },
        ...p.recentActivity.slice(0, 4),
      ],
    }))
    return { result, profile } as T
  }

  if (path.startsWith("/api/quiz/")) {
    return (QUIZ_BY_CATEGORY.recycle ?? []) as T
  }

  if (path === "/api/quiz/complete") {
    const correct = Number(body.correctCount ?? 0)
    const total = Number(body.totalCount ?? 0)
    const xpEarned = Math.max(10, correct * 10 + Math.max(0, total - correct) * 3)
    const profile = updateStoredProfile((p) => ({
      ...p,
      xp: p.xp + xpEarned,
      recentActivity: [
        { icon: "🧠", action: "Completed eco quiz", xpLabel: `+${xpEarned} XP`, timeAgo: "just now" },
        ...p.recentActivity.slice(0, 4),
      ],
    }))
    return { xpEarned, profile } as T
  }

  if (path === "/api/game/result") {
    const score = Number(body.score ?? 0)
    const xpEarned = Math.max(5, Math.floor(score / 2))
    const profile = updateStoredProfile((p) => ({
      ...p,
      xp: p.xp + xpEarned,
      recentActivity: [
        { icon: "♻️", action: "Played sort game", xpLabel: `+${xpEarned} XP`, timeAgo: "just now" },
        ...p.recentActivity.slice(0, 4),
      ],
    }))
    return { xpEarned, profile } as T
  }

  if (path === "/api/tts/speak") {
    return { audioUrl: "" } as T
  }

  if (path === "/api/user/profile") {
    return (loadStoredProfile() ?? defaultProfile("123456")) as T
  }

  throw new Error(`Mock API route not implemented: ${path}`)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    return mockRequest<T>(path, init)
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  }
  const token = sessionStorage.getItem("gl_token")
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }))
      const record = body as { message?: string; detail?: string; title?: string }
      throw new Error(
        record.message?.trim() ||
          record.detail?.trim() ||
          record.title?.trim() ||
          `HTTP ${res.status}`,
      )
    }
    return res.json() as Promise<T>
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error("Không kết nối được máy chủ.")
  }
}

export const api = {
  register: (badgeId: string, avatar: AvatarConfig) =>
    request<AuthResult>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ badgeId, avatar }),
    }),

  login: (badgeId: string) =>
    request<AuthResult>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ badgeId }),
    }),

  analyze: (base64Image: string) =>
    request<{ result: ClassificationResult; profile: UserProfile | null }>(
      "/api/scanner/analyze",
      { method: "POST", body: JSON.stringify({ base64Image }) },
    ),

  getQuiz: (category: string) =>
    request<QuizQuestion[]>(`/api/quiz/${encodeURIComponent(category)}`),

  completeQuiz: (correctCount: number, totalCount: number) =>
    request<{ xpEarned: number; profile: UserProfile }>("/api/quiz/complete", {
      method: "POST",
      body: JSON.stringify({ correctCount, totalCount }),
    }),

  submitGame: (userId: string, score: number) =>
    request<{ xpEarned: number; profile: UserProfile | null }>("/api/game/result", {
      method: "POST",
      body: JSON.stringify({ userId, score }),
    }),

  speak: (text: string) =>
    request<{ audioUrl: string }>("/api/tts/speak", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  getProfile: () => request<UserProfile>("/api/user/profile"),
}

export function saveSession(token: string, profile: UserProfile) {
  sessionStorage.setItem("gl_token", token)
  sessionStorage.setItem("gl_badgeId", profile.badgeId)
  sessionStorage.setItem("gl_profile", JSON.stringify(profile))
  if (profile.badgeId) setChildId(profile.badgeId)
}

export function loadStoredProfile(): UserProfile | null {
  const raw = sessionStorage.getItem("gl_profile")
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

export function clearSession() {
  sessionStorage.removeItem("gl_token")
  sessionStorage.removeItem("gl_badgeId")
  sessionStorage.removeItem("gl_profile")
  clearChildId()
}

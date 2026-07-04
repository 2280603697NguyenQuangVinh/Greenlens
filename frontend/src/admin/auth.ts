import { apiUrl } from "@/services/http"

const ADMIN_TOKEN_KEY = "gl_admin_token"
const ADMIN_USER_KEY = "gl_admin_user"

type AuthTokenResponse = {
  idToken?: string
  accessToken?: string
  bearerToken?: string
  username?: string
}

export type AdminSession = {
  token: string
  username: string
  groups: string[]
}

export function getAdminSession(): AdminSession | null {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  const raw = localStorage.getItem(ADMIN_USER_KEY)
  if (!token || !raw) return null

  try {
    const parsed = JSON.parse(raw) as { username: string; groups: string[] }
    return { token, username: parsed.username, groups: parsed.groups ?? [] }
  } catch {
    return null
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
}

export async function loginAdmin(username: string, password: string): Promise<AdminSession> {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((body as { message?: string }).message || "Không đăng nhập được admin.")
  }

  const auth = body as AuthTokenResponse
  const token = auth.idToken?.trim() || auth.bearerToken?.trim() || auth.accessToken?.trim()
  if (!token) throw new Error("Backend không trả bearer token.")

  const groups = readGroupsFromJwt(token)
  if (!groups.some((group) => group.toLowerCase() === "admin")) {
    throw new Error("Tài khoản này không có quyền admin.")
  }

  const session = {
    token,
    username: auth.username?.trim() || username.trim(),
    groups,
  }

  localStorage.setItem(ADMIN_TOKEN_KEY, token)
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify({ username: session.username, groups }))
  return session
}

function readGroupsFromJwt(token: string): string[] {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return []
    const payload = JSON.parse(atob(base64UrlToBase64(parts[1]))) as {
      "cognito:groups"?: string[] | string
    }
    const groups = payload["cognito:groups"]
    if (Array.isArray(groups)) return groups.filter(Boolean)
    if (typeof groups === "string") {
      if (groups.startsWith("[")) {
        const parsed = JSON.parse(groups)
        return Array.isArray(parsed) ? parsed.filter(Boolean) : []
      }

      return groups.split(",").map((item) => item.trim()).filter(Boolean)
    }
  } catch {
    return []
  }

  return []
}

function base64UrlToBase64(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  return normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4)
}

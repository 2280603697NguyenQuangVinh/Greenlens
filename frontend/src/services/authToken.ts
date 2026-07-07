import {
  getAuthUsername,
  getRefreshToken,
  getToken,
  removeAuthUsername,
  removeRefreshToken,
  removeToken,
  setAuthUsername,
  setRefreshToken,
  setToken,
} from "@/services/tokenStorage"
import { ensureSessionBearerToken, tryRefreshBearerToken } from "@/services/sessionAuth"

const SESSION_TOKEN_KEY = "gl_token"

export function getAuthToken(): string | null {
  const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY)
  if (sessionToken?.trim()) return sessionToken.trim()

  const storedToken = getToken()
  if (storedToken?.trim()) {
    sessionStorage.setItem(SESSION_TOKEN_KEY, storedToken.trim())
    return storedToken.trim()
  }

  return null
}

export function setAuthToken(token: string): void {
  const trimmed = token.trim()
  sessionStorage.setItem(SESSION_TOKEN_KEY, trimmed)
  setToken(trimmed)
}

export function clearAuthToken(): void {
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
  removeToken()
  removeRefreshToken()
  removeAuthUsername()
}

export function setAuthSession(
  token: string,
  refreshToken?: string | null,
  username?: string | null,
): void {
  setAuthToken(token)
  if (refreshToken?.trim()) {
    setRefreshToken(refreshToken.trim())
  }
  if (username?.trim()) {
    setAuthUsername(username.trim())
  }
}

export function getStoredRefreshToken(): string | null {
  const value = getRefreshToken()
  return value?.trim() || null
}

export function getStoredAuthUsername(): string | null {
  const value = getAuthUsername()
  return value?.trim() || null
}

export async function ensureBearerToken(): Promise<string> {
  return ensureSessionBearerToken()
}

export { tryRefreshBearerToken }

export function mapAuthErrorMessage(message: string, status: number): string {
  const lower = message.toLowerCase()

  if (status === 401 || lower.includes("unauthorized") || lower.includes("token")) {
    return "Phiên đăng nhập đã hết hạn. Hãy tạo lại nhân vật nhé!"
  }

  if (status === 403 || lower.includes("forbidden") || lower.includes("quota")) {
    return "Bạn đã dùng hết lượt quét hôm nay. Hãy thử lại vào ngày mai nhé!"
  }

  if (status === 429 || lower.includes("rate") || lower.includes("too many")) {
    return "Hệ thống đang bận. Hãy đợi một chút rồi thử lại nhé!"
  }

  return message.trim() || "Đã có lỗi xảy ra. Hãy thử lại nhé!"
}

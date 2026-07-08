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

  if (
    lower.includes("daily limit") ||
    lower.includes("quota exceeded") ||
    lower.includes("quota reached") ||
    lower.includes("used hết lượt") ||
    lower.includes("hết lượt")
  ) {
    return "Bạn đã dùng hết lượt quét hôm nay. Hãy thử lại vào ngày mai nhé!"
  }

  if (lower.includes("minute limit") || lower.includes("rate") || lower.includes("too many")) {
    return "Con thao tác hơi nhanh rồi. Đợi một chút rồi thử lại nhé!"
  }

  if (status === 403 || lower.includes("forbidden") || lower.includes("access denied")) {
    return "Phiên đăng nhập không hợp lệ với nhân vật này. Hãy đăng nhập lại hoặc tạo lại nhân vật nhé!"
  }

  if (status === 429) {
    return "Hệ thống đang giới hạn tần suất. Hãy thử lại sau ít phút nhé!"
  }

  return message.trim() || "Đã có lỗi xảy ra. Hãy thử lại nhé!"
}

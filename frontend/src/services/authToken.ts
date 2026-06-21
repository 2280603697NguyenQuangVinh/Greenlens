import { getToken } from "@/services/tokenStorage"

const SESSION_TOKEN_KEY = "gl_token"

export function getAuthToken(): string | null {
  const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY)
  if (sessionToken?.trim()) return sessionToken.trim()

  const storedToken = getToken()
  if (storedToken?.trim()) return storedToken.trim()

  return null
}

export function setAuthToken(token: string): void {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
}

export async function ensureBearerToken(): Promise<string> {
  const token = getAuthToken()
  if (token) return token

  throw new Error("Bạn cần tạo nhân vật trước khi tiếp tục.")
}

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

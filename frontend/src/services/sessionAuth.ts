import { getToken, setToken } from "@/services/tokenStorage"
import {
  getChildId,
  getStoredCognitoSub,
  setStoredCognitoSub,
} from "@/services/childProfileStorage"
import { apiUrl } from "@/services/http"
import { getStoredAuthUsername, getStoredRefreshToken } from "@/services/authToken"

const SESSION_TOKEN_KEY = "gl_token"
const DEV_LOGIN_PATH = apiUrl("/auth/dev-login")
const REFRESH_PATH = apiUrl("/auth/refresh")
const LOCAL_PROFILE_KEY = "gl_profile_local"
const MOCK_TOKEN = "mock-greenlens-token"

type AuthTokenResponse = {
  idToken?: string
  accessToken?: string
  bearerToken?: string
  refreshToken?: string
  username?: string
}

function shouldUseDevLogin(): boolean {
  return !import.meta.env.VITE_API_URL?.trim()
}

function readSessionToken(): string | null {
  const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY)
  if (sessionToken?.trim()) return sessionToken.trim()

  const storedToken = getToken()
  if (storedToken?.trim()) {
    sessionStorage.setItem(SESSION_TOKEN_KEY, storedToken.trim())
    return storedToken.trim()
  }

  return null
}

function writeSessionToken(token: string): void {
  const trimmed = token.trim()
  sessionStorage.setItem(SESSION_TOKEN_KEY, trimmed)
  setToken(trimmed)
}

function extractBearerToken(auth: AuthTokenResponse): string | null {
  return (
    auth.idToken?.trim() ||
    auth.bearerToken?.trim() ||
    auth.accessToken?.trim() ||
    null
  )
}

function readCognitoSubFromLocalProfile(): string | null {
  const raw = localStorage.getItem(LOCAL_PROFILE_KEY)
  if (!raw) return null
  try {
    const profile = JSON.parse(raw) as { cognitoSub?: string }
    return profile.cognitoSub?.trim() || null
  } catch {
    return null
  }
}

function persistCognitoSubInLocalProfile(cognitoSub: string): void {
  const raw = localStorage.getItem(LOCAL_PROFILE_KEY)
  if (!raw) return
  try {
    const profile = JSON.parse(raw) as Record<string, unknown>
    profile.cognitoSub = cognitoSub
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // ignore corrupt cache
  }
}

export function collectCognitoSubCandidates(childId: string): string[] {
  const seen = new Set<string>()
  const candidates: string[] = []

  const push = (value: string | null | undefined) => {
    const trimmed = value?.trim()
    if (!trimmed || seen.has(trimmed)) return
    seen.add(trimmed)
    candidates.push(trimmed)
  }

  push(getStoredCognitoSub())
  push(readCognitoSubFromLocalProfile())
  push(`local-cognito-sub-${childId}`)

  return candidates
}

async function fetchDevLoginToken(cognitoSub: string): Promise<string> {
  const res = await fetch(DEV_LOGIN_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cognitoSub }),
  })

  if (!res.ok) {
    throw new Error("dev-login failed")
  }

  const auth = (await res.json()) as AuthTokenResponse
  const token = extractBearerToken(auth)
  if (!token) {
    throw new Error("dev-login missing token")
  }
  return token
}

async function refreshProductionToken(
  refreshToken: string,
  username: string,
): Promise<string | null> {
  try {
    const res = await fetch(REFRESH_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken, username }),
    })

    if (!res.ok) {
      return null
    }

    const auth = (await res.json()) as AuthTokenResponse
    const token = extractBearerToken(auth)
    if (!token) {
      return null
    }

    writeSessionToken(token)
    return token
  } catch {
    return null
  }
}

async function verifyChildProfileAccess(
  childId: string,
  token: string,
): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(`/child-profiles/${childId}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
  }
}

/** Obtain Bearer token — reuse cached token or dev-login with known cognitoSub candidates. */
export async function tryRefreshBearerToken(): Promise<string | null> {
  const existing = readSessionToken()
  if (existing) return existing

  if (import.meta.env.VITE_USE_MOCK === "true") {
    writeSessionToken(MOCK_TOKEN)
    return MOCK_TOKEN
  }

  if (!shouldUseDevLogin()) {
    const refreshToken = getStoredRefreshToken()
    const username = getStoredAuthUsername()
    if (refreshToken && username) {
      const refreshed = await refreshProductionToken(refreshToken, username)
      if (refreshed) return refreshed
    }
    return null
  }

  const childId = getChildId()
  if (!childId) return null

  for (const cognitoSub of collectCognitoSubCandidates(childId)) {
    try {
      const token = await fetchDevLoginToken(cognitoSub)
      const verified = await verifyChildProfileAccess(childId, token)
      if (!verified) continue

      writeSessionToken(token)
      setStoredCognitoSub(cognitoSub)
      persistCognitoSubInLocalProfile(cognitoSub)
      return token
    } catch {
      // try next candidate
    }
  }

  return null
}

export async function ensureSessionBearerToken(): Promise<string> {
  const token = await tryRefreshBearerToken()
  if (token) return token
  throw new Error("Bạn cần tạo nhân vật trước khi tiếp tục.")
}

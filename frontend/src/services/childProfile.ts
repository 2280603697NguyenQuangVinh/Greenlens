import {
  toChildProfilePayload,
  childProfileResponseToUserProfile,
  type ChildProfileResponse,
} from "@/utils/avatarMapper"
import type { AvatarConfig } from "@/utils/types"
import { ApiError, NetworkError, ValidationError } from "@/services/errors"
import { apiUrl } from "@/services/http"
import { getAuthToken, mapAuthErrorMessage, setAuthSession, setAuthToken } from "@/services/authToken"
import { tryRefreshBearerToken } from "@/services/sessionAuth"
import {
  getChildId,
  setStoredCognitoSub,
} from "@/services/childProfileStorage"
import {
  loadSavedProfile,
  loadStoredProfile,
  resumeProfileSession,
  saveSession,
  type UserProfile,
} from "@/services/greenLens"

export { ApiError, NetworkError, ValidationError }

const CHILD_PROFILES_PATH = apiUrl("/child-profiles")
const DEV_LOGIN_PATH = apiUrl("/auth/dev-login")
const REGISTER_CHILD_PATH = apiUrl("/auth/register-child")

const MOCK_TOKEN = "mock-greenlens-token"

type AuthTokenResponse = {
  idToken?: string
  accessToken?: string
  bearerToken?: string
  refreshToken?: string
  username?: string
}

type RegisterChildApiResponse = {
  auth: AuthTokenResponse
  profile: ChildProfileResponse
}

export type ChildProfileSetupResult = {
  token: string
  profile: ChildProfileResponse
}

export type LeaderboardEntry = {
  rank: number
  childId: string
  name: string
  miniGameHighScore: number
  isCurrentUser: boolean
}

async function readApiErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}))
  const record = body as { message?: string; detail?: string; title?: string }
  return (
    record.message?.trim() ||
    record.detail?.trim() ||
    record.title?.trim() ||
    res.statusText ||
    fallback
  )
}

function buildChildUsername(characterName: string): string {
  const slug = characterName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${slug || "greenlens"}-${suffix}`
}

function shouldUseDevAuth(): boolean {
  return !import.meta.env.VITE_API_URL?.trim()
}

function extractBearerToken(auth: AuthTokenResponse): string | null {
  return (
    auth.idToken?.trim() ||
    auth.bearerToken?.trim() ||
    auth.accessToken?.trim() ||
    null
  )
}

export function validateCharacterName(name: string): string | null {
  if (!name.trim()) {
    return "Vui lòng nhập tên nhân vật"
  }
  return null
}

async function mockSetupChildProfile(
  cfg: AvatarConfig,
  characterName: string,
): Promise<ChildProfileSetupResult> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  const payload = toChildProfilePayload(cfg, characterName)
  return {
    token: MOCK_TOKEN,
    profile: {
      childId: `child_${crypto.randomUUID().replace(/-/g, "")}`,
      characterName: payload.characterName,
      gender: payload.gender,
      hair: payload.hair,
      eyes: payload.eyes,
      outfit: payload.outfit,
      xp: 0,
      level: 0,
      streak: 0,
      badges: [],
      rewards: [],
    },
  }
}

async function fetchDevLoginToken(cognitoSub: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(DEV_LOGIN_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cognitoSub }),
    })
  } catch {
    throw new NetworkError("Không có kết nối mạng. Hãy thử lại sau nhé!")
  }

  if (!res.ok) {
    const raw = await readApiErrorMessage(
      res,
      "Không tạo được hồ sơ nhân vật. Hãy thử lại nhé!",
    )
    throw new ApiError(mapAuthErrorMessage(raw, res.status))
  }

  const auth = (await res.json()) as AuthTokenResponse
  const token = extractBearerToken(auth)
  if (!token) {
    throw new ApiError("Máy chủ không trả về token đăng nhập.")
  }
  return token
}

async function ensureOnboardingToken(characterName: string): Promise<string> {
  const existing = getAuthToken()
  if (existing) return existing

  const cognitoSub = buildChildUsername(characterName)
  const token = await fetchDevLoginToken(cognitoSub)
  setAuthToken(token)
  setStoredCognitoSub(cognitoSub)
  return token
}

async function registerChildWithAuth(
  cfg: AvatarConfig,
  characterName: string,
): Promise<ChildProfileSetupResult> {
  const username = buildChildUsername(characterName)
  const body = {
    username,
    displayName: characterName.trim(),
    characterName: characterName.trim(),
    ...toChildProfilePayload(cfg, characterName),
  }

  let res: Response
  try {
    res = await fetch(REGISTER_CHILD_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new NetworkError("Không có kết nối mạng. Hãy thử lại sau nhé!")
  }

  if (!res.ok) {
    const raw = await readApiErrorMessage(
      res,
      "Không tạo được hồ sơ nhân vật. Hãy thử lại nhé!",
    )
    throw new ApiError(mapAuthErrorMessage(raw, res.status))
  }

  const payload = (await res.json()) as RegisterChildApiResponse
  const token = extractBearerToken(payload.auth)
  if (!token) {
    throw new ApiError("Máy chủ không trả về token đăng nhập.")
  }

  setAuthSession(token, payload.auth.refreshToken, payload.auth.username || username)
  if (payload.profile.cognitoSub?.trim()) {
    setStoredCognitoSub(payload.profile.cognitoSub.trim())
  }

  return {
    token,
    profile: payload.profile,
  }
}

/** Restore session after reload when childId is already in localStorage. */
export async function restoreChildSession(): Promise<UserProfile | null> {
  const childId = getChildId()
  if (!childId) return null

  let profile = loadStoredProfile() ?? loadSavedProfile()
  const token = await tryRefreshBearerToken()

  if (import.meta.env.VITE_USE_MOCK === "true") {
    if (profile && token) {
      saveSession(token, profile)
    }
    return profile
  }

  if (token) {
    try {
      const res = await fetch(apiUrl(`/child-profiles/${childId}`), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const backendProfile = (await res.json()) as ChildProfileResponse
        profile = childProfileResponseToUserProfile(backendProfile)
        if (backendProfile.cognitoSub?.trim()) {
          setStoredCognitoSub(backendProfile.cognitoSub.trim())
        }
        saveSession(token, profile)
        return profile
      }
    } catch {
      // Fall back to cached profile for offline / dev reload.
    }
  }

  if (profile) {
    resumeProfileSession(profile, token)
  }

  return profile
}

/** Backend: GET /child-profiles/{childId} */
export async function getChildProfileById(
  childId: string,
  token?: string,
): Promise<ChildProfileResponse> {
  const bearerToken = token ?? getAuthToken()
  if (!bearerToken) {
    throw new ApiError("Bạn cần tạo nhân vật trước khi tiếp tục.")
  }

  let res: Response
  try {
    res = await fetch(apiUrl(`/child-profiles/${childId}`), {
      headers: { Authorization: `Bearer ${bearerToken}` },
    })
  } catch {
    throw new NetworkError("Không có kết nối mạng. Hãy thử lại sau nhé!")
  }

  if (!res.ok) {
    const raw = await readApiErrorMessage(res, "Không tải được hồ sơ nhân vật.")
    throw new ApiError(mapAuthErrorMessage(raw, res.status))
  }

  return res.json() as Promise<ChildProfileResponse>
}

/** Backend: GET /child-profiles/leaderboard */
export async function getChildProfileLeaderboard(
  currentChildId?: string,
  limit = 10,
  token?: string,
): Promise<LeaderboardEntry[]> {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    const profile = loadStoredProfile() ?? loadSavedProfile()
    if (!profile) return []

    return [
      {
        rank: 1,
        childId: profile.badgeId,
        name: profile.characterName?.trim() || "Bạn",
        miniGameHighScore: 0,
        isCurrentUser: true,
      },
    ]
  }

  let bearerToken = token ?? getAuthToken()
  if (!bearerToken) {
    bearerToken = await tryRefreshBearerToken()
  }
  if (!bearerToken) {
    throw new ApiError("Bạn cần tạo nhân vật trước khi tiếp tục.")
  }

  const params = new URLSearchParams()
  params.set("limit", String(Math.max(1, Math.min(limit, 50))))
  if (currentChildId?.trim()) {
    params.set("currentChildId", currentChildId.trim())
  }

  let res: Response
  try {
    res = await fetch(apiUrl(`/child-profiles/leaderboard?${params.toString()}`), {
      headers: { Authorization: `Bearer ${bearerToken}` },
    })
  } catch {
    throw new NetworkError("Không có kết nối mạng. Hãy thử lại sau nhé!")
  }

  if (!res.ok) {
    const raw = await readApiErrorMessage(res, "Không tải được bảng xếp hạng.")
    throw new ApiError(mapAuthErrorMessage(raw, res.status))
  }

  return res.json() as Promise<LeaderboardEntry[]>
}

/** Backend: POST /child-profiles — tạo hồ sơ trẻ (cần Bearer token). */
export async function createChildProfile(
  cfg: AvatarConfig,
  characterName: string,
  token?: string,
): Promise<ChildProfileResponse> {
  const validationError = validateCharacterName(characterName)
  if (validationError) {
    throw new ValidationError(validationError)
  }

  const bearerToken = token ?? getAuthToken()
  if (!bearerToken) {
    throw new ApiError("Bạn cần tạo nhân vật trước khi tiếp tục.")
  }

  const body = toChildProfilePayload(cfg, characterName)

  let res: Response
  try {
    res = await fetch(CHILD_PROFILES_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new NetworkError("Không có kết nối mạng. Hãy thử lại sau nhé!")
  }

  if (!res.ok) {
    const raw = await readApiErrorMessage(
      res,
      "Không tạo được hồ sơ nhân vật. Hãy thử lại nhé!",
    )
    throw new ApiError(mapAuthErrorMessage(raw, res.status))
  }

  return res.json() as Promise<ChildProfileResponse>
}

/**
 * Character Creation flow:
 * - local/dev: dev-login -> POST /child-profiles
 * - deployed env: POST /auth/register-child
 * Uses in-browser mock when VITE_USE_MOCK=true.
 */
export async function setupChildProfile(
  cfg: AvatarConfig,
  characterName: string,
): Promise<ChildProfileSetupResult> {
  const validationError = validateCharacterName(characterName)
  if (validationError) {
    throw new ValidationError(validationError)
  }

  if (import.meta.env.VITE_USE_MOCK === "true") {
    const result = await mockSetupChildProfile(cfg, characterName)
    setStoredCognitoSub(buildChildUsername(characterName))
    return result
  }

  if (!shouldUseDevAuth()) {
    return registerChildWithAuth(cfg, characterName)
  }

  const token = await ensureOnboardingToken(characterName)
  const profile = await createChildProfile(cfg, characterName, token)
  return { token, profile }
}

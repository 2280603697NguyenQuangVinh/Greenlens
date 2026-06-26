const CHILD_ID_KEY = "childId"
const SESSION_BADGE_KEY = "gl_badgeId"
const SESSION_PROFILE_KEY = "gl_profile"
const LOCAL_PROFILE_KEY = "gl_profile_local"
const LOCAL_COGNITO_SUB_KEY = "gl_cognito_sub"
const LOGGED_OUT_KEY = "gl_logged_out"

function readBadgeIdFromSession(): string | null {
  const badgeId = sessionStorage.getItem(SESSION_BADGE_KEY)
  if (badgeId) return badgeId

  const rawProfile = sessionStorage.getItem(SESSION_PROFILE_KEY)
  if (!rawProfile) return null

  try {
    const profile = JSON.parse(rawProfile) as { badgeId?: string }
    return profile.badgeId ?? null
  } catch {
    return null
  }
}

export function setChildId(childId: string): void {
  localStorage.setItem(CHILD_ID_KEY, childId)
  sessionStorage.setItem(SESSION_BADGE_KEY, childId)
}

export function getChildId(): string | null {
  const stored = localStorage.getItem(CHILD_ID_KEY)
  if (stored) return stored

  const fromSession = readBadgeIdFromSession()
  if (fromSession) {
    localStorage.setItem(CHILD_ID_KEY, fromSession)
    return fromSession
  }

  return null
}

export function clearChildId(): void {
  localStorage.removeItem(CHILD_ID_KEY)
  sessionStorage.removeItem(SESSION_BADGE_KEY)
}

export function setStoredCognitoSub(cognitoSub: string): void {
  localStorage.setItem(LOCAL_COGNITO_SUB_KEY, cognitoSub.trim())
}

export function getStoredCognitoSub(): string | null {
  const value = localStorage.getItem(LOCAL_COGNITO_SUB_KEY)
  return value?.trim() || null
}

export function clearStoredCognitoSub(): void {
  localStorage.removeItem(LOCAL_COGNITO_SUB_KEY)
}

export function saveLocalProfileJson(profileJson: string): void {
  localStorage.setItem(LOCAL_PROFILE_KEY, profileJson)
}

export function loadLocalProfileJson(): string | null {
  return localStorage.getItem(LOCAL_PROFILE_KEY)
}

export function clearLocalProfile(): void {
  localStorage.removeItem(LOCAL_PROFILE_KEY)
}

export function hasSavedChild(): boolean {
  return Boolean(getChildId() && loadLocalProfileJson())
}

export function markSessionActive(): void {
  sessionStorage.removeItem(LOGGED_OUT_KEY)
}

export function markLoggedOut(): void {
  sessionStorage.setItem(LOGGED_OUT_KEY, "true")
}

export function isLoggedOut(): boolean {
  return sessionStorage.getItem(LOGGED_OUT_KEY) === "true"
}

/** Có phiên đang đăng nhập — tự vào app khi mở lại (trừ sau khi đăng xuất). */
export function hasActiveSession(): boolean {
  if (isLoggedOut()) return false
  if (sessionStorage.getItem(SESSION_PROFILE_KEY)) return true
  return Boolean(getChildId() && loadLocalProfileJson())
}

/** @deprecated Use hasActiveSession or hasSavedChild */
export function hasChildProfile(): boolean {
  return hasActiveSession()
}

export function logoutSession(): void {
  markLoggedOut()
  sessionStorage.removeItem(SESSION_PROFILE_KEY)
  sessionStorage.removeItem(SESSION_BADGE_KEY)
  sessionStorage.removeItem("gl_token")
}

export function clearPersistedChildSession(): void {
  clearChildId()
  clearStoredCognitoSub()
  clearLocalProfile()
  sessionStorage.removeItem(SESSION_PROFILE_KEY)
  sessionStorage.removeItem(SESSION_BADGE_KEY)
  sessionStorage.removeItem(LOGGED_OUT_KEY)
}

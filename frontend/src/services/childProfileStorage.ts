const CHILD_ID_KEY = "childId";
const SESSION_BADGE_KEY = "gl_badgeId";
const SESSION_PROFILE_KEY = "gl_profile";

function readBadgeIdFromSession(): string | null {
  const badgeId = sessionStorage.getItem(SESSION_BADGE_KEY);
  if (badgeId) return badgeId;

  const rawProfile = sessionStorage.getItem(SESSION_PROFILE_KEY);
  if (!rawProfile) return null;

  try {
    const profile = JSON.parse(rawProfile) as { badgeId?: string };
    return profile.badgeId ?? null;
  } catch {
    return null;
  }
}

export function setChildId(childId: string): void {
  localStorage.setItem(CHILD_ID_KEY, childId);
  sessionStorage.setItem(SESSION_BADGE_KEY, childId);
}

export function getChildId(): string | null {
  const stored = localStorage.getItem(CHILD_ID_KEY);
  if (stored) return stored;

  const fromSession = readBadgeIdFromSession();
  if (fromSession) {
    localStorage.setItem(CHILD_ID_KEY, fromSession);
    return fromSession;
  }

  return null;
}

export function clearChildId(): void {
  localStorage.removeItem(CHILD_ID_KEY);
  sessionStorage.removeItem(SESSION_BADGE_KEY);
}

export function hasChildProfile(): boolean {
  return Boolean(getChildId() && sessionStorage.getItem(SESSION_PROFILE_KEY));
}

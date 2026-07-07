const TOKEN_KEY = "greenlens_auth_token";
const USER_KEY = "greenlens_user";
const REFRESH_TOKEN_KEY = "greenlens_refresh_token";
const AUTH_USERNAME_KEY = "greenlens_auth_username";

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setAuthUsername(username: string): void {
  localStorage.setItem(AUTH_USERNAME_KEY, username);
}

export function getAuthUsername(): string | null {
  return localStorage.getItem(AUTH_USERNAME_KEY);
}

export function removeAuthUsername(): void {
  localStorage.removeItem(AUTH_USERNAME_KEY);
}

export function setStoredUser(user: { email: string; name: string }): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): { email: string; name: string } | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { email: string; name: string };
  } catch {
    return null;
  }
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function clearSession(): void {
  removeToken();
  removeRefreshToken();
  removeAuthUsername();
  clearStoredUser();
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

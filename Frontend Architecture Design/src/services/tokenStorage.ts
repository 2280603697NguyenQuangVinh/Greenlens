const TOKEN_KEY = "greenlens_auth_token";
const USER_KEY = "greenlens_user";

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
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
  clearStoredUser();
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

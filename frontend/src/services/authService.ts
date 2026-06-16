import * as auth from "@/services/auth"
import {
  setToken,
  setStoredUser,
  clearSession,
} from "@/services/tokenStorage"
import type { AuthUser } from "@/services/auth"

export async function login(email: string, password: string): Promise<AuthUser> {
  const { token, user } = await auth.login(email, password)
  setToken(token)
  setStoredUser({ email: user.email, name: user.name })
  return user
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthUser> {
  const { token, user } = await auth.register(email, password, name)
  setToken(token)
  setStoredUser({ email: user.email, name: user.name })
  return user
}

export async function logout(): Promise<void> {
  await auth.logout()
  clearSession()
}

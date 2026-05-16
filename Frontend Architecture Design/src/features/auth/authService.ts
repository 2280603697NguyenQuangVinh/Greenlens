import * as authApi from "@/services/authApi";
import {
  setToken,
  setStoredUser,
  clearSession,
} from "@/services/tokenStorage";
import type { AuthUser } from "@/services/authApi";

export async function login(email: string, password: string): Promise<AuthUser> {
  const { token, user } = await authApi.login(email, password);
  setToken(token);
  setStoredUser({ email: user.email, name: user.name });
  return user;
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthUser> {
  const { token, user } = await authApi.register(email, password, name);
  setToken(token);
  setStoredUser({ email: user.email, name: user.name });
  return user;
}

export async function logout(): Promise<void> {
  await authApi.logout();
  clearSession();
}

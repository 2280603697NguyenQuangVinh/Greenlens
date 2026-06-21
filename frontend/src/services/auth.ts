export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: any;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export async function login(
  email: string,
  _password: string,
): Promise<AuthResponse> {
  await delay();
  return {
    token: `mock-jwt-${Date.now()}`,
    user: {
      id: "user-1",
      email,
      name: email.split("@")[0] || "Explorer",
    },
  };
}

export async function register(
  email: string,
  _password: string,
  name?: string,
): Promise<AuthResponse> {
  await delay(500);
  return {
    token: `mock-jwt-${Date.now()}`,
    user: {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split("@")[0] || "New Explorer",
    },
  };
}

export async function logout(): Promise<void> {
  await delay(200);
}

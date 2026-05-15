import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  createElement,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/services/authApi";
import { getStoredUser, getToken, isAuthenticated } from "@/services/tokenStorage";

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readInitialAuth(): AuthState {
  const token = getToken();
  const stored = getStoredUser();
  if (token && stored) {
    return {
      user: { id: "restored", email: stored.email, name: stored.name },
      isAuthenticated: true,
      isLoading: false,
    };
  }
  return { user: null, isAuthenticated: isAuthenticated(), isLoading: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readInitialAuth);

  const setAuth = useCallback((user: AuthUser, _token: string) => {
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  const clearAuth = useCallback(() => {
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const value = useMemo(
    () => ({ ...state, setAuth, clearAuth }),
    [state, setAuth, clearAuth],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

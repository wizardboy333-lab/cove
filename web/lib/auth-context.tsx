"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiLogin,
  apiLogout,
  apiMe,
  apiSignup,
  apiUpdateProfile,
  clearPersistedAuth,
  type LoginPayload,
  type SignupPayload,
} from "./api";
import type { User } from "./types";

const AUTH_KEY = "cove_auth";

type AuthState = {
  user: User | null;
  token: string | null;
  ready: boolean;
};

type AuthContextValue = AuthState & {
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    updates: Partial<Pick<User, "displayName" | "bio" | "birth_year">>
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): { user: User; token: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { user: User; token: string };
  } catch {
    return null;
  }
}

function persist(user: User, token: string) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ user, token }));
}

function clearPersist() {
  localStorage.removeItem(AUTH_KEY);
  clearPersistedAuth();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const stored = loadStored();
      if (!stored?.token) {
        if (!cancelled) setReady(true);
        return;
      }

      // Optimistic restore so UI isn't blank while /me loads
      if (!cancelled) {
        setUser(stored.user);
        setToken(stored.token);
      }

      try {
        const me = await apiMe(stored.token);
        if (cancelled) return;
        setUser(me);
        setToken(stored.token);
        persist(me, stored.token);
      } catch {
        if (cancelled) return;
        clearPersist();
        setUser(null);
        setToken(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await apiLogin(payload);
    setUser(res.user);
    setToken(res.token);
    persist(res.user, res.token);
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const res = await apiSignup(payload);
    setUser(res.user);
    setToken(res.token);
    persist(res.user, res.token);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setToken(null);
    clearPersist();
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, "displayName" | "bio" | "birth_year">>) => {
      const next = await apiUpdateProfile(updates);
      setUser(next);
      if (token) persist(next, token);
    },
    [token]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      signup,
      logout,
      updateProfile,
    }),
    [user, token, ready, login, signup, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

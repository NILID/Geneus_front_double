import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthUser } from './authApi';
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
} from './authApi';
import { getStoredToken } from './storage';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) {
      setUser(null);
      return;
    }
    const u = await fetchCurrentUser();
    setUser(u);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!getStoredToken()) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }
        const u = await fetchCurrentUser();
        if (!cancelled) {
          setUser(u);
        }
      } catch (e) {
        if (!cancelled) {
          setUser(null);
          setError(e instanceof Error ? e.message : 'Session check failed');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const u = await loginRequest(email, password);
    setUser(u);
  }, []);

  const register = useCallback(
    async (email: string, password: string, passwordConfirmation: string) => {
      setError(null);
      const u = await registerRequest(email, password, passwordConfirmation);
      setUser(u);
    },
    [],
  );

  const logout = useCallback(async () => {
    setError(null);
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
      clearError,
    }),
    [user, loading, error, login, register, logout, refreshUser, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

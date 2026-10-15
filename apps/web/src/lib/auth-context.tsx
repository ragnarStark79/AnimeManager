import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from './api-client';

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
}

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  ownerId: string | null;
  email: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Default development token for local developer convenience (sub: 00000000-0000-0000-0000-000000000001)
const DEV_DEFAULT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6Im93bmVyQGV4YW1wbGUuY29tIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE3OTIwNTU1Njl9.YHRscn-yxg7w8yIX2JUg86eR7HzvY9p2s2MpTGFuPFk';

function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('animemanager_auth_token');
    if (stored) return stored;
    const envToken = import.meta.env.VITE_AUTH_TOKEN as string;
    if (envToken) return envToken;
    // In development mode, provide the local test owner token so workflows operate smoothly
    if (import.meta.env.DEV) {
      return DEV_DEFAULT_TOKEN;
    }
    return null;
  });

  const parsed = useMemo(() => (token ? parseJwt(token) : null), [token]);

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    api.setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  // Synchronize api client token on mount and updates
  useEffect(() => {
    api.setToken(token);
    const unsubscribe = api.onUnauthorized(() => {
      // Keep token or notify user of 401
    });
    return unsubscribe;
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      ownerId: parsed?.sub || null,
      email: parsed?.email || null,
      setToken,
      logout,
    }),
    [token, parsed, setToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { login as loginApi, logout as logoutApi, refreshAccessToken, getCurrentUser } from "@/hooks/service/auth-api";
import { setTokens, clearTokens, isAuthenticated, getTimeUntilExpiry } from "@/lib/auth";
import type { UserProfile } from "@/hooks/service/auth-api";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          setIsAuth(true);
          // Fetch user profile
          const userProfile = await getCurrentUser();
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        clearTokens();
        setIsAuth(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Set up dynamic token refresh based on actual token expiration
  useEffect(() => {
    if (!isAuth) return;

    const scheduleNextRefresh = () => {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const timeUntilExpiry = getTimeUntilExpiry();

      if (timeUntilExpiry === null) {
        // No expiry info, use default 4-minute refresh
        refreshTimeoutRef.current = setTimeout(() => attemptRefresh(), 4 * 60 * 1000);
        return;
      }

      if (timeUntilExpiry <= 0) {
        // Token already expired, refresh immediately
        attemptRefresh();
        return;
      }

      // Refresh at 80% of token lifetime to provide buffer
      const refreshDelay = Math.floor(timeUntilExpiry * 0.8);
      refreshTimeoutRef.current = setTimeout(() => attemptRefresh(), refreshDelay);
    };

    const attemptRefresh = async (retryCount = 0) => {
      const MAX_RETRIES = 2;

      try {
        const data = await refreshAccessToken();
        setTokens(data.accessToken, data.refreshToken, data.expiresIn);
        // Schedule next refresh based on new token expiry
        scheduleNextRefresh();
      } catch (error) {
        console.error("Token refresh failed:", error);
        if (retryCount < MAX_RETRIES) {
          // Retry after 5 seconds with exponential backoff
          const backoffDelay = 5000 * Math.pow(2, retryCount);
          setTimeout(() => attemptRefresh(retryCount + 1), backoffDelay);
        } else {
          // Max retries reached, logout
          clearTokens();
          setUser(null);
          setIsAuth(false);
          router.push("/auth/login");
        }
      }
    };

    // Initial schedule
    scheduleNextRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [isAuth, router]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginApi(email, password);
      setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      setIsAuth(true);

      // Fetch user profile after successful login
      const userProfile = await getCurrentUser();
      setUser(userProfile);

      router.push("/landingpage");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      // Call logout API to invalidate refresh token on server
      await logoutApi();
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear tokens from localStorage
      clearTokens();
      setUser(null);
      setIsAuth(false);
      router.push("/auth/login");
    }
  }, [router]);

  const refresh = useCallback(async () => {
    try {
      const data = await refreshAccessToken();
      setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      setIsAuth(true);
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
      throw error;
    }
  }, [logout]);

  const value: AuthContextType = {
    isAuthenticated: isAuth,
    user,
    isLoading,
    login,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

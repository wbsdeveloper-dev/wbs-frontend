"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { login as loginApi, logout as logoutApi, refreshAccessToken, getCurrentUser } from "@/hooks/service/auth-api";
import { setTokens, getAccessToken, clearTokens, isAuthenticated } from "@/lib/auth";
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

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
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

  // Set up token refresh interval
  useEffect(() => {
    if (!isAuth) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error("Token refresh failed:", error);
        await logout();
      }
    }, 4 * 60 * 1000); // Refresh every 4 minutes (before typical 5-minute expiration)

    return () => clearInterval(refreshInterval);
  }, [isAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginApi(email, password);
      setTokens(data.accessToken, data.refreshToken);
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
      setTokens(data.accessToken, data.refreshToken);
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

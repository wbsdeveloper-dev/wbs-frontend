// Auth API service — wraps all authentication endpoints from
// the WBS Platform Backend API collection.

import { ApiError, type ApiResponse } from "./bot-api";
import { getAccessToken, getRefreshToken } from "@/lib/auth";

export const AUTH_API_HOST = "http://localhost:3005/api";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  roles: string[];
}

// ---------------------------------------------------------------------------
// Base fetcher (auth endpoints – no Bearer token needed for login/refresh)
// ---------------------------------------------------------------------------

async function authFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${AUTH_API_HOST}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as ApiResponse;
      if (body.message) msg = body.message;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(res.status, msg);
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiError(res.status, body.message || "Unknown API error");
  }

  return body.data;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

/**
 * POST /auth/login
 * Authenticate user and receive access/refresh tokens.
 */
export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return authFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * POST /auth/refresh
 * Refresh the access token using the stored refresh token.
 */
export async function refreshAccessToken(): Promise<RefreshResponse> {
  const token = getRefreshToken();
  if (!token) {
    throw new ApiError(401, "No refresh token available");
  }

  return authFetch<RefreshResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: token }),
  });
}

/**
 * GET /auth/me
 * Get current authenticated user profile.
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const accessToken = getAccessToken();
  return authFetch<UserProfile>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * POST /auth/logout
 * Logout and invalidate the refresh token.
 */
export async function logout(): Promise<void> {
  const accessToken = getAccessToken();
  return authFetch<void>("/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

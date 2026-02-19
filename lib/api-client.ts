// API Client - Centralized API request handling with automatic token management

import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth";
import { refreshAccessToken } from "@/hooks/service/auth-api";
import type { ApiResponse } from "@/hooks/service/bot-api";

export const AUTH_API_HOST = "http://localhost:3005/api";
export const DASHBOARD_API_HOST = "http://localhost:3005/api";
export const CONFIG_API_HOST = "http://localhost:3005/api";
export const SITE_API_HOST = "http://localhost:3005/api";

interface ApiClientOptions extends RequestInit {
  host?: string;
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function apiRequest<T>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { host = AUTH_API_HOST, skipAuth = false, ...fetchOptions } = options;
  const url = `${host}${path}`;

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Add authorization header if not skipped
  if (!skipAuth && typeof window !== "undefined") {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Make the request
  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && !skipAuth) {
    if (isRefreshing) {
      // Wait for the refresh to complete
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          const retryHeaders: Record<string, string> = {
            ...headers,
            "Authorization": `Bearer ${token}`,
          };
          fetch(url, { ...fetchOptions, headers: retryHeaders })
            .then((res) => processResponse<T>(res))
            .then(resolve)
            .catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Attempt to refresh the token
      const refreshData = await refreshAccessToken();
      setTokens(refreshData.accessToken, refreshData.refreshToken);

      // Notify all waiting requests
      onTokenRefreshed(refreshData.accessToken);

      // Retry the original request with new token
      const retryHeaders: Record<string, string> = {
        ...headers,
        "Authorization": `Bearer ${refreshData.accessToken}`,
      };
      response = await fetch(url, {
        ...fetchOptions,
        headers: retryHeaders,
      });
    } catch (error) {
      // Refresh failed - clear tokens and force logout
      clearTokens();
      isRefreshing = false;
      
      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
      
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return processResponse<T>(response);
}

async function processResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText;
    
    try {
      const body = (await response.json()) as ApiResponse;
      if (body.message) message = body.message;
      if (body.error) message = body.error;
    } catch {
      // Ignore parse errors
    }

    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    const error = new Error(body.message || "Unknown API error") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return body.data;
}

// Convenience methods
export const apiClient = {
  get: <T>(path: string, options?: ApiClientOptions) =>
    apiRequest<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, data?: unknown, options?: ApiClientOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(path: string, data?: unknown, options?: ApiClientOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(path: string, data?: unknown, options?: ApiClientOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(path: string, options?: ApiClientOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};

export default apiClient;

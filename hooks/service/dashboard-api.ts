// Dashboard API service — placeholder for dashboard-specific endpoints.
// The dashboard may run on a different host than the bot services.

import { ApiError, type ApiResponse } from "./bot-api";

export const DASHBOARD_API_HOST = "http://localhost:3000";

// ---------------------------------------------------------------------------
// Base fetcher (same envelope pattern as bot-api)
// ---------------------------------------------------------------------------

export async function dashboardFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${DASHBOARD_API_HOST}${path}`;

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
// Query key factory
// ---------------------------------------------------------------------------

export const dashboardKeys = {
  all: ["dashboard"] as const,
  // Add domain-specific keys here as needed, e.g.:
  // summary: () => [...dashboardKeys.all, "summary"] as const,
};

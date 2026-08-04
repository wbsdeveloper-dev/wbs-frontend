import { useQuery } from "@tanstack/react-query";
import { DASHBOARD_API_HOST } from "./dashboard-api";
import { getAccessToken } from "@/lib/auth";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  description: string | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  status: "SUCCESS" | "FAILED";
  created_at: string;
}

export interface ActivityLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  resource?: string;
  userId?: string;
  userEmail?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface ActivityLogsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActivityLogsResponse {
  data: ActivityLog[];
  pagination: ActivityLogsPagination;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    entries
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&")
  );
}

// ── Fetcher ────────────────────────────────────────────────────────────────

export async function fetchActivityLogs(
  params?: ActivityLogsParams,
): Promise<ActivityLogsResponse> {
  const query = params
    ? buildQuery(params as Record<string, string | number | undefined>)
    : "";
  const url = `${DASHBOARD_API_HOST}/activity-logs${query}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch activity logs: ${res.statusText} — ${body}`);
  }

  const json = await res.json();

  // API returns { data: [...], pagination: { page, limit, total, totalPages } }
  return {
    data: json.data ?? [],
    pagination: {
      page: json.pagination?.page ?? 1,
      limit: json.pagination?.limit ?? 50,
      total: json.pagination?.total ?? 0,
      totalPages: json.pagination?.totalPages ?? 1,
    },
  };
}

// ── TanStack Query hook ────────────────────────────────────────────────────

export function useActivityLogs(
  params?: ActivityLogsParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["activity-logs", params],
    queryFn: () => fetchActivityLogs(params),
    enabled: options?.enabled !== false,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

// Monitoring API service — reconciliation / monitoring record endpoints.

import { dashboardFetch, DASHBOARD_API_HOST } from "./dashboard-api";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface MonitoringRecord {
  id: string;
  reportDate: string;
  siteId: string;
  siteName: string;
  metricType: string;
  periodType: string;
  periodValue: string;
  waValue: number | null;
  plnValue: number | null;
  sheetValue: number | null;
  finalValue: number | null;
  finalSource: string | null;
  resolution: string | null;
  delta: number | null;
  status: string;
  reason: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Query parameters
// ---------------------------------------------------------------------------

export interface MonitoringParams {
  page?: number;
  limit?: number;
  siteId?: string;
  status?: string;
  metricType?: string;
  periodType?: string;
  startDate?: string;
  endDate?: string;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const monitoringKeys = {
  all: ["monitoring"] as const,
  records: (params?: MonitoringParams) =>
    [...monitoringKeys.all, "records", params] as const,
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
  );
}

// ---------------------------------------------------------------------------
// API function
// ---------------------------------------------------------------------------

export interface MonitoringResponse {
  records: MonitoringRecord[];
  pagination: MonitoringPagination;
}

export async function getMonitoringRecords(
  params?: MonitoringParams,
): Promise<MonitoringResponse> {
  const query = params
    ? buildQuery(params as Record<string, string | number | undefined>)
    : "";

  // The API wraps `data` as an array and `pagination` at the top level.
  // dashboardFetch already unwraps the outer `data` field for us, so we
  // receive the array of records directly. We need the pagination too,
  // so we do a manual fetch here.
  const url = `${DASHBOARD_API_HOST}/monitoring/records${query}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Monitoring API error: ${res.statusText}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown monitoring API error");
  }

  return {
    records: body.data as MonitoringRecord[],
    pagination: body.pagination as MonitoringPagination,
  };
}

// ---------------------------------------------------------------------------
// React Query hook
// ---------------------------------------------------------------------------

export function useMonitoringRecords(
  params?: MonitoringParams,
  options?: Partial<UseQueryOptions<MonitoringResponse>>,
) {
  return useQuery({
    queryKey: monitoringKeys.records(params),
    queryFn: () => getMonitoringRecords(params),
    ...options,
  });
}

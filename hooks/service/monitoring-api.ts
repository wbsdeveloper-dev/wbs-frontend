// Monitoring API service — reconciliation / monitoring record endpoints.

import { DASHBOARD_API_HOST } from "./dashboard-api";
import { getAccessToken } from "@/lib/auth";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface MonitoringRecord {
  id: string;
  reportDate: string;
  siteId: string;
  siteName: string;
  supplierName: string | null;
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
  id?: string;
  siteId?: string;
  siteName?: string;
  supplierName?: string;
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
  record: (id: string) => [...monitoringKeys.all, "record", id] as const,
};

// ---------------------------------------------------------------------------
// Update payload
// ---------------------------------------------------------------------------

export interface UpdateMonitoringPayload {
  waValue?: number | null;
  plnValue?: number | null;
  sheetValue?: number | null;
  finalValue?: number | null;
  finalSource?: string | null;
  resolution?: string | null;
  status?: string;
  reason?: string | null;
}

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
  const accessToken = getAccessToken();
  
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
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
// API function — single record
// ---------------------------------------------------------------------------

export async function getMonitoringRecord(
  id: string,
): Promise<MonitoringRecord> {
  const url = `${DASHBOARD_API_HOST}/monitoring/records/${id}`;
  const accessToken = getAccessToken();
  
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Monitoring API error: ${res.statusText}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown monitoring API error");
  }

  return body.data as MonitoringRecord;
}

// ---------------------------------------------------------------------------
// API function — update record (PATCH)
// ---------------------------------------------------------------------------

export async function updateMonitoringRecord(
  id: string,
  payload: UpdateMonitoringPayload,
): Promise<MonitoringRecord> {
  const url = `${DASHBOARD_API_HOST}/monitoring/records/${id}`;
  const accessToken = getAccessToken();
  
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Monitoring API error: ${res.statusText}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown monitoring API error");
  }

  return body.data as MonitoringRecord;
}

// ---------------------------------------------------------------------------
// React Query hooks
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

export function useMonitoringRecord(
  id: string,
  options?: Partial<UseQueryOptions<MonitoringRecord>>,
) {
  return useQuery({
    queryKey: monitoringKeys.record(id),
    queryFn: () => getMonitoringRecord(id),
    enabled: !!id,
    ...options,
  });
}

export function useUpdateMonitoringRecord(
  options?: Partial<
    UseMutationOptions<
      MonitoringRecord,
      Error,
      { id: string; payload: UpdateMonitoringPayload }
    >
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateMonitoringPayload;
    }) => updateMonitoringRecord(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: monitoringKeys.records() });
      qc.invalidateQueries({ queryKey: monitoringKeys.record(variables.id) });
    },
    ...options,
  });
}

// ---------------------------------------------------------------------------
// API function — delete record (DELETE)
// ---------------------------------------------------------------------------

export async function deleteMonitoringRecord(
  id: string,
): Promise<{ deleted: boolean }> {
  const url = `${DASHBOARD_API_HOST}/monitoring/records/${id}`;
  const accessToken = getAccessToken();
  
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Monitoring API error: ${res.statusText}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown monitoring API error");
  }

  return { deleted: true };
}

// ---------------------------------------------------------------------------
// React Query hook — delete
// ---------------------------------------------------------------------------

export function useDeleteMonitoringRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMonitoringRecord(id),
    onSuccess: () => {
      // Invalidate all monitoring queries so the table auto-refreshes
      qc.invalidateQueries({ queryKey: monitoringKeys.all });
    },
  });
}

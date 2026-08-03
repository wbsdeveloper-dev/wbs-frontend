import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DASHBOARD_API_HOST } from "./dashboard-api";
import { getAccessToken } from "@/lib/auth";

export interface ReconciliationJob {
  id: string;
  job_type: string;
  dedup_key: string;
  status: "PENDING" | "RUNNING" | "RETRY_WAIT" | "DONE" | "FAILED" | string;
  attempt_count: number;
  last_error: string | null;
  next_retry_at: string | null;
  payload: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  event_source_type: string | null;
}

export interface SummaryCounts {
  pending: number;
  running: number;
  retryWait: number;
  done: number;
  failed: number;
  totalJobs: number;
}

export interface ReconciliationJobsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReconciliationJobsResponse {
  items: ReconciliationJob[];
  summaryCounts: SummaryCounts;
  pagination: ReconciliationJobsPagination;
}

export interface ReconciliationJobsParams {
  status?: string;
  source?: string;
  supplierName?: string;
  siteName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
  );
}

export async function fetchReconciliationJobs(
  params?: ReconciliationJobsParams,
): Promise<ReconciliationJobsResponse> {
  const query = params ? buildQuery(params as Record<string, string | number | undefined>) : "";
  const url = `${DASHBOARD_API_HOST}/monitoring/jobs${query}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch reconciliation jobs: ${res.statusText}`);
  }

  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message || "Unknown error fetching reconciliation jobs");
  }

  return body.data as ReconciliationJobsResponse;
}

export function useReconciliationJobs(
  params?: ReconciliationJobsParams,
  options?: { refetchInterval?: number | false; enabled?: boolean },
) {
  return useQuery({
    queryKey: ["reconciliation-jobs", params],
    queryFn: () => fetchReconciliationJobs(params),
    refetchInterval: options?.refetchInterval ?? 3000,
    enabled: options?.enabled ?? true,
  });
}

export async function deleteReconciliationJob(id: string): Promise<void> {
  const url = `${DASHBOARD_API_HOST}/monitoring/jobs/${id}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete reconciliation job: ${res.statusText}`);
  }
}

export function useDeleteReconciliationJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReconciliationJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-jobs"] });
    },
  });
}

export async function deleteReconciliationJobsBulk(ids: string[]): Promise<void> {
  const url = `${DASHBOARD_API_HOST}/monitoring/jobs/bulk-delete`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ ids }),
  });

  if (!res.ok) {
    throw new Error(`Failed to bulk delete reconciliation jobs: ${res.statusText}`);
  }
}

export function useDeleteReconciliationJobsBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteReconciliationJobsBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-jobs"] });
    },
  });
}

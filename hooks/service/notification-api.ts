// Notification API service — dedicated notifications endpoints.

import { DASHBOARD_API_HOST } from "./dashboard-api";
import { getAccessToken } from "@/lib/auth";
import apiClient from "@/lib/api-client";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationRecord {
  id: string;
  reportDate: string;
  supplierId: string | null;
  supplierName: string | null;
  siteId: string;
  siteName: string;
  metricType: string;
  finalValue: number | null;
  status: string;
  notes: string | null;
  isRead: boolean;
  createdBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  supplierName?: string;
  siteName?: string;
  metricType?: string;
  isRead?: boolean;
}

export interface NotificationResponse {
  records: NotificationRecord[];
  pagination: NotificationPagination;
}

export interface CreateNotificationPayload {
  reportDate: string;
  supplierId?: string | null;
  siteId: string;
  metricType: string;
  finalValue?: number | null;
  status: string;
  notes?: string | null;
}

export interface UpdateNotificationPayload {
  finalValue?: number | null;
  status?: string;
  notes?: string | null;
  isRead?: boolean;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params?: NotificationParams) =>
    [...notificationKeys.all, "list", params] as const,
  detail: (id: string) => [...notificationKeys.all, "detail", id] as const,
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
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
// API functions
// ---------------------------------------------------------------------------

export async function getNotifications(
  params?: NotificationParams,
): Promise<NotificationResponse> {
  const query = params
    ? buildQuery(params as Record<string, string | number | boolean | undefined>)
    : "";

  const url = `${DASHBOARD_API_HOST}/notifications${query}`;
  const accessToken = getAccessToken();

  let res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (res.status === 401) {
    try {
      const { refreshAccessToken } = await import("./auth-api");
      const { setTokens } = await import("@/lib/auth");
      const refreshData = await refreshAccessToken();
      setTokens(refreshData.accessToken, refreshData.refreshToken, refreshData.expiresIn || 3600);
      res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshData.accessToken}`,
        },
      });
    } catch {
      /* ignore and proceed to error handling */
    }
  }

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const errBody = await res.json();
      if (errBody.message) msg = errBody.message;
      else if (errBody.error && errBody.error.message) msg = errBody.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(`Notification API error: ${msg}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown notification API error");
  }

  return {
    records: body.data as NotificationRecord[],
    pagination: body.pagination as NotificationPagination,
  };
}

export async function getNotification(
  id: string,
): Promise<NotificationRecord> {
  return apiClient.get(`/notifications/${id}`);
}

export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<{ id: string; created: boolean }> {
  return apiClient.post(`/notifications`, payload);
}

export async function updateNotification(
  id: string,
  payload: UpdateNotificationPayload,
): Promise<{ id: string; updated: boolean }> {
  return apiClient.patch(`/notifications/${id}`, payload);
}

export async function deleteNotification(
  id: string,
): Promise<{ id: string; deleted: boolean }> {
  return apiClient.delete(`/notifications/${id}`);
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function useNotifications(
  params?: NotificationParams,
  options?: Partial<UseQueryOptions<NotificationResponse>>,
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => getNotifications(params),
    ...options,
  });
}

export function useNotification(
  id: string,
  options?: Partial<UseQueryOptions<NotificationRecord>>,
) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => getNotification(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateNotification(
  options?: Partial<
    UseMutationOptions<
      { id: string; created: boolean },
      Error,
      CreateNotificationPayload
    >
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNotificationPayload) =>
      createNotification(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
    ...options,
  });
}

export function useUpdateNotification(
  options?: Partial<
    UseMutationOptions<
      { id: string; updated: boolean },
      Error,
      { id: string; payload: UpdateNotificationPayload }
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
      payload: UpdateNotificationPayload;
    }) => updateNotification(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({
        queryKey: notificationKeys.detail(variables.id),
      });
    },
    ...options,
  });
}

export function useDeleteNotification(
  options?: Partial<
    UseMutationOptions<{ id: string; deleted: boolean }, Error, string>
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
    ...options,
  });
}

// Notification API service — dedicated notifications endpoints.

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

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Notification API error: ${res.statusText}`);
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
  const url = `${DASHBOARD_API_HOST}/notifications/${id}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Notification API error: ${res.statusText}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown notification API error");
  }

  return body.data as NotificationRecord;
}

export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<{ id: string; created: boolean }> {
  const url = `${DASHBOARD_API_HOST}/notifications`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Notification API error: ${res.statusText}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown notification API error");
  }

  return body.data;
}

export async function updateNotification(
  id: string,
  payload: UpdateNotificationPayload,
): Promise<{ id: string; updated: boolean }> {
  const url = `${DASHBOARD_API_HOST}/notifications/${id}`;
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
    throw new Error(`Notification API error: ${res.statusText}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown notification API error");
  }

  return body.data;
}

export async function deleteNotification(
  id: string,
): Promise<{ id: string; deleted: boolean }> {
  const url = `${DASHBOARD_API_HOST}/notifications/${id}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Notification API error: ${res.statusText}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown notification API error");
  }

  return body.data;
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

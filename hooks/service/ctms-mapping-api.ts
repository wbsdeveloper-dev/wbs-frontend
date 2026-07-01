import { getAccessToken } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";

export const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3005/api";

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<{ data: T }> {
  const url = `${API_HOST}${path}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as ApiResponse;
      if (body.error) msg = body.error;
      else if (body.message) msg = body.message;
    } catch {}
    throw new ApiError(res.status, msg);
  }

  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new ApiError(res.status, body.error || body.message || "Unknown API error");
  }

  return { data: body.data };
}

export interface CtmsMapping {
  id: string;
  ctms_name: string;
  site_name: string;
  created_at: string;
  updated_at: string;
}

export const ctmsMappingKeys = {
  all: ["ctmsMapping"] as const,
};

export function getCtmsMappings() {
  return apiFetch<CtmsMapping[]>("/ctms-mapping").then(res => res.data);
}

export function createCtmsMapping(payload: { ctms_name: string; site_name: string }) {
  return apiFetch<CtmsMapping>("/ctms-mapping", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(res => res.data);
}

export function updateCtmsMapping(id: string, payload: { ctms_name?: string; site_name?: string }) {
  return apiFetch<CtmsMapping>(`/ctms-mapping/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then(res => res.data);
}

export function deleteCtmsMapping(id: string) {
  return apiFetch<{ success: boolean }>(`/ctms-mapping/${id}`, { method: "DELETE" }).then(res => res.data);
}

export function useCtmsMappings(options?: Partial<UseQueryOptions<CtmsMapping[]>>) {
  return useQuery({
    queryKey: ctmsMappingKeys.all,
    queryFn: () => getCtmsMappings() as Promise<CtmsMapping[]>,
    ...options,
  });
}

export function useCreateCtmsMapping(options?: Partial<UseMutationOptions<CtmsMapping, Error, { ctms_name: string; site_name: string }>>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createCtmsMapping(payload) as Promise<CtmsMapping>,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ctmsMappingKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useUpdateCtmsMapping(options?: Partial<UseMutationOptions<CtmsMapping, Error, { id: string; payload: { ctms_name?: string; site_name?: string } }>>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateCtmsMapping(id, payload) as Promise<CtmsMapping>,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ctmsMappingKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useDeleteCtmsMapping(options?: Partial<UseMutationOptions<{ success: boolean }, Error, string>>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteCtmsMapping(id) as Promise<{ success: boolean }>,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ctmsMappingKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

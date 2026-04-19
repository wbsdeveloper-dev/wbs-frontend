// User API service — wraps all user-related endpoints
// from WBS Platform Backend API.

import { getAccessToken } from "@/lib/auth";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

export const USER_API_HOST =
  process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3005/api";

// ---------------------------------------------------------------------------
// Standard API envelope
// ---------------------------------------------------------------------------

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    requestId?: string;
    timestamp?: string;
  };
}

class UserApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "UserApiError";
  }
}

// ---------------------------------------------------------------------------
// Base fetcher (with automatic auth header injection)
// ---------------------------------------------------------------------------

async function userFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta?: ApiResponse["meta"] }> {
  const url = `${USER_API_HOST}${path}`;
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
    } catch {
      /* ignore parse errors */
    }
    throw new UserApiError(res.status, msg);
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new UserApiError(
      res.status,
      body.error || body.message || "Unknown API error",
    );
  }

  // Support paginated responses which return `meta`
  return { data: body.data, meta: body.meta };
}

// Helper to extract just the data for non-paginated hooks
async function userFetchData<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { data } = await userFetch<T>(path, options);
  return data;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  status: "ACTIVE" | "INACTIVE";
  lastLoginAt?: string;
  createdAt?: string;
  roles: string[]; // List of role names or IDs
}

export interface PaginatedUsers {
  users: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  password?: string;
  status?: "ACTIVE" | "INACTIVE";
  roles?: string[];
}

export interface UpdateUserPayload {
  email?: string;
  fullName?: string;
  password?: string;
  status?: "ACTIVE" | "INACTIVE";
  roles?: string[];
}

export interface PrivilegeMapping {
  resource: string;
  actions: string[];
}

export interface ResourceDefinition {
  key: string;
  actions: string[];
}

// ---------------------------------------------------------------------------
// Helper to build query string
// ---------------------------------------------------------------------------

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const userKeys = {
  all: ["users"] as const,
  roles: () => [...userKeys.all, "roles"] as const,
  roleResources: () => [...userKeys.roles(), "resources"] as const,
  rolePrivileges: (id: string) => [...userKeys.roles(), "privileges", id] as const,
  users: (filters?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => [...userKeys.all, "list", filters] as const,
  user: (id: string) => [...userKeys.all, "detail", id] as const,
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getUsers(filters?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<PaginatedUsers> {
  const query = buildQuery({
    page: filters?.page ?? 1,
    limit: filters?.limit ?? 20,
    status: filters?.status,
    search: filters?.search,
  });
  const res = await userFetch<User[]>(`/users${query}`);
  return {
    users: res.data,
    meta: {
      page: res.meta?.page ?? 1,
      limit: res.meta?.limit ?? 20,
      total: res.meta?.total ?? 0,
    },
  };
}

export function getUser(id: string) {
  return userFetchData<User>(`/users/${id}`);
}

export function createUser(payload: CreateUserPayload) {
  return userFetchData<{ id: string; message: string }>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return userFetchData<{ id: string; updated: boolean }>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id: string) {
  return userFetchData<{ success: boolean; message: string }>(`/users/${id}`, {
    method: "DELETE",
  });
}

export function getRoles() {
  return userFetchData<Role[]>("/roles");
}

export function createRole(payload: { name: string; description: string }) {
  return userFetchData<Role>("/roles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteRole(id: string) {
  return userFetchData<{ success: boolean; message: string }>(`/roles/${id}`, {
    method: "DELETE",
  });
}

export function getRoleResources() {
  return userFetchData<ResourceDefinition[]>("/roles/resources");
}

export function getRolePrivileges(id: string) {
  return userFetchData<PrivilegeMapping[]>(`/roles/${id}/privileges`);
}

export function updateRolePrivileges(id: string, payload: { privileges: PrivilegeMapping[] }) {
  return userFetchData<{ success: boolean }>(`/roles/${id}/privileges`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function useRoles(options?: Partial<UseQueryOptions<Role[]>>) {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: () => getRoles(),
    ...options,
  });
}

export function useCreateRole(
  options?: Partial<UseMutationOptions<Role, Error, { name: string; description: string }>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createRole(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: userKeys.roles() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useDeleteRole(
  options?: Partial<UseMutationOptions<{ success: boolean; message: string }, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: userKeys.roles() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useRoleResources(options?: Partial<UseQueryOptions<ResourceDefinition[]>>) {
  return useQuery({
    queryKey: userKeys.roleResources(),
    queryFn: () => getRoleResources(),
    ...options,
  });
}

export function useRolePrivileges(id: string, options?: Partial<UseQueryOptions<PrivilegeMapping[]>>) {
  return useQuery({
    queryKey: userKeys.rolePrivileges(id),
    queryFn: () => getRolePrivileges(id),
    enabled: !!id,
    ...options,
  });
}

export function useUpdateRolePrivileges(
  options?: Partial<UseMutationOptions<{ success: boolean }, Error, { id: string; payload: { privileges: PrivilegeMapping[] } }>>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateRolePrivileges(id, payload),
    onSuccess: (_, { id }, ...args) => {
      qc.invalidateQueries({ queryKey: userKeys.rolePrivileges(id) });
      options?.onSuccess?.(_, {
        id,
        payload: {
          privileges: []
        }
      }, ...args);
    },
    ...options,
  });
}

export function useUsers(
  filters?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  },
  options?: Partial<UseQueryOptions<PaginatedUsers>>,
) {
  return useQuery({
    queryKey: userKeys.users(filters),
    queryFn: () => getUsers(filters),
    ...options,
  });
}

export function useUser(id: string, options?: Partial<UseQueryOptions<User>>) {
  return useQuery({
    queryKey: userKeys.user(id),
    queryFn: () => getUser(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateUser(
  options?: Partial<
    UseMutationOptions<
      { id: string; message: string },
      Error,
      CreateUserPayload
    >
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useUpdateUser(
  options?: Partial<
    UseMutationOptions<
      { id: string; updated: boolean },
      Error,
      { id: string; payload: UpdateUserPayload }
    >
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useDeleteUser(
  options?: Partial<
    UseMutationOptions<{ success: boolean; message: string }, Error, string>
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

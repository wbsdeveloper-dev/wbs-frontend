// Site API service — wraps all site-related endpoints
// from WBS Platform Backend API.

import { getAccessToken } from "@/lib/auth";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

export const SITE_API_HOST = "http://localhost:3005/api";

// ---------------------------------------------------------------------------
// Standard API envelope
// ---------------------------------------------------------------------------

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: { requestId: string; timestamp: string };
}

class SiteApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "SiteApiError";
  }
}

// ---------------------------------------------------------------------------
// Base fetcher (with automatic auth header injection)
// ---------------------------------------------------------------------------

async function siteFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${SITE_API_HOST}${path}`;
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
    throw new SiteApiError(res.status, msg);
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new SiteApiError(
      res.status,
      body.error || body.message || "Unknown API error",
    );
  }

  return body.data;
}

// ---------------------------------------------------------------------------
// Types — Dropdowns
// ---------------------------------------------------------------------------

export interface Plant {
  id: string;
  name: string;
  jenis: string;
  region: string;
  lat: number;
  long: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  jenis: string;
  lat: number;
  long: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DropdownData {
  plants: Plant[];
  suppliers: Supplier[];
  sites: Site[];
}

// ---------------------------------------------------------------------------
// Types — Sites
// ---------------------------------------------------------------------------

export interface Site {
  id: string;
  name: string;
  site_type: "PEMBANGKIT" | "PEMASOK";
  region: string;
  capacity?: number;
  pembangkit_id?: string;
  pemasok_id?: string;
  lat?: number;
  long?: number;
  is_enabled: boolean;
  conversion_factor?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSitePayload {
  name: string;
  site_type: "PEMBANGKIT" | "PEMASOK" | "TRANSPORTIR";
  region: string;
  capacity?: number;
  pembangkit_id?: string;
  pemasok_id?: string;
  lat?: number;
  long?: number;
  conversion_factor?: number;
}

export interface UpdateSitePayload {
  name?: string;
  site_type?: "PEMBANGKIT" | "PEMASOK" | "TRANSPORTIR";
  region?: string;
  capacity?: number;
  pembangkit_id?: string;
  pemasok_id?: string;
  lat?: number;
  long?: number;
  is_enabled?: boolean;
  conversion_factor?: number;
}

export interface DeleteSiteResponse {
  deleted: boolean;
  warned_sites?: string[];
}

// ---------------------------------------------------------------------------
// Types — Site Relations
// ---------------------------------------------------------------------------

export interface SiteRelation {
  id: string;
  source_site_id: string;
  source_site_name: string;
  target_site_id: string;
  target_site_name: string;
  relation_type: string;
  status: "ACTIVE" | "INACTIVE";
  priority: number;
  commodity: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRelationPayload {
  source_site_id: string;
  target_site_id: string;
  relation_type: string;
  commodity: string;
  priority?: number;
}

export interface UpdateRelationPayload {
  source_site_id?: string;
  target_site_id?: string;
  relation_type?: string;
  commodity?: string;
  priority?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export interface DeleteRelationResponse {
  deleted: boolean;
  warned_sites?: string[];
}

// ---------------------------------------------------------------------------
// Types — Site Mappings
// ---------------------------------------------------------------------------

export interface SiteMapping {
  id: string;
  source_type: "WA" | "EMAIL";
  source_name: string;
  normalized_site_id: string;
  normalized_site_name: string;
  mapping_method: "MANUAL" | "AUTO";
  confidence: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMappingPayload {
  source_type: "WA" | "EMAIL";
  source_name: string;
  normalized_site_id: string;
  mapping_method: "MANUAL" | "AUTO";
}

// ---------------------------------------------------------------------------
// Helper to build query string
// ---------------------------------------------------------------------------

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== "all") {
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

export const siteKeys = {
  all: ["sites"] as const,
  dropdowns: () => [...siteKeys.all, "dropdowns"] as const,
  sites: (filters?: { type?: string; region?: string; search?: string }) =>
    [...siteKeys.all, "list", filters] as const,
  site: (id: string) => [...siteKeys.all, "detail", id] as const,
  relations: (active?: boolean) =>
    [...siteKeys.all, "relations", active] as const,
  relation: (id: string) => [...siteKeys.all, "relations", id] as const,
  mappings: (sourceType?: string) =>
    [...siteKeys.all, "mappings", sourceType] as const,
};

// ---------------------------------------------------------------------------
// API functions — Dropdowns
// ---------------------------------------------------------------------------

export function getDropdowns() {
  return siteFetch<DropdownData>("/dim/dropdowns");
}

// ---------------------------------------------------------------------------
// API functions — Sites
// ---------------------------------------------------------------------------

export function getSites(filters?: {
  type?: string;
  region?: string;
  search?: string;
}) {
  const query = buildQuery({
    type: filters?.type,
    region: filters?.region,
    search: filters?.search,
  });
  return siteFetch<Site[]>(`/sites${query}`);
}

export function getSite(id: string) {
  return siteFetch<Site>(`/sites/${id}`);
}

export function createSite(payload: CreateSitePayload) {
  return siteFetch<Site>("/sites", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSite(id: string, payload: UpdateSitePayload) {
  return siteFetch<Site>(`/sites/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteSite(id: string) {
  return siteFetch<DeleteSiteResponse>(`/sites/${id}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// API functions — Site Relations
// ---------------------------------------------------------------------------

export function getRelations(active?: boolean) {
  const query = buildQuery({ active });
  return siteFetch<SiteRelation[]>(`/site-relations${query}`);
}

export function getRelation(id: string) {
  return siteFetch<SiteRelation>(`/site-relations/${id}`);
}

export function createRelation(payload: CreateRelationPayload) {
  return siteFetch<SiteRelation>("/site-relations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRelation(id: string, payload: UpdateRelationPayload) {
  return siteFetch<SiteRelation>(`/site-relations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteRelation(id: string) {
  return siteFetch<DeleteRelationResponse>(`/site-relations/${id}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// API functions — Site Mappings
// ---------------------------------------------------------------------------

export function getMappings(sourceType?: string) {
  const query = buildQuery({ source_type: sourceType });
  return siteFetch<SiteMapping[]>(`/site-mappings${query}`);
}

export function createMapping(payload: CreateMappingPayload) {
  return siteFetch<SiteMapping>("/site-mappings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// React Query hooks — Dropdowns
// ---------------------------------------------------------------------------

export function useDropdowns(options?: Partial<UseQueryOptions<DropdownData>>) {
  return useQuery({
    queryKey: siteKeys.dropdowns(),
    queryFn: () => getDropdowns(),
    ...options,
  });
}

// ---------------------------------------------------------------------------
// React Query hooks — Sites
// ---------------------------------------------------------------------------

export function useSites(
  filters?: {
    type?: string;
    region?: string;
    search?: string;
    capacity?: string;
  },
  options?: Partial<UseQueryOptions<Site[]>>,
) {
  return useQuery({
    queryKey: siteKeys.sites(filters),
    queryFn: () => getSites(filters),
    ...options,
  });
}

export function useSite(id: string, options?: Partial<UseQueryOptions<Site>>) {
  return useQuery({
    queryKey: siteKeys.site(id),
    queryFn: () => getSite(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateSite(
  options?: Partial<UseMutationOptions<Site, Error, CreateSitePayload>>,
) {
  const qc = useQueryClient();
  const { onSuccess: externalOnSuccess, ...restOptions } = options || {};
  return useMutation({
    mutationFn: (payload: CreateSitePayload) => createSite(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: siteKeys.all });
      externalOnSuccess?.(...args);
    },
    ...restOptions,
  });
}

export function useUpdateSite(
  options?: Partial<
    UseMutationOptions<Site, Error, { id: string; payload: UpdateSitePayload }>
  >,
) {
  const qc = useQueryClient();
  const { onSuccess: externalOnSuccess, ...restOptions } = options || {};
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSitePayload }) =>
      updateSite(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: siteKeys.all });
      externalOnSuccess?.(...args);
    },
    ...restOptions,
  });
}

export function useDeleteSite(
  options?: Partial<UseMutationOptions<DeleteSiteResponse, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siteKeys.sites() });
      qc.invalidateQueries({ queryKey: siteKeys.dropdowns() });
    },
    ...options,
  });
}

// ---------------------------------------------------------------------------
// React Query hooks — Site Relations
// ---------------------------------------------------------------------------

export function useRelations(
  active?: boolean,
  options?: Partial<UseQueryOptions<SiteRelation[]>>,
) {
  return useQuery({
    queryKey: siteKeys.relations(active),
    queryFn: () => getRelations(active),
    ...options,
  });
}

export function useRelation(
  id: string,
  options?: Partial<UseQueryOptions<SiteRelation>>,
) {
  return useQuery({
    queryKey: siteKeys.relation(id),
    queryFn: () => getRelation(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateRelation(
  options?: Partial<
    UseMutationOptions<SiteRelation, Error, CreateRelationPayload>
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRelationPayload) => createRelation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siteKeys.relations() });
    },
    ...options,
  });
}

export function useUpdateRelation(
  options?: Partial<
    UseMutationOptions<
      SiteRelation,
      Error,
      { id: string; payload: UpdateRelationPayload }
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
      payload: UpdateRelationPayload;
    }) => updateRelation(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siteKeys.relations() });
    },
    ...options,
  });
}

export function useDeleteRelation(
  options?: Partial<UseMutationOptions<DeleteRelationResponse, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRelation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siteKeys.relations() });
    },
    ...options,
  });
}

// ---------------------------------------------------------------------------
// React Query hooks — Site Mappings
// ---------------------------------------------------------------------------

export function useMappings(
  sourceType?: string,
  options?: Partial<UseQueryOptions<SiteMapping[]>>,
) {
  return useQuery({
    queryKey: siteKeys.mappings(sourceType),
    queryFn: () => getMappings(sourceType),
    ...options,
  });
}

export function useCreateMapping(
  options?: Partial<
    UseMutationOptions<SiteMapping, Error, CreateMappingPayload>
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMappingPayload) => createMapping(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siteKeys.mappings() });
    },
    ...options,
  });
}

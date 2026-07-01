import { getAccessToken } from "@/lib/auth";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

export const API_HOST =
  process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3005/api";

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T }> {
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
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(res.status, msg);
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiError(
      res.status,
      body.error || body.message || "Unknown API error",
    );
  }

  return { data: body.data };
}

async function apiFetchData<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { data } = await apiFetch<T>(path, options);
  return data;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MasterGeneric {
  id: string;
  name: string;
  comodity?: string;
  created_at: string;
  updated_at?: string;
}

export interface TemplateKertasKerja {
  id: string;
  site_id: string;
  supplier_id: string;
  product_id: string;
  moda_id: string;
  hop_minimum: number;
  average_usage?: number | null;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  // Joins
  site_name?: string;
  supplier_name?: string;
  product_name?: string;
  moda_name?: string;
  unit_name?: string;
  distance?: number;
  estimated_delivery_time?: number;
  upk_name?: string;
  kit_name?: string;
  site_capacity?: number | null;
  site_region?: string;
}

export interface RecordKertasKerja {
  id?: string;
  template_kertas_kerja_id: string;
  month_work: string;
  stock?: number;
  keterisian_tanki?: number;
  hop?: number;
  keterangan_hop_less_than_5?: string;
  terima?: number;
  pemakaian?: number;
  stock_akhir_bulan?: number;
  shop_akhir_bulan?: number;
  delta_terima?: number;
  pencapaian?: number;
  renominasi_pesan?: number;
  renominaso_proyeksi_akhir_bulan?: number;
  rencana_pesan?: number;
  rencana_hop?: number;
  master_pola_id?: string;
  keterangan?: string;
  detail_keterangan?: string;
}

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const kertasKerjaKeys = {
  all: ["kertasKerja"] as const,
  masters: () => [...kertasKerjaKeys.all, "master"] as const,
  master: (table: string, comodityFilter?: string) => [...kertasKerjaKeys.masters(), table, comodityFilter] as const,
  templates: () => [...kertasKerjaKeys.all, "templates"] as const,
  records: () => [...kertasKerjaKeys.all, "records"] as const,
};

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export function getMasterData(table: string, comodityFilter?: string) {
  const queryParam = comodityFilter ? `?comodity=${encodeURIComponent(comodityFilter)}` : "";
  return apiFetchData<MasterGeneric[]>(`/kertas-kerja/master/${table}${queryParam}`);
}

export function createMasterData(table: string, payload: { name: string; comodity?: string }) {
  return apiFetchData<MasterGeneric>(`/kertas-kerja/master/${table}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMasterData(table: string, id: string, payload: { name: string; comodity?: string }) {
  return apiFetchData<MasterGeneric>(`/kertas-kerja/master/${table}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteMasterData(table: string, id: string) {
  return apiFetchData<{ success: boolean; message: string }>(`/kertas-kerja/master/${table}/${id}`, {
    method: "DELETE",
  });
}

export function getTemplates() {
  return apiFetchData<TemplateKertasKerja[]>("/kertas-kerja/templates");
}

export function createTemplate(payload: any) {
  return apiFetchData<TemplateKertasKerja>("/kertas-kerja/templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTemplate(id: string, payload: any) {
  return apiFetchData<TemplateKertasKerja>(`/kertas-kerja/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTemplate(id: string) {
  return apiFetchData<{ success: boolean; message: string }>(`/kertas-kerja/templates/${id}`, {
    method: "DELETE",
  });
}

export function getRecords() {
  return apiFetchData<RecordKertasKerja[]>("/kertas-kerja/records");
}

export function bulkUpsertRecords(payload: { records: RecordKertasKerja[] }) {
  return apiFetchData<RecordKertasKerja[]>("/kertas-kerja/records/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// React Query Hooks
// ---------------------------------------------------------------------------

export function useKertasKerjaMaster(table: string, comodityFilter?: string, options?: Partial<UseQueryOptions<MasterGeneric[]>>) {
  return useQuery({
    queryKey: kertasKerjaKeys.master(table, comodityFilter),
    queryFn: () => getMasterData(table, comodityFilter),
    ...options,
  });
}

export function useCreateKertasKerjaMaster(
  table: string,
  options?: Partial<UseMutationOptions<MasterGeneric, Error, { name: string; comodity?: string }>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createMasterData(table, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: kertasKerjaKeys.master(table) });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useUpdateKertasKerjaMaster(
  table: string,
  options?: Partial<UseMutationOptions<MasterGeneric, Error, { id: string; payload: { name: string; comodity?: string } }>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateMasterData(table, id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: kertasKerjaKeys.master(table) });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useDeleteKertasKerjaMaster(
  table: string,
  options?: Partial<UseMutationOptions<{ success: boolean; message: string }, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMasterData(table, id),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: kertasKerjaKeys.master(table) });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useKertasKerjaTemplates(options?: Partial<UseQueryOptions<TemplateKertasKerja[]>>) {
  return useQuery({
    queryKey: kertasKerjaKeys.templates(),
    queryFn: () => getTemplates(),
    ...options,
  });
}

export function useCreateKertasKerjaTemplate(
  options?: Partial<UseMutationOptions<TemplateKertasKerja, Error, any>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createTemplate(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: kertasKerjaKeys.templates() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useUpdateKertasKerjaTemplate(
  options?: Partial<UseMutationOptions<TemplateKertasKerja, Error, { id: string; payload: any }>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateTemplate(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: kertasKerjaKeys.templates() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useDeleteKertasKerjaTemplate(
  options?: Partial<UseMutationOptions<{ success: boolean; message: string }, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: kertasKerjaKeys.templates() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useKertasKerjaRecords(options?: Partial<UseQueryOptions<RecordKertasKerja[]>>) {
  return useQuery({
    queryKey: kertasKerjaKeys.records(),
    queryFn: () => getRecords(),
    ...options,
  });
}

export function useBulkUpsertKertasKerjaRecords(
  options?: Partial<UseMutationOptions<RecordKertasKerja[], Error, { records: RecordKertasKerja[] }>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => bulkUpsertRecords(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: kertasKerjaKeys.records() });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

import { DASHBOARD_API_HOST } from "./dashboard-api";
import { getAccessToken } from "@/lib/auth";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

export interface BbmRecord {
  id?: string;
  reportDate: string;
  pembangkit: string;
  tbbm: string;
  product: string;
  nomination: number;
  usage: number;
  realization: number;
  moda?: string;
  unit?: string;
}

export interface CreateBbmPayload {
  monthDate: string;
  siteId: string;
  supplierId: string;
  product: string;
  moda?: string;
  unit: string;
  nomination?: number;
  realization?: number;
  usage?: number;
}

export const bbmKeys = {
  all: ["bbm"] as const,
  monthly: () => [...bbmKeys.all, "monthly"] as const,
};

export async function getBbmMonthly(): Promise<BbmRecord[]> {
  const url = `${DASHBOARD_API_HOST}/bbm-monthly`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`BBM API error: ${res.statusText}`);
  }

  // Handle both { success: true, data: [...] } and directly [...]
  const body = await res.json();
  if (Array.isArray(body)) {
    return body;
  }

  if (!body.success) {
    throw new Error(body.message || "Unknown BBM API error");
  }

  return body.data as BbmRecord[];
}

export function useBbmMonthly(options?: Partial<UseQueryOptions<BbmRecord[]>>) {
  return useQuery({
    queryKey: bbmKeys.monthly(),
    queryFn: getBbmMonthly,
    ...options,
  });
}

export async function createBbmMonthly(
  payload: CreateBbmPayload,
): Promise<BbmRecord> {
  const url = `${DASHBOARD_API_HOST}/bbm-monthly`;
  const accessToken = getAccessToken();

  console.log("createBbmMonthly", payload);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`BBM API error: ${res.statusText}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown BBM API error");
  }

  return body.data as BbmRecord;
}

export function useCreateBbmMonthly(
  options?: Partial<UseMutationOptions<BbmRecord, Error, CreateBbmPayload>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBbmPayload) => createBbmMonthly(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: bbmKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export async function createBbmMonthlyBulk(
  payload: CreateBbmPayload[],
): Promise<{ count: number; inserted: boolean }> {
  const url = `${DASHBOARD_API_HOST}/bbm-monthly/bulk`;
  const accessToken = getAccessToken();

  console.log("createBbmMonthlyBulk", payload);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`BBM Bulk API error: ${res.statusText}`);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(body.message || "Unknown BBM API error");
  }

  return body.data as { count: number; inserted: boolean };
}

export function useCreateBbmMonthlyBulk(
  options?: Partial<UseMutationOptions<{ count: number; inserted: boolean }, Error, CreateBbmPayload[]>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBbmPayload[]) => createBbmMonthlyBulk(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: bbmKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export async function getBbmMonthlyById(id: string): Promise<BbmRecord> {
  const url = `${DASHBOARD_API_HOST}/bbm-monthly/${id}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`BBM API error: ${res.statusText}`);
  }

  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message || "Unknown BBM API error");
  }

  return body.data as BbmRecord;
}

export function useBbmMonthlyById(id: string, options?: Partial<UseQueryOptions<BbmRecord>>) {
  return useQuery({
    queryKey: [...bbmKeys.all, "detail", id],
    queryFn: () => getBbmMonthlyById(id),
    enabled: !!id,
    ...options,
  });
}

export async function updateBbmMonthly(id: string, payload: Partial<CreateBbmPayload>): Promise<BbmRecord> {
  const url = `${DASHBOARD_API_HOST}/bbm-monthly/${id}`;
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
    throw new Error(`BBM API error: ${res.statusText}`);
  }

  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message || "Unknown BBM API error");
  }

  return body.data as BbmRecord;
}

export function useUpdateBbmMonthly(
  options?: Partial<UseMutationOptions<BbmRecord, Error, { id: string; payload: Partial<CreateBbmPayload> }>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateBbmMonthly(id, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: bbmKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export async function deleteBbmMonthly(id: string): Promise<boolean> {
  const url = `${DASHBOARD_API_HOST}/bbm-monthly/${id}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`BBM API error: ${res.statusText}`);
  }

  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message || "Unknown BBM API error");
  }

  return true;
}

export function useDeleteBbmMonthly(
  options?: Partial<UseMutationOptions<boolean, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBbmMonthly(id),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: bbmKeys.all });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

// ────────────────────────────────────────────
// TOP 5 ANALYTICS
// ────────────────────────────────────────────

export interface BbmTopVolumeRecord {
  name: string;
  totalVolume: number;
  rank: number;
}

export interface BbmTopFilters {
  startDate?: string;
  endDate?: string;
  product?: string;
  moda?: string;
  tbbm?: string;
  pembangkit?: string;
  interval?: "day" | "month" | "year";
}

async function fetchTopVolume(
  endpoint: string,
  filters?: BbmTopFilters,
): Promise<BbmTopVolumeRecord[]> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.product) params.append("product", filters.product);
  if (filters?.moda) params.append("moda", filters.moda);
  if (filters?.tbbm) params.append("tbbm", filters.tbbm);
  if (filters?.pembangkit) params.append("pembangkit", filters.pembangkit);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const url = `${DASHBOARD_API_HOST}/bbm-monthly/${endpoint}${qs}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`BBM ${endpoint} API error: ${res.statusText}`);
  }

  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message || `Unknown error fetching ${endpoint}`);
  }

  return body.data as BbmTopVolumeRecord[];
}

export function useTopTbbm(
  filters?: BbmTopFilters,
  options?: Partial<UseQueryOptions<BbmTopVolumeRecord[]>>,
) {
  return useQuery({
    queryKey: [...bbmKeys.all, "top-tbbm", filters],
    queryFn: () => fetchTopVolume("top-tbbm", filters),
    ...options,
  });
}

export function useTopPembangkit(
  filters?: BbmTopFilters,
  options?: Partial<UseQueryOptions<BbmTopVolumeRecord[]>>,
) {
  return useQuery({
    queryKey: [...bbmKeys.all, "top-pembangkit", filters],
    queryFn: () => fetchTopVolume("top-pembangkit", filters),
    ...options,
  });
}

// ────────────────────────────────────────────
// REALIZATION BY MODA (Composite Chart)
// ────────────────────────────────────────────

export interface BbmRealizationByModaResponse {
  chartData: Array<Record<string, unknown> & {
    reportDate: string;
    total: number;
    cumulative: number;
    nomination: number;
  }>;
  modaKeys: string[];
  nomination: number;
}

export async function getRealizationByModa(
  filters?: BbmTopFilters,
): Promise<BbmRealizationByModaResponse> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.product) params.append("product", filters.product);
  if (filters?.moda) params.append("moda", filters.moda);
  if (filters?.tbbm) params.append("tbbm", filters.tbbm);
  if (filters?.pembangkit) params.append("pembangkit", filters.pembangkit);
  if (filters?.interval) params.append("interval", filters.interval);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const url = `${DASHBOARD_API_HOST}/bbm-monthly/realization-by-moda${qs}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`BBM realization-by-moda API error: ${res.statusText}`);
  }

  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message || "Unknown error fetching realization-by-moda");
  }

  return body.data as BbmRealizationByModaResponse;
}

export function useRealizationByModa(
  filters?: BbmTopFilters,
  options?: Partial<UseQueryOptions<BbmRealizationByModaResponse>>,
) {
  return useQuery({
    queryKey: [...bbmKeys.all, "realization-by-moda", filters],
    queryFn: () => getRealizationByModa(filters),
    ...options,
  });
}
export interface BbmSiteSummary {
  id: string;
  name: string;
  siteType: string;
  commodity: string;
  lat: number;
  lng: number;
  region: string;
  isEnabled: boolean;
  capacity?: string | null;
  owner?: string | null;
  totalNominasi: number;
  totalRealisasi: number;
  totalPemakaian: number;
  pembangkitList?: {
    id: string;
    name: string;
    siteType?: string;
    totalNominasi?: number;
    totalRealisasi?: number;
    totalPemakaian?: number;
    [key: string]: any;
  }[];
  pemasokList?: {
    id: string;
    name: string;
    siteType?: string;
    totalNominasi?: number;
    totalRealisasi?: number;
    totalPemakaian?: number;
    [key: string]: any;
  }[];
}

export async function getBbmSitesSummary(filters?: {
  moda?: string;
  product?: string;
}): Promise<BbmSiteSummary[]> {
  const params = new URLSearchParams();
  if (filters?.moda) params.append("moda", filters.moda);
  if (filters?.product) params.append("product", filters.product);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const url = `${DASHBOARD_API_HOST}/bbm-monthly/sites-summary${qs}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`BBM Sites Summary API error: ${res.statusText}`);
  }

  const body = await res.json();
  if (Array.isArray(body)) {
    return body;
  }
  if (!body.success) {
    throw new Error(body.message || "Unknown error");
  }
  return body.data as BbmSiteSummary[];
}

export function useBbmSitesSummary(
  filters?: { moda?: string; product?: string },
  options?: Partial<UseQueryOptions<BbmSiteSummary[]>>
) {
  return useQuery({
    queryKey: [...bbmKeys.all, "sites-summary", filters],
    queryFn: () => getBbmSitesSummary(filters),
    ...options,
  });
}

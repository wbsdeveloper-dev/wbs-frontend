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

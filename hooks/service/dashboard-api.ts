// Dashboard API service — all dashboard endpoints from the
// WBS Platform Backend API Postman collection.

import { ApiError, type ApiResponse } from "./bot-api";
import { getAccessToken } from "@/lib/auth";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

export const DASHBOARD_API_HOST =
  process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3005/api";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/** GET /dashboard/map-locations */
export interface MapSite {
  id: string;
  name: string;
  siteType:
    | "PEMBANGKIT"
    | "PEMASOK"
    | "TRANSPORTIR"
    | "TERMINAL"
    | "HANDOVER_POINT";
  lat: string | null;
  lng: string | null;
  region: string;
  isEnabled: boolean;
  capacity?: string;
  owner?: string;
  commodity?: string | null;
}

export interface MapPipe {
  id: string;
  sourceSiteId: string;
  targetSiteId: string;
  relationType: string;
  status: string;
  commodity: string;
}

export interface SiteTypeLegend {
  type: string;
  label: string;
  color: string;
}

export interface PipeTypeLegend {
  type: string;
  label: string;
  color: string;
}

export interface MapLegend {
  siteTypes: SiteTypeLegend[];
  pipeTypes: PipeTypeLegend[];
}

export interface MapLocationsResponse {
  sites: MapSite[];
  pipes: MapPipe[];
  legend: MapLegend;
}

/** GET /dashboard/supplier-contract-summaries */
export interface SupplierContractSummary {
  supplierSiteId: string;
  supplierName: string;
  representativeContractId: string;
  effectiveContractNumber: string;
  year: number;
  jphBbtud: number | null;
  topBbtud: number | null;
  tjkBbtud: number | null;
  updatedAt: string;
}

export interface SupplierContractSummariesResponse {
  year: number;
  items: SupplierContractSummary[];
}

/** GET /dashboard/distribution */
export interface DistributionItem {
  name: string;
  value: number;
  percentage: number;
  unit: string;
}

export interface DistributionResponse {
  date: string;
  by: "supplier" | "plant";
  total: number;
  unit: string;
  items: DistributionItem[];
}

/** GET /dashboard/top-suppliers & /dashboard/top-plants */
export interface TopItem {
  rank: number;
  siteId: string;
  name: string;
  value: number;
  percentage: number;
}

export interface TopResponse {
  period: { start: string; end: string };
  unit: string;
  items: TopItem[];
}

/** GET /dashboard/chart/flow */
export interface ChartFlowDataPoint {
  timestamp: string;
  value: number;
  flowrate?: number;
}

export interface ChartFlowSeries {
  siteId: string;
  name: string;
  dataPoints: ChartFlowDataPoint[];
  flowratePercentage: number | null;
}

export interface ChartFlowReferenceLines {
  jph: number | null;
  top: number | null;
  mean: number | null;
}

export interface ChartFlowSummary {
  totalVolume: number;
  avgVolume: number;
  jph: number;
  top: number;
  topPercentage: number;
  hargaPjbg: string;
  realisasi: number;
  flowrate: number;
}

export interface ChartFlowPeriodSummary {
  timestamp: string;
  totalVolume: number;
  siteCount: number;
}

export interface ChartFlowResponse {
  period: { start: string; end: string };
  granularity: "hour" | "day" | "month" | "year";
  by: "supplier" | "plant";
  unit: string;
  series: ChartFlowSeries[];
  referenceLines: ChartFlowReferenceLines;
  summary: ChartFlowSummary;
  periodSummary: ChartFlowPeriodSummary[];
}

/** GET /dashboard/contract-info */
export interface ContractUnitDipasok {
  siteId: string;
  name: string;
  siteType: string;
}

export interface ContractInfo {
  id: string;
  jenisKontrak: string;
  docType: string;
  region: string;
  nomorKontrak: string;
  jangkaWaktu: { start: string; end: string };
  volumeJph: { value: number; unit: string; notes: string };
  volumeTop: { value: number; percentage: number; notes: string };
  volumeJpmh: number | null;
  hargaPjbg: { value: string; unit: string };
  unitYangDipasok: ContractUnitDipasok[];
}

export interface ContractInfoResponse {
  contract: ContractInfo;
}

/** GET /dashboard/events */
export interface DashboardEvent {
  id: string;
  siteId: string;
  siteName: string;
  occurredAt: string;
  created_at?: string;
  createdAt?: string;
  title: string;
  description: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  document?: string;
  user?: {
    fullName: string | null;
    roles: string[];
  } | null;
}

/** POST /dashboard/events */
export interface CreateEventPayload {
  siteId?: string;
  siteName: string;
  occurredAt: string;
  title: string;
  description: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  document?: string;
}

export interface EventsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EventsResponse {
  events: DashboardEvent[];
  pagination: EventsPagination;
}

/** GET /dashboard/filters */
export interface FilterOption {
  id: string;
  name: string;
  commodity?: string | null;
}

export interface DashboardFilters {
  pemasok: FilterOption[];
  pembangkit: FilterOption[];
  transportir: FilterOption[];
  regions: string[];
  severities: string[];
}

/** GET /dashboard/summary */
/** GET /dashboard/pemasok-bbtud-snapshot */
export interface PemasokBbtudEntry {
  siteId: string;
  siteName: string;
  bbtud: number | null;
}

export interface PemasokBbtudSnapshot {
  supplierId: string;
  supplierName: string;
  reportDate: string;
  pembangkits: PemasokBbtudEntry[];
}

export interface DashboardSummary {
  period: {
    start: string;
    end: string;
  };
  volume: {
    total: number;
    unit: string;
  };
  contracts: {
    active: number;
    total: number;
  };
  relations: {
    active: number;
    total: number;
  };
  reconciliation: {
    totalRecords: number;
    matchCount: number;
    mismatchCount: number;
    needReviewCount: number;
    matchRate: number;
  };
}

// ---------------------------------------------------------------------------
// Base fetcher (with automatic auth header injection)
// ---------------------------------------------------------------------------

export async function dashboardFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${DASHBOARD_API_HOST}${path}`;
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
      if (body.message) msg = body.message;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(res.status, msg);
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiError(res.status, body.message || "Unknown API error");
  }

  return body.data;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const dashboardKeys = {
  all: ["dashboard"] as const,
  mapLocations: (region?: string, commodity?: string) =>
    [...dashboardKeys.all, "map-locations", region, commodity] as const,
  supplierContractSummaries: (year: number, commodity?: string) =>
    [
      ...dashboardKeys.all,
      "supplier-contract-summaries",
      year,
      commodity,
    ] as const,
  distribution: (
    startDate: string,
    endDate: string,
    by: string,
    region?: string,
  ) =>
    [
      ...dashboardKeys.all,
      "distribution",
      startDate,
      endDate,
      by,
      region,
    ] as const,
  topSuppliers: (
    startDate: string,
    endDate: string,
    limit?: number,
    region?: string,
    commodity?: string,
  ) =>
    [
      ...dashboardKeys.all,
      "top-suppliers",
      startDate,
      endDate,
      limit,
      region,
      commodity,
    ] as const,
  topPlants: (
    startDate: string,
    endDate: string,
    limit?: number,
    region?: string,
    commodity?: string,
  ) =>
    [
      ...dashboardKeys.all,
      "top-plants",
      startDate,
      endDate,
      limit,
      region,
      commodity,
    ] as const,
  chartFlow: (
    startDate: string,
    endDate: string,
    granularity: string,
    by: string,
    pemasokId?: string,
    pembangkitId?: string,
    region?: string,
    commodity?: string,
  ) =>
    [
      ...dashboardKeys.all,
      "chart-flow",
      startDate,
      endDate,
      granularity,
      by,
      pemasokId,
      pembangkitId,
      region,
      commodity,
    ] as const,
  contractInfo: (pemasokId?: string, pembangkitId?: string) =>
    [...dashboardKeys.all, "contract-info", pemasokId, pembangkitId] as const,
  events: (
    startDate: string,
    endDate: string,
    limit?: number,
    page?: number,
    siteId?: string,
    severity?: string,
  ) =>
    [
      ...dashboardKeys.all,
      "events",
      startDate,
      endDate,
      limit,
      page,
      siteId,
      severity,
    ] as const,
  filters: (
    pemasokId?: string,
    pembangkitId?: string,
    region?: string,
    commodity?: string,
  ) =>
    [
      ...dashboardKeys.all,
      "filters",
      pemasokId,
      pembangkitId,
      region,
      commodity,
    ] as const,
  summary: (startDate: string, endDate: string) =>
    [...dashboardKeys.all, "summary", startDate, endDate] as const,
  pemasokBbtudSnapshot: () =>
    [...dashboardKeys.all, "pemasok-bbtud-snapshot"] as const,
};

// ---------------------------------------------------------------------------
// API functions
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

export async function getMapLocations(region?: string, commodity?: string) {
  return dashboardFetch<MapLocationsResponse>(
    `/dashboard/map-locations${buildQuery({ region, commodity })}`,
  );
}

export async function getSupplierContractSummaries(
  year: number,
  commodity?: string,
) {
  return dashboardFetch<SupplierContractSummariesResponse>(
    `/dashboard/supplier-contract-summaries${buildQuery({ year, commodity })}`,
  );
}

export async function getDistribution(
  startDate: string,
  endDate: string,
  by: "supplier" | "plant",
  region?: string,
) {
  return dashboardFetch<DistributionResponse>(
    `/dashboard/distribution${buildQuery({ startDate, endDate, by, region })}`,
  );
}

export async function getTopSuppliers(
  startDate: string,
  endDate: string,
  limit?: number,
  region?: string,
  commodity?: string,
) {
  return dashboardFetch<TopResponse>(
    `/dashboard/top-suppliers${buildQuery({ startDate, endDate, limit, region, commodity })}`,
  );
}

export async function getTopPlants(
  startDate: string,
  endDate: string,
  limit?: number,
  region?: string,
  commodity?: string,
) {
  return dashboardFetch<TopResponse>(
    `/dashboard/top-plants${buildQuery({ startDate, endDate, limit, region, commodity })}`,
  );
}

export async function getChartFlow(
  startDate: string,
  endDate: string,
  granularity: "hour" | "day" | "month" | "year",
  by: "supplier" | "plant",
  pemasokId?: string,
  pembangkitId?: string,
  region?: string,
  commodity?: string,
) {
  return dashboardFetch<ChartFlowResponse>(
    `/dashboard/chart/flow${buildQuery({ startDate, endDate, granularity, by, pemasokId, pembangkitId, region, commodity })}`,
  );
}

export async function getContractInfo(
  pemasokId?: string,
  pembangkitId?: string,
  contractId?: string,
) {
  return dashboardFetch<ContractInfoResponse>(
    `/dashboard/contract-info${buildQuery({ pemasokId, pembangkitId, contractId })}`,
  );
}

export async function getEvents(
  startDate: string,
  endDate: string,
  limit?: number,
  page?: number,
  siteId?: string,
  severity?: string,
) {
  return dashboardFetch<EventsResponse>(
    `/dashboard/events${buildQuery({ startDate, endDate, limit, page, siteId, severity })}`,
  );
}

export async function createEvent(payload: CreateEventPayload) {
  return dashboardFetch<DashboardEvent>("/dashboard/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadEventFile(
  file: File,
): Promise<{ filename: string }> {
  const url = `${DASHBOARD_API_HOST}/dashboard/events/upload`;
  const accessToken = getAccessToken();

  const formData = new FormData();
  formData.append("bukti", file);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      if (body.message) msg = body.message;
      else if (body.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }

  const body = (await res.json()) as ApiResponse<{ filename: string }>;
  if (!body.success) {
    throw new ApiError(res.status, body.message || "Gagal mengunggah file");
  }

  return body.data;
}

export async function deleteEvent(id: string) {
  return dashboardFetch<null>(`/dashboard/events/${id}`, {
    method: "DELETE",
  });
}

export async function getFilters(
  pemasokId?: string,
  pembangkitId?: string,
  region?: string,
  commodity?: string,
) {
  return dashboardFetch<DashboardFilters>(
    `/dashboard/filters${buildQuery({ pemasokId, pembangkitId, region, commodity })}`,
  );
}

export async function getSummary(startDate: string, endDate: string) {
  return dashboardFetch<DashboardSummary>(
    `/dashboard/summary${buildQuery({ startDate, endDate })}`,
  );
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function useMapLocations(
  region?: string,
  commodity?: string,
  options?: Partial<UseQueryOptions<MapLocationsResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.mapLocations(region, commodity),
    queryFn: () => getMapLocations(region, commodity),
    ...options,
  });
}

export function useDistribution(
  startDate: string,
  endDate: string,
  by: "supplier" | "plant",
  region?: string,
  options?: Partial<UseQueryOptions<DistributionResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.distribution(startDate, endDate, by, region),
    queryFn: () => getDistribution(startDate, endDate, by, region),
    ...options,
  });
}

export function useTopSuppliers(
  startDate: string,
  endDate: string,
  limit?: number,
  region?: string,
  commodity?: string,
  options?: Partial<UseQueryOptions<TopResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.topSuppliers(
      startDate,
      endDate,
      limit,
      region,
      commodity,
    ),
    queryFn: () =>
      getTopSuppliers(startDate, endDate, limit, region, commodity),
    ...options,
  });
}

export function useTopPlants(
  startDate: string,
  endDate: string,
  limit?: number,
  region?: string,
  commodity?: string,
  options?: Partial<UseQueryOptions<TopResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.topPlants(
      startDate,
      endDate,
      limit,
      region,
      commodity,
    ),
    queryFn: () => getTopPlants(startDate, endDate, limit, region, commodity),
    ...options,
  });
}

export function useChartFlow(
  startDate: string,
  endDate: string,
  granularity: "hour" | "day" | "month" | "year",
  by: "supplier" | "plant",
  pemasokId?: string,
  pembangkitId?: string,
  region?: string,
  commodity?: string,
  options?: Partial<UseQueryOptions<ChartFlowResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.chartFlow(
      startDate,
      endDate,
      granularity,
      by,
      pemasokId,
      pembangkitId,
      region,
      commodity,
    ),
    queryFn: () =>
      getChartFlow(
        startDate,
        endDate,
        granularity,
        by,
        pemasokId,
        pembangkitId,
        region,
        commodity,
      ),
    ...options,
  });
}

export function useContractInfo(
  pemasokId?: string,
  pembangkitId?: string,
  contractId?: string,
  options?: Partial<UseQueryOptions<ContractInfoResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.contractInfo(pemasokId, pembangkitId),
    queryFn: () => getContractInfo(pemasokId, pembangkitId, contractId),
    ...options,
  });
}

export function useEvents(
  startDate: string,
  endDate: string,
  limit?: number,
  page?: number,
  siteId?: string,
  severity?: string,
  options?: Partial<UseQueryOptions<EventsResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.events(
      startDate,
      endDate,
      limit,
      page,
      siteId,
      severity,
    ),
    queryFn: () => getEvents(startDate, endDate, limit, page, siteId, severity),
    ...options,
  });
}

export function useCreateEvent(
  options?: Partial<
    UseMutationOptions<DashboardEvent, Error, CreateEventPayload>
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    ...options,
  });
}

export function useDeleteEvent(
  options?: Partial<UseMutationOptions<null, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    ...options,
  });
}

export function useFilters(
  pemasokId?: string,
  pembangkitId?: string,
  region?: string,
  commodity?: string,
  options?: Partial<UseQueryOptions<DashboardFilters>>,
) {
  return useQuery({
    queryKey: dashboardKeys.filters(pemasokId, pembangkitId, region, commodity),
    queryFn: () => getFilters(pemasokId, pembangkitId, region, commodity),
    staleTime: 5 * 60 * 1000, // filters change rarely
    ...options,
  });
}

export function useSummary(
  startDate: string,
  endDate: string,
  options?: Partial<UseQueryOptions<DashboardSummary>>,
) {
  return useQuery({
    queryKey: dashboardKeys.summary(startDate, endDate),
    queryFn: () => getSummary(startDate, endDate),
    ...options,
  });
}

// ==========================================
// Transportir Chart Data
// ==========================================

export interface TransportirChartHulu {
  upstreamName: string;
  value: string;
}

export interface TransportirChartHilir {
  upstreamName: string;
  downstreamName: string;
  value: string;
}

export interface TransportirChartResponse {
  hulu: TransportirChartHulu[];
  hilir: TransportirChartHilir[];
  stock: {
    openingStock: string;
    closingStock: string;
  };
}

export function useTransportirChart(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["transportir_chart", startDate, endDate],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
      });

      const url = `${DASHBOARD_API_HOST}/dashboard/chart/transportir?${queryParams.toString()}`;
      const accessToken = getAccessToken();

      const res = await fetch(url, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch transportir chart data");
      }

      const body = await res.json();
      return body.data as TransportirChartResponse;
    },
    enabled: !!startDate && !!endDate,
  });
}

// ==========================================
// Supplier Contract Summaries
// ==========================================

export function useSupplierContractSummaries(
  year: number,
  commodity?: string,
  options?: Partial<UseQueryOptions<SupplierContractSummariesResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.supplierContractSummaries(year, commodity),
    queryFn: () => getSupplierContractSummaries(year, commodity),
    enabled: Number.isInteger(year) && year > 0,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// ==========================================
// Pemasok BBTUD Snapshot (D-1)
// ==========================================

export async function getPemasokBbtudSnapshot(): Promise<
  PemasokBbtudSnapshot[]
> {
  return dashboardFetch<PemasokBbtudSnapshot[]>(
    "/dashboard/pemasok-bbtud-snapshot",
  );
}

export function usePemasokBbtudSnapshot(
  options?: Partial<UseQueryOptions<PemasokBbtudSnapshot[]>>,
) {
  return useQuery({
    queryKey: dashboardKeys.pemasokBbtudSnapshot(),
    queryFn: () => getPemasokBbtudSnapshot(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

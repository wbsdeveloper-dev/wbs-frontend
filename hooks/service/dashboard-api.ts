// Dashboard API service — all dashboard endpoints from the
// WBS Platform Backend API Postman collection.

import { ApiError, type ApiResponse } from "./bot-api";
import { getAccessToken } from "@/lib/auth";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

export const DASHBOARD_API_HOST = "http://localhost:3001/api";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/** GET /dashboard/map-locations */
export interface MapLocation {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  region: string;
  status: string;
  details?: Record<string, unknown>;
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
}

export interface ChartFlowSeries {
  siteId: string;
  name: string;
  dataPoints: ChartFlowDataPoint[];
}

export interface ChartFlowReferenceLines {
  jph: number;
  top: number;
  mean: number;
}

export interface ChartFlowSummary {
  totalVolume: number;
  avgVolume: number;
  jph: number;
  top: number;
  topPercentage: number;
  hargaPjbg: number;
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
  granularity: "hour" | "day" | "month";
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
  hargaPjbg: { value: number; unit: string };
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
  title: string;
  description: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
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
}

export interface DashboardFilters {
  pemasok: FilterOption[];
  pembangkit: FilterOption[];
  transportir: FilterOption[];
  regions: string[];
  severities: string[];
}

/** GET /dashboard/summary */
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
  mapLocations: (region?: string) =>
    [...dashboardKeys.all, "map-locations", region] as const,
  distribution: (date: string, by: string) =>
    [...dashboardKeys.all, "distribution", date, by] as const,
  topSuppliers: (startDate: string, endDate: string, limit?: number) =>
    [...dashboardKeys.all, "top-suppliers", startDate, endDate, limit] as const,
  topPlants: (startDate: string, endDate: string, limit?: number) =>
    [...dashboardKeys.all, "top-plants", startDate, endDate, limit] as const,
  chartFlow: (
    startDate: string,
    endDate: string,
    granularity: string,
    by: string,
    pemasokId?: string,
    pembangkitId?: string,
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
    ] as const,
  contractInfo: (pemasokId: string) =>
    [...dashboardKeys.all, "contract-info", pemasokId] as const,
  events: (startDate: string, endDate: string, limit?: number, page?: number) =>
    [...dashboardKeys.all, "events", startDate, endDate, limit, page] as const,
  filters: () => [...dashboardKeys.all, "filters"] as const,
  summary: (startDate: string, endDate: string) =>
    [...dashboardKeys.all, "summary", startDate, endDate] as const,
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

export async function getMapLocations(region?: string) {
  return dashboardFetch<MapLocation[]>(
    `/dashboard/map-locations${buildQuery({ region })}`,
  );
}

export async function getDistribution(date: string, by: "supplier" | "plant") {
  return dashboardFetch<DistributionResponse>(
    `/dashboard/distribution${buildQuery({ date, by })}`,
  );
}

export async function getTopSuppliers(
  startDate: string,
  endDate: string,
  limit?: number,
) {
  return dashboardFetch<TopResponse>(
    `/dashboard/top-suppliers${buildQuery({ startDate, endDate, limit })}`,
  );
}

export async function getTopPlants(
  startDate: string,
  endDate: string,
  limit?: number,
) {
  return dashboardFetch<TopResponse>(
    `/dashboard/top-plants${buildQuery({ startDate, endDate, limit })}`,
  );
}

export async function getChartFlow(
  startDate: string,
  endDate: string,
  granularity:
    | "hour"
    | "day"
    | "month"
    | "three_month"
    | "six_month"
    | "one_year",
  by: "supplier" | "plant",
  pemasokId?: string,
  pembangkitId?: string,
) {
  return dashboardFetch<ChartFlowResponse>(
    `/dashboard/chart/flow${buildQuery({ startDate, endDate, granularity, by, pemasokId, pembangkitId })}`,
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

export async function getFilters() {
  return dashboardFetch<DashboardFilters>("/dashboard/filters");
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
  options?: Partial<UseQueryOptions<MapLocation[]>>,
) {
  return useQuery({
    queryKey: dashboardKeys.mapLocations(region),
    queryFn: () => getMapLocations(region),
    ...options,
  });
}

export function useDistribution(
  date: string,
  by: "supplier" | "plant",
  options?: Partial<UseQueryOptions<DistributionResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.distribution(date, by),
    queryFn: () => getDistribution(date, by),
    ...options,
  });
}

export function useTopSuppliers(
  startDate: string,
  endDate: string,
  limit?: number,
  options?: Partial<UseQueryOptions<TopResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.topSuppliers(startDate, endDate, limit),
    queryFn: () => getTopSuppliers(startDate, endDate, limit),
    ...options,
  });
}

export function useTopPlants(
  startDate: string,
  endDate: string,
  limit?: number,
  options?: Partial<UseQueryOptions<TopResponse>>,
) {
  return useQuery({
    queryKey: dashboardKeys.topPlants(startDate, endDate, limit),
    queryFn: () => getTopPlants(startDate, endDate, limit),
    ...options,
  });
}

export function useChartFlow(
  startDate: string,
  endDate: string,
  granularity:
    | "hour"
    | "day"
    | "month"
    | "three_month"
    | "six_month"
    | "one_year",
  by: "supplier" | "plant",
  pemasokId?: string,
  pembangkitId?: string,
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
    ),
    queryFn: () =>
      getChartFlow(
        startDate,
        endDate,
        granularity,
        by,
        pemasokId,
        pembangkitId,
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
    queryKey: dashboardKeys.contractInfo(pemasokId ?? ""),
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
    queryKey: dashboardKeys.events(startDate, endDate, limit, page),
    queryFn: () => getEvents(startDate, endDate, limit, page, siteId, severity),
    ...options,
  });
}

export function useFilters(
  options?: Partial<UseQueryOptions<DashboardFilters>>,
) {
  return useQuery({
    queryKey: dashboardKeys.filters(),
    queryFn: getFilters,
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

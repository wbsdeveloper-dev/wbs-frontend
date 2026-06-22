import { dashboardFetch } from "./dashboard-api";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

export interface ReportRecord {
  ID: number;
  CABANG_PELAKSANA: string;
  LOADING_PORT: string;
  WORK_DATE: string;
  UPDATE_HPL_USER: string | null;
  CLIENT_SITE_NAME: string;
  INTERVENTION_NAME: string | null;
  CREATE_TIME: string;
  CREATE_USER: string;
  MODIFY_USER: string | null;
  MODIFY_TIME: string | null;
  MODE_NAME: string;
  JENIS_DOKUMEN: string | null;
  STATUS_DOKUMEN: string | null;
  UPDATE_HPL_TIME: string | null;
  HPL: string[] | null;
  STATUS: string;
  CONTRACT_ID: number;
  PRODUCT_NAME: string | null;
  SELECT_MODE: string;
  QUALITY_FILE: string | null;
  DO_NUMBER: string | null;
  ISSUE: string | null;
  VOLUME: number | null;
}

export interface ReportsResponse {
  data: ReportRecord[];
  total: number;
  size: number;
  offset: number;
}

export interface ReportsParams {
  page?: number;
  limit?: number;
  // add other filters if needed
}

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

export async function getReports(params?: ReportsParams): Promise<ReportsResponse> {
  const query = params ? buildQuery({
    limit: params.limit,
    offset: params.page ? (params.page - 1) * (params.limit || 10) : 0,
  }) : "";
  
  // We use the proxy endpoint /ctms-reports which forwards to api/web/v2/reports
  return dashboardFetch<ReportsResponse>(`/ctms-reports${query}`);
}

export const reportsKeys = {
  all: ["reports"] as const,
  list: (params?: ReportsParams) => [...reportsKeys.all, "list", params] as const,
};

export function useReports(
  params?: ReportsParams,
  options?: Partial<UseQueryOptions<ReportsResponse>>,
) {
  return useQuery({
    queryKey: reportsKeys.list(params),
    queryFn: () => getReports(params),
    ...options,
  });
}

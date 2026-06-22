import { DASHBOARD_API_HOST } from "./dashboard-api";
import { getAccessToken } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface TransportirExcelConfig {
  sheets: string[];
  report_date_prefix?: string;
  hulu: {
    search_column: string;
    start_row: number;
    col_mmscf: string;
    col_mmbtu: string;
    convert_mmscf?: boolean;
    convert_mmbtu?: boolean;
    keywords: {
      label: string;
      upstream_id: string;
    }[];
  };
  hilir: {
    search_column: string;
    start_row: number;
    col_mmscf: string;
    col_mmbtu: string;
    convert_mmscf?: boolean;
    convert_mmbtu?: boolean;
    keywords: {
      label: string;
      upstream_id: string;
      downstream_id: string;
    }[];
  };
  stock: {
    search_column: string;
    keyword: string;
    col_start: string;
    col_end: string;
    key_mapping: string[];
    convert_bbtu?: boolean;
  };
}

export interface UploadTransportirExcelResponse {
  success: boolean;
  message?: string;
  summary?: {
    sheets_processed: number;
    transportir_resume_upserted: number;
    reconciliation_inserted: number;
    errors: any[];
  };
}

export async function uploadTransportirExcel(
  file: File,
  config: TransportirExcelConfig
): Promise<UploadTransportirExcelResponse> {
  const url = `${DASHBOARD_API_HOST}/excel/upload`;
  const accessToken = getAccessToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("config", JSON.stringify(config));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message || "Unknown error during upload");
  }

  return body;
}

export function useUploadTransportirExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, config }: { file: File; config: TransportirExcelConfig }) =>
      uploadTransportirExcel(file, config),
    onSuccess: () => {
      // Invalidate queries that might be affected
      qc.invalidateQueries({ queryKey: ["transportir_resume"] });
    },
  });
}

export interface TransportirResumeParams {
  page?: number;
  limit?: number;
  shipper?: string;
  start_date?: string;
  end_date?: string;
}

export function useTransportirResume(params: TransportirResumeParams = {}) {
  return useQuery({
    queryKey: ["transportir_resume", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.shipper) queryParams.append("shipper", params.shipper);
      if (params.start_date) queryParams.append("start_date", params.start_date);
      if (params.end_date) queryParams.append("end_date", params.end_date);
      
      const url = `${DASHBOARD_API_HOST}/transportir/resume?${queryParams.toString()}`;
      const accessToken = getAccessToken();
      const res = await fetch(url, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch transportir resume");
      const body = await res.json();
      return body.data; // Now contains { data: [...], pagination: {...} }
    },
  });
}

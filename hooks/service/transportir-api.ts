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

export type TransportirUploadError =
  | string
  | {
    sheet?: string;
    row?: number;
    group?: "stock" | "hulu" | "hilir" | string;
    keyword?: string;
    reason?: string;
    message?: string;
    error?: string;
    [key: string]: unknown;
  };

export interface UploadTransportirExcelResponse {
  success: boolean;
  message?: string;
  summary?: {
    sheets_processed: number;
    transportir_resume_upserted: number;
    reconciliation_inserted: number;
    errors: TransportirUploadError[];
  };
}

function getUploadErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;

  const responseBody = body as {
    message?: unknown;
    error?: unknown;
  };

  if (typeof responseBody.message === "string") return responseBody.message;
  if (typeof responseBody.error === "string") return responseBody.error;

  if (responseBody.error && typeof responseBody.error === "object") {
    const nestedMessage = (responseBody.error as { message?: unknown }).message;
    if (typeof nestedMessage === "string") return nestedMessage;
  }

  return fallback;
}

export async function uploadTransportirExcel(
  file: File,
  config: TransportirExcelConfig,
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

  let body: UploadTransportirExcelResponse | undefined;
  try {
    body = (await res.json()) as UploadTransportirExcelResponse;
  } catch {
    // A non-JSON response is handled below using the HTTP status text.
  }

  if (!res.ok) {
    throw new Error(
      getUploadErrorMessage(body, `Upload gagal (${res.status}): ${res.statusText}`),
    );
  }

  if (!body?.success) {
    throw new Error(
      getUploadErrorMessage(body, "Terjadi kesalahan saat memproses file Excel"),
    );
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

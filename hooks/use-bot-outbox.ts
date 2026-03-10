import { useQuery } from "@tanstack/react-query";
import { getBotApiOptions } from "./service/bot-api";

export interface OutboxMessage {
  id: number;
  dedup_key: string;
  payload: string;
  status: "pending" | "processing" | "failed";
  attempt_count: number;
  next_retry_at: number;
  created_at: number;
  last_error: string | null;
}

export interface OutboxResponse {
  items: OutboxMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useBotOutbox(
  host: string,
  page: number,
  limit: number,
  status?: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["bot-outbox", host, page, limit, status],
    queryFn: async (): Promise<OutboxResponse> => {
      const options = getBotApiOptions(host);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status && status !== "all") {
        params.append("status", status);
      }

      const res = await fetch(`${options.baseUrl}/api/bot/outbox?${params.toString()}`, {
        method: "GET",
        headers: options.headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch outbox data: ${res.statusText}`);
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Unknown error");
      return json.data;
    },
    enabled,
    refetchInterval: 5000,
  });
}

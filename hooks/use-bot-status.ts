"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  botKeys,
  getBotStatus,
  getBotQR,
  disconnectBot,
  getBotMetrics,
  BOT_PRIMARY_API,
  BOT_SECONDARY_API,
  type BotStatus,
  type BotQR,
  type BotMetrics,
} from "./service/bot-api";

/**
 * Polls bot status every 10s.
 * Stops polling when:
 *  - `enabled` is false (e.g. standby bot)
 *  - The query is in an error state (server unreachable)
 *
 * When the bot transitions from disconnected → connected, it automatically
 * invalidates **all** queries for this host so groups / keywords / etc refresh.
 */
export function useBotStatus(host: string, enabled = true) {
  const qc = useQueryClient();
  const prevConnected = useRef<boolean | null>(null);

  const query = useQuery<BotStatus>({
    queryKey: botKeys.status(host),
    queryFn: () => getBotStatus(host),
    // Stop polling if the query errored (server unreachable) or disabled
    refetchInterval: (q) => {
      if (!enabled) return false;
      if (q.state.status === "error") return false;
      return 10_000;
    },
    enabled,
    retry: 1, // retry once then stop
  });

  // When bot becomes connected, invalidate everything to refresh data
  useEffect(() => {
    const connected = query.data?.connected ?? false;
    if (prevConnected.current === false && connected) {
      qc.invalidateQueries({ queryKey: botKeys.all(host) });
    }
    prevConnected.current = connected;
  }, [query.data?.connected, host, qc]);

  return query;
}

export function useBotQR(host: string, enabled = true) {
  return useQuery<BotQR>({
    queryKey: botKeys.qr(host),
    queryFn: () => getBotQR(host),
    refetchInterval: (q) => {
      if (!enabled) return false;
      if (q.state.status === "error") return false;
      return 15_000;
    },
    enabled,
    retry: 1,
  });
}

/**
 * Returns the "other" host so we can invalidate its status on disconnect.
 */
function otherHost(host: string) {
  return host === BOT_PRIMARY_API ? BOT_SECONDARY_API : BOT_PRIMARY_API;
}

export function useDisconnectBot(host: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectBot(host),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: botKeys.all(host) });
      // Also refresh the other bot's status so UI can update login availability
      qc.invalidateQueries({ queryKey: botKeys.status(otherHost(host)) });
    },
  });
}

export function useBotMetrics(host: string) {
  return useQuery<BotMetrics>({
    queryKey: botKeys.metrics(host),
    queryFn: () => getBotMetrics(host),
    refetchInterval: (q) => {
      if (q.state.status === "error") return false;
      return 10_000;
    },
    retry: 1,
  });
}

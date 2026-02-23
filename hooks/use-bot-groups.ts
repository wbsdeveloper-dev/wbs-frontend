"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  botKeys,
  getGroups,
  updateEnabledGroups,
  syncBotToBackend,
  type GroupItem,
} from "./service/bot-api";

export function useBotGroups(host: string, enabled = true) {
  return useQuery<GroupItem[]>({
    queryKey: botKeys.groups(host),
    queryFn: () => getGroups(host),
    retry: 1,
    enabled,
  });
}

export function useUpdateGroups(host: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabledGroupIds: string[]) =>
      updateEnabledGroups(host, enabledGroupIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: botKeys.groups(host) });
    },
  });
}

export function useSyncBotToBackend(host: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => syncBotToBackend(host),
    onSuccess: () => {
      // Refresh groups after sync
      qc.invalidateQueries({ queryKey: botKeys.groups(host) });
    },
  });
}

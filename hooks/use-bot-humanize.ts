"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  botKeys,
  getHumanizeConfig,
  updateHumanizeConfig,
  toggleHumanize,
  type HumanizeConfig,
} from "./service/bot-api";

export function useHumanizeConfig(host: string, enabled = true) {
  return useQuery<HumanizeConfig>({
    queryKey: botKeys.humanize(host),
    queryFn: () => getHumanizeConfig(host),
    retry: 1,
    enabled,
  });
}

export function useUpdateHumanize(host: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<HumanizeConfig>) =>
      updateHumanizeConfig(host, config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: botKeys.humanize(host) });
    },
  });
}

export function useToggleHumanize(host: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => toggleHumanize(host, enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: botKeys.humanize(host) });
    },
  });
}

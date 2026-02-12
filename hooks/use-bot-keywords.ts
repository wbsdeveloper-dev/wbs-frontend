"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  botKeys,
  getKeywords,
  addKeyword,
  deleteKeyword,
} from "./service/bot-api";

export function useBotKeywords(host: string, enabled = true) {
  return useQuery<string[]>({
    queryKey: botKeys.keywords(host),
    queryFn: () => getKeywords(host),
    retry: 1,
    enabled,
  });
}

export function useAddKeyword(host: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyword: string) => addKeyword(host, keyword),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: botKeys.keywords(host) });
    },
  });
}

export function useDeleteKeyword(host: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyword: string) => deleteKeyword(host, keyword),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: botKeys.keywords(host) });
    },
  });
}

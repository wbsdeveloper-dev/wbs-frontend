"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  botKeys,
  getDataCollectionStatus,
  toggleDataCollection,
  type DataCollectionStatus,
} from "./service/bot-api";

export function useDataCollectionStatus(host: string, enabled = true) {
  return useQuery<DataCollectionStatus>({
    queryKey: botKeys.dataCollection(host),
    queryFn: () => getDataCollectionStatus(host),
    retry: 1,
    enabled,
  });
}

export function useToggleDataCollection(host: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => toggleDataCollection(host, enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: botKeys.dataCollection(host) });
    },
  });
}

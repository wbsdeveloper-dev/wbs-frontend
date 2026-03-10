import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiKeys,
  generateApiKey,
  revokeApiKey,
  type ApiKeyView,
  type GeneratedApiKey,
} from "./service/api-keys";

export const API_KEYS_QUERY_KEY = ["api-keys"];

export function useApiKeys() {
  return useQuery<ApiKeyView[]>({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: getApiKeys,
  });
}

export function useGenerateApiKey() {
  const qc = useQueryClient();
  return useMutation<GeneratedApiKey, Error, string>({
    mutationFn: (serviceName: string) => generateApiKey(serviceName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}

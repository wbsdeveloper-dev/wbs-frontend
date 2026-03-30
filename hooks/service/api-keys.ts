import { getAccessToken } from "@/lib/auth";

export const API_KEYS_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3005/api";

export interface ApiKeyView {
  id: string;
  serviceName: string;
  isEnabled: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface GeneratedApiKey {
  id: string;
  serviceName: string;
  apiKey: string;
}

async function apiKeysFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_KEYS_HOST}${path}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      if (body.error?.message) msg = body.error.message;
      else if (body.error) msg = typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
      else if (body.message) msg = body.message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(msg);
  }

  const body = await res.json();

  if (!body.success) {
    throw new Error(
      body.error?.message || body.message || "Unknown API error",
    );
  }

  return body.data as T;
}

export async function getApiKeys(): Promise<ApiKeyView[]> {
  const result = await apiKeysFetch<ApiKeyView[]>("/api-keys");
  return result;
}

export async function generateApiKey(serviceName: string): Promise<GeneratedApiKey> {
  const result = await apiKeysFetch<GeneratedApiKey>("/api-keys/generate", {
    method: "POST",
    body: JSON.stringify({ serviceName }),
  });
  return result;
}

export async function revokeApiKey(id: string): Promise<{ success: boolean }> {
  const result = await apiKeysFetch<{ success: boolean }>(`/api-keys/${id}`, {
    method: "DELETE",
  });
  return result;
}

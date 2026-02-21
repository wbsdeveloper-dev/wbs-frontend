// Bot API service — wraps all WhatsApp bot management endpoints.
// Two bot instances share the same API surface but run on different ports.

export const BOT_PRIMARY_API = "http://localhost:3006";
export const BOT_SECONDARY_API = "http://localhost:3007";

// ---------------------------------------------------------------------------
// Standard API envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Base fetcher
// ---------------------------------------------------------------------------

async function botFetch<T>(
  host: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${host}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as ApiResponse;
      if (body.error) msg = body.error;
      else if (body.message) msg = body.message;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(res.status, msg);
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiError(
      res.status,
      body.error || body.message || "Unknown API error",
    );
  }

  return body.data;
}

// ---------------------------------------------------------------------------
// Query key factory (namespaced per host to keep caches separate)
// ---------------------------------------------------------------------------

export const botKeys = {
  all: (host: string) => ["bot", host] as const,
  status: (host: string) => [...botKeys.all(host), "status"] as const,
  qr: (host: string) => [...botKeys.all(host), "qr"] as const,
  groups: (host: string) => [...botKeys.all(host), "groups"] as const,
  keywords: (host: string) => [...botKeys.all(host), "keywords"] as const,
  dataCollection: (host: string) =>
    [...botKeys.all(host), "data-collection"] as const,
  humanize: (host: string) => [...botKeys.all(host), "humanize"] as const,
  metrics: (host: string) => [...botKeys.all(host), "metrics"] as const,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape the rest of the app uses */
export interface BotStatus {
  connected: boolean;
  connectionState: string; // "connected" | "connecting" | "disconnected" | …
  queueSize: number;
  failedDeliveries: number;
  lastMessageTime: string | null;
  uptime: number;
}

/** Shape the API actually returns */
interface RawBotStatus {
  role?: string;
  connection: string;          // "connected" | "disconnected" | …
  lastMessageAt: string | null;
  outboxQueueSize: number;
  failedDeliveries: number;
  timestamp?: string;
  uptime?: number;
}

export interface BotQR {
  qr: string | null;
}

export interface GroupItem {
  id: string;
  name: string;
  participants: number;
  enabled: boolean;
}

export interface GroupsResponse {
  groups: GroupItem[];
  enabledCount: number;
}

export interface KeywordItem {
  keyword: string;
}

export interface DataCollectionStatus {
  enabled: boolean;
  directory?: string;
}

export interface HumanizeConfig {
  enabled: boolean;
  minProcessingDelay: number;
  maxProcessingDelay: number;
  minReadDelay: number;
  maxReadDelay: number;
  presenceEnabled: boolean;
  offlineChance: number;
}

export interface BotMetrics {
  connected: boolean;
  queueSize: number;
  failedDeliveries: number;
  uptime: number;
}

// ---------------------------------------------------------------------------
// Bot Control
// ---------------------------------------------------------------------------

export async function getBotStatus(host: string): Promise<BotStatus> {
  const raw = await botFetch<RawBotStatus>(host, "/api/bot/status");
  return {
    connected: raw.connection === "connected",
    connectionState: raw.connection,
    queueSize: raw.outboxQueueSize ?? 0,
    failedDeliveries: raw.failedDeliveries ?? 0,
    lastMessageTime: raw.lastMessageAt ?? null,
    uptime: raw.uptime ?? 0,
  };
}

export function getBotQR(host: string) {
  return botFetch<BotQR>(host, "/api/bot/qr");
}

export function disconnectBot(host: string) {
  return botFetch<void>(host, "/api/bot/disconnect", { method: "POST" });
}

// ---------------------------------------------------------------------------
// Groups Management
// ---------------------------------------------------------------------------

export async function getGroups(host: string) {
  const result = await botFetch<GroupsResponse>(host, "/api/groups");
  return result.groups;
}

export function updateEnabledGroups(host: string, enabledGroupIds: string[]) {
  return botFetch<void>(host, "/api/groups", {
    method: "PUT",
    body: JSON.stringify({ enabledGroupIds }),
  });
}

export function syncBotToBackend(host: string) {
  return botFetch<{ syncedCount: number; result: Record<string, unknown> }>(
    host,
    "/api/sync-to-backend",
    {
      method: "POST",
    },
  );
}

// ---------------------------------------------------------------------------
// Keywords Management
// ---------------------------------------------------------------------------

export async function getKeywords(host: string): Promise<string[]> {
  const raw = await botFetch<{ keywords: string[]; count: number }>(host, "/api/keywords");
  return raw.keywords;
}

export function addKeyword(host: string, keyword: string) {
  return botFetch<void>(host, "/api/keywords", {
    method: "POST",
    body: JSON.stringify({ keyword }),
  });
}

export function deleteKeyword(host: string, keyword: string) {
  return botFetch<void>(host, `/api/keywords/${encodeURIComponent(keyword)}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Data Collection
// ---------------------------------------------------------------------------

export function getDataCollectionStatus(host: string) {
  return botFetch<DataCollectionStatus>(host, "/api/data-collection");
}

export function toggleDataCollection(host: string, enabled: boolean) {
  return botFetch<void>(host, "/api/data-collection", {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
}

// ---------------------------------------------------------------------------
// Humanize Settings
// ---------------------------------------------------------------------------

export function getHumanizeConfig(host: string) {
  return botFetch<HumanizeConfig>(host, "/api/humanize");
}

export function updateHumanizeConfig(
  host: string,
  config: Partial<HumanizeConfig>,
) {
  return botFetch<HumanizeConfig>(host, "/api/humanize", {
    method: "PUT",
    body: JSON.stringify(config),
  });
}

export function toggleHumanize(host: string, enabled: boolean) {
  return botFetch<void>(host, "/api/humanize/toggle", {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });
}

// ---------------------------------------------------------------------------
// Health / Metrics
// ---------------------------------------------------------------------------

export function getBotMetrics(host: string) {
  return botFetch<BotMetrics>(host, "/metrics");
}

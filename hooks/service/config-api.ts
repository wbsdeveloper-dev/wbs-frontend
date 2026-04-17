// Config API service — wraps all configuration endpoints (Groups & Templates)
// from the WBS Platform Backend API.
// Standalone fetcher — does NOT import from dashboard-api.ts.

import { getAccessToken } from "@/lib/auth";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

export const CONFIG_API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3005/api";

// ---------------------------------------------------------------------------
// Standard API envelope
// ---------------------------------------------------------------------------

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: { requestId: string; timestamp: string };
}

class ConfigApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ConfigApiError";
  }
}

// ---------------------------------------------------------------------------
// Base fetcher (with automatic auth header injection)
// ---------------------------------------------------------------------------

async function configFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${CONFIG_API_HOST}${path}`;
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
      const body = (await res.json()) as ApiResponse;
      if (body.error) msg = body.error;
      else if (body.message) msg = body.message;
    } catch {
      /* ignore parse errors */
    }
    throw new ConfigApiError(res.status, msg);
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ConfigApiError(
      res.status,
      body.error || body.message || "Unknown API error",
    );
  }

  return body.data;
}

// ---------------------------------------------------------------------------
// Types — Groups
// ---------------------------------------------------------------------------

export interface GroupConfig {
  id: string;
  groupId: string;
  group_id?: string;
  name: string;
  isEnabled: boolean;
  is_enabled?: boolean;
  keywords: string[];
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

export interface CreateGroupPayload {
  groupId: string;
  name: string;
  keywords?: string[];
}

export interface UpdateGroupPayload {
  name?: string;
  isEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Types — Templates
// ---------------------------------------------------------------------------

export interface TemplateField {
  id: string;
  ingestionTemplateId: string;
  fieldKey: string;
  sourceKind:
    | "SHEET_COLUMN"
    | "WA_REGEX"
    | "WA_REGEX_RECORDS"
    | "WA_FIXED"
    | "AI_JSON_PATH";
  sourceRef: string;
  transform: string | null;
  isRequired: boolean;
  orderNo: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  scope: "WA_GROUP" | "SPREADSHEET_SOURCE";
  status: "DRAFT" | "ACTIVE" | "DEPRECATED";
  parserMode: "RULE_BASED" | "AI_ASSISTED";
  groupConfigId: string | null;
  spreadsheetSourceId: string | null;
  version: number;
  isDefault: boolean;
  waKeywordHint: string | null;
  waSenderHint: string | null;
  sheetTabHint: string | null;
  sheetHeaderRow: number | null;
  aiModel: string | null;
  aiPromptTemplate: string | null;
  aiOutputSchema: Record<string, unknown> | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  fields: TemplateField[];
}

export interface CreateTemplatePayload {
  name: string;
  scope: "WA_GROUP" | "SPREADSHEET_SOURCE" | "EMAIL_INGEST";
  parserMode?: "RULE_BASED" | "AI_ASSISTED";
  groupConfigId?: string;
  spreadsheetSourceId?: string;
  waKeywordHint?: string;
  waSenderHint?: string;
  sheetTabHint?: string;
  sheetHeaderRow?: number;
  aiModel?: string;
  aiPromptTemplate?: string;
  aiOutputSchema?: Record<string, unknown>;
  fields?: {
    fieldKey: string;
    sourceKind: TemplateField["sourceKind"];
    sourceRef: string;
    transform?: string | null;
    isRequired: boolean;
    orderNo: number;
  }[];
}

export interface UpdateTemplatePayload {
  name?: string;
  scope?: "WA_GROUP" | "SPREADSHEET_SOURCE";
  parserMode?: "RULE_BASED" | "AI_ASSISTED";
  groupConfigId?: string | null;
  spreadsheetSourceId?: string | null;
  waKeywordHint?: string | null;
  waSenderHint?: string | null;
  sheetTabHint?: string | null;
  sheetHeaderRow?: number | null;
  aiModel?: string | null;
  aiPromptTemplate?: string | null;
  aiOutputSchema?: Record<string, unknown> | null;
  fields?: {
    fieldKey: string;
    sourceKind: TemplateField["sourceKind"];
    sourceRef: string;
    transform?: string | null;
    isRequired: boolean;
    orderNo: number;
  }[];
}

export interface TemplateListFilters {
  scope?: string;
  status?: string;
  search?: string;
}

export interface RoutingTestPayload {
  groupId: string;
  textContent: string;
}

export interface RoutingTestTemplatePreview {
  id: string;
  name: string;
  parserMode: string;
  waKeywordHint?: string | null;
}

export interface RoutingTestResponse {
  allowed: boolean;
  groupConfigId: string | null;
  template: RoutingTestTemplatePreview | null;
}

// ---------------------------------------------------------------------------
// Types — AI Models
// ---------------------------------------------------------------------------

export interface AiModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  supportedFeatures: string[];
  isDefault: boolean;
}

// ---------------------------------------------------------------------------
// Types — Spreadsheet Sources
// ---------------------------------------------------------------------------

export interface SpreadsheetSource {
  id: string;
  provider: string;
  name: string;
  spreadsheetId: string;
  sheetName: string;
  rangeA1: string | null;
  authRef: string | null;
  timezone: string;
  isEnabled: boolean;
  cronSchedule: string | null;
  dataStartRow: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpreadsheetSourcePayload {
  name: string;
  spreadsheetId: string;
  sheetName: string;
  rangeA1?: string;
  timezone?: string;
  cronSchedule?: string;
  dataStartRow?: number;
}

export interface UpdateSpreadsheetSourcePayload {
  name?: string;
  spreadsheetId?: string;
  sheetName?: string;
  rangeA1?: string;
  timezone?: string;
  isEnabled?: boolean;
  cronSchedule?: string;
  dataStartRow?: number;
}

// ---------------------------------------------------------------------------
// Helper to build query string
// ---------------------------------------------------------------------------

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== "all") {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const configKeys = {
  all: ["config"] as const,
  groups: () => [...configKeys.all, "groups"] as const,
  group: (id: string) => [...configKeys.all, "groups", id] as const,
  // For invalidation — matches ALL template queries regardless of filters
  _templatesBase: () => [...configKeys.all, "templates"] as const,
  // For queries — includes filters in key for per-filter caching
  templates: (filters?: TemplateListFilters) =>
    [...configKeys.all, "templates", "list", filters] as const,
  template: (id: string) =>
    [...configKeys.all, "templates", "detail", id] as const,
  aiModels: () => [...configKeys.all, "ai-models"] as const,
  spreadsheetSources: () => [...configKeys.all, "spreadsheet-sources"] as const,
  spreadsheetSource: (id: string) => [...configKeys.all, "spreadsheet-sources", id] as const,
  emailSources: () => [...configKeys.all, "email-sources"] as const,
  emailSource: (id: string) => [...configKeys.all, "email-sources", id] as const,
};

// ---------------------------------------------------------------------------
// API functions — Groups
// ---------------------------------------------------------------------------

export function getGroups() {
  return configFetch<GroupConfig[]>("/config/groups");
}

export function getGroup(id: string) {
  return configFetch<GroupConfig>(`/config/groups/${id}`);
}

export function createGroup(payload: CreateGroupPayload) {
  return configFetch<GroupConfig>("/config/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateGroup(id: string, payload: UpdateGroupPayload) {
  return configFetch<GroupConfig>(`/config/groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteGroup(id: string) {
  return configFetch<{ deleted: boolean }>(`/config/groups/${id}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// API functions — Templates
// ---------------------------------------------------------------------------

export function getTemplates(filters?: TemplateListFilters) {
  const query = buildQuery({
    scope: filters?.scope,
    status: filters?.status,
    search: filters?.search,
  });
  return configFetch<Template[]>(`/config/templates${query}`);
}

export function getTemplate(id: string) {
  return configFetch<Template>(`/config/templates/${id}`);
}

export function createTemplate(payload: CreateTemplatePayload) {
  return configFetch<Template>("/config/templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTemplate(id: string, payload: UpdateTemplatePayload) {
  return configFetch<Template>(`/config/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function activateTemplate(id: string) {
  return configFetch<Template>(`/config/templates/${id}/activate`, {
    method: "POST",
  });
}

export function deprecateTemplate(id: string) {
  return configFetch<Template>(`/config/templates/${id}/deprecate`, {
    method: "POST",
  });
}

export function duplicateTemplate(id: string) {
  return configFetch<Template>(`/config/templates/${id}/duplicate`, {
    method: "POST",
  });
}

export function deleteTemplate(id: string) {
  return configFetch<{ deleted: boolean }>(`/config/templates/${id}`, {
    method: "DELETE",
  });
}

export function testRouting(payload: RoutingTestPayload) {
  return configFetch<RoutingTestResponse>("/config/routing/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// API functions — AI Models
// ---------------------------------------------------------------------------

export function getAiModels() {
  return configFetch<AiModel[]>("/config/ai-models");
}

// ---------------------------------------------------------------------------
// React Query hooks — Groups
// ---------------------------------------------------------------------------

export function useGroups(options?: Partial<UseQueryOptions<GroupConfig[]>>) {
  return useQuery({
    queryKey: configKeys.groups(),
    queryFn: () => getGroups(),
    ...options,
  });
}

export function useCreateGroup(
  options?: Partial<UseMutationOptions<GroupConfig, Error, CreateGroupPayload>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => createGroup(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.groups() });
    },
    ...options,
  });
}

export function useUpdateGroup(
  options?: Partial<
    UseMutationOptions<
      GroupConfig,
      Error,
      { id: string; payload: UpdateGroupPayload }
    >
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateGroupPayload;
    }) => updateGroup(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.groups() });
    },
    ...options,
  });
}

export function useDeleteGroup(
  options?: Partial<UseMutationOptions<{ deleted: boolean }, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.groups() });
    },
    ...options,
  });
}

// ---------------------------------------------------------------------------
// React Query hooks — Templates
// ---------------------------------------------------------------------------

export function useTemplates(
  filters?: TemplateListFilters,
  options?: Partial<UseQueryOptions<Template[]>>,
) {
  return useQuery({
    queryKey: configKeys.templates(filters),
    queryFn: () => getTemplates(filters),
    ...options,
  });
}

export function useTemplate(
  id: string,
  options?: Partial<UseQueryOptions<Template>>,
) {
  return useQuery({
    queryKey: configKeys.template(id),
    queryFn: () => getTemplate(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateTemplate(
  options?: Partial<UseMutationOptions<Template, Error, CreateTemplatePayload>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => createTemplate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys._templatesBase() });
    },
    ...options,
  });
}

export function useUpdateTemplate(
  options?: Partial<
    UseMutationOptions<
      Template,
      Error,
      { id: string; payload: UpdateTemplatePayload }
    >
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTemplatePayload;
    }) => updateTemplate(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: configKeys._templatesBase() });
      qc.invalidateQueries({ queryKey: configKeys.template(variables.id) });
    },
    ...options,
  });
}

export function useActivateTemplate(
  options?: Partial<UseMutationOptions<Template, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateTemplate(id),
    onSuccess: () => {
      // Refetch all templates because activating one may deprecate others
      qc.invalidateQueries({ queryKey: configKeys._templatesBase() });
    },
    ...options,
  });
}

export function useDeprecateTemplate(
  options?: Partial<UseMutationOptions<Template, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deprecateTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys._templatesBase() });
    },
    ...options,
  });
}

export function useDuplicateTemplate(
  options?: Partial<UseMutationOptions<Template, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys._templatesBase() });
    },
    ...options,
  });
}

export function useDeleteTemplate(
  options?: Partial<UseMutationOptions<{ deleted: boolean }, Error, string>>,
) {
  const qc = useQueryClient();
  const { onSuccess: externalOnSuccess, ...restOptions } = options || {};
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: (...args) => {
      const [_data, id] = args;
      // Remove detail cache immediately so it doesn't trigger a 404 refetch
      qc.removeQueries({ queryKey: configKeys.template(id) });
      
      // Invalidate the list queries to update the sidebar
      qc.invalidateQueries({ queryKey: ["config", "templates", "list"] });

      externalOnSuccess?.(...args);
    },
    ...restOptions,
  });
}

export function useTestRouting(
  options?: Partial<
    UseMutationOptions<RoutingTestResponse, Error, RoutingTestPayload>
  >,
) {
  return useMutation({
    mutationFn: (payload: RoutingTestPayload) => testRouting(payload),
    ...options,
  });
}

// ---------------------------------------------------------------------------
// React Query hooks — AI Models
// ---------------------------------------------------------------------------

export function useAiModels(options?: Partial<UseQueryOptions<AiModel[]>>) {
  return useQuery({
    queryKey: configKeys.aiModels(),
    queryFn: () => getAiModels(),
    staleTime: 5 * 60 * 1000, // models rarely change
    ...options,
  });
}

// ---------------------------------------------------------------------------
// API functions — Spreadsheet Sources
// ---------------------------------------------------------------------------

export function getSpreadsheetSources() {
  return configFetch<SpreadsheetSource[]>("/config/spreadsheet-sources");
}

export function getSpreadsheetSource(id: string) {
  return configFetch<SpreadsheetSource>(`/config/spreadsheet-sources/${id}`);
}

export function createSpreadsheetSourceApi(payload: CreateSpreadsheetSourcePayload) {
  return configFetch<SpreadsheetSource>("/config/spreadsheet-sources", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSpreadsheetSourceApi(id: string, payload: UpdateSpreadsheetSourcePayload) {
  return configFetch<SpreadsheetSource>(`/config/spreadsheet-sources/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteSpreadsheetSourceApi(id: string) {
  return configFetch<{ deleted: boolean }>(`/config/spreadsheet-sources/${id}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// React Query hooks — Spreadsheet Sources
// ---------------------------------------------------------------------------

export function useSpreadsheetSources(options?: Partial<UseQueryOptions<SpreadsheetSource[]>>) {
  return useQuery({
    queryKey: configKeys.spreadsheetSources(),
    queryFn: () => getSpreadsheetSources(),
    ...options,
  });
}

export function useCreateSpreadsheetSource(
  options?: Partial<UseMutationOptions<SpreadsheetSource, Error, CreateSpreadsheetSourcePayload>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSpreadsheetSourcePayload) => createSpreadsheetSourceApi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.spreadsheetSources() });
    },
    ...options,
  });
}

export function useUpdateSpreadsheetSource(
  options?: Partial<UseMutationOptions<SpreadsheetSource, Error, { id: string; payload: UpdateSpreadsheetSourcePayload }>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSpreadsheetSourcePayload }) =>
      updateSpreadsheetSourceApi(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.spreadsheetSources() });
    },
    ...options,
  });
}

export function useDeleteSpreadsheetSource(
  options?: Partial<UseMutationOptions<{ deleted: boolean }, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSpreadsheetSourceApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.spreadsheetSources() });
    },
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Types — Email Sources
// ---------------------------------------------------------------------------

export interface EmailSource {
  id: string;
  name: string;
  provider: string;
  emailAddress: string;
  isEnabled: boolean;
  cronSchedule: string | null;
  lastPolledAt: string | null;
  lastHistoryId: string | null;
  subjectFilter: string | null;
  senderFilter: string | null;
  labelFilter: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailSourcePayload {
  name: string;
  emailAddress: string;
  cronSchedule?: string;
  subjectFilter?: string;
  senderFilter?: string;
  labelFilter?: string;
}

export interface UpdateEmailSourcePayload {
  name?: string;
  emailAddress?: string;
  isEnabled?: boolean;
  cronSchedule?: string;
  subjectFilter?: string;
  senderFilter?: string;
  labelFilter?: string;
}

// ---------------------------------------------------------------------------
// API functions — Email Sources
// ---------------------------------------------------------------------------

export function getEmailSources() {
  return configFetch<EmailSource[]>("/config/email-sources");
}

export function getEmailSource(id: string) {
  return configFetch<EmailSource>(`/config/email-sources/${id}`);
}

export function createEmailSourceApi(payload: CreateEmailSourcePayload) {
  return configFetch<EmailSource>("/config/email-sources", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEmailSourceApi(id: string, payload: UpdateEmailSourcePayload) {
  return configFetch<EmailSource>(`/config/email-sources/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteEmailSourceApi(id: string) {
  return configFetch<{ deleted: boolean }>(`/config/email-sources/${id}`, {
    method: "DELETE",
  });
}

export function triggerEmailPollApi(id: string) {
  return configFetch<{ jobId: string; triggered: boolean }>(`/config/email-sources/${id}/poll`, {
    method: "POST",
  });
}

export function testEmailParseApi(id: string) {
  return configFetch<{ jobId: string; testTriggered: boolean }>(`/config/email-sources/${id}/test-parse`, {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------
// React Query hooks — Email Sources
// ---------------------------------------------------------------------------

export function useEmailSources(options?: Partial<UseQueryOptions<EmailSource[]>>) {
  return useQuery({
    queryKey: configKeys.emailSources(),
    queryFn: () => getEmailSources(),
    ...options,
  });
}

export function useCreateEmailSource(
  options?: Partial<UseMutationOptions<EmailSource, Error, CreateEmailSourcePayload>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmailSourcePayload) => createEmailSourceApi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.emailSources() });
    },
    ...options,
  });
}

export function useUpdateEmailSource(
  options?: Partial<UseMutationOptions<EmailSource, Error, { id: string; payload: UpdateEmailSourcePayload }>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmailSourcePayload }) =>
      updateEmailSourceApi(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.emailSources() });
    },
    ...options,
  });
}

export function useDeleteEmailSource(
  options?: Partial<UseMutationOptions<{ deleted: boolean }, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmailSourceApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.emailSources() });
    },
    ...options,
  });
}

export function useTriggerEmailPoll(
  options?: Partial<UseMutationOptions<{ jobId: string; triggered: boolean }, Error, string>>,
) {
  return useMutation({
    mutationFn: (id: string) => triggerEmailPollApi(id),
    ...options,
  });
}

export function useTestEmailParse(
  options?: Partial<UseMutationOptions<{ jobId: string; testTriggered: boolean }, Error, string>>,
) {
  return useMutation({
    mutationFn: (id: string) => testEmailParseApi(id),
    ...options,
  });
}

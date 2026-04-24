// Contract API service — wraps all contract-related endpoints
// from WBS Platform Backend API.

import { getAccessToken } from "@/lib/auth";
import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type UseMutationOptions,
} from "@tanstack/react-query";

export const CONTRACT_API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3005/api";

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

class ContractApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
    ) {
        super(message);
        this.name = "ContractApiError";
    }
}

// ---------------------------------------------------------------------------
// Base fetcher (with automatic auth header injection)
// ---------------------------------------------------------------------------

async function contractFetch<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const url = `${CONTRACT_API_HOST}${path}`;
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
            if (body.error) {
                msg = typeof body.error === "string"
                    ? body.error
                    : JSON.stringify(body.error);
            } else if (body.message) {
                msg = typeof body.message === "string"
                    ? body.message
                    : JSON.stringify(body.message);
            }
        } catch {
            /* ignore parse errors */
        }
        throw new ContractApiError(res.status, msg);
    }

    const body = (await res.json()) as ApiResponse<T>;

    if (!body.success) {
        throw new ContractApiError(
            res.status,
            body.error || body.message || "Unknown API error",
        );
    }

    return body.data;
}

// ---------------------------------------------------------------------------
// Types — Contract Parties
// ---------------------------------------------------------------------------

export interface ContractParty {
    id: string;
    region: string | null;
    pemasok_dim_id: string | null;
    pembangkit_dim_id: string | null;
    pemasok_site_id: string | null;
    pembangkit_site_id: string | null;
    transportir_site_id: string | null;
    owner_kit: string | null;
    commodity: string | null;
    notes: string | null;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
    // joined
    pemasok_name?: string | null;
    pembangkit_name?: string | null;
    transportir_name?: string | null;
}

export interface CreateContractPartyPayload {
    region?: string;
    pemasok_dim_id?: string;
    pembangkit_dim_id?: string;
    pemasok_site_id?: string;
    pembangkit_site_id?: string;
    transportir_site_id?: string;
    owner_kit?: string;
    commodity?: string;
    notes?: string;
}

export interface UpdateContractPartyPayload {
    region?: string;
    pemasok_dim_id?: string;
    pembangkit_dim_id?: string;
    pemasok_site_id?: string;
    pembangkit_site_id?: string;
    transportir_site_id?: string;
    owner_kit?: string;
    commodity?: string;
    notes?: string;
    is_enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Types — Contracts
// ---------------------------------------------------------------------------

export interface Contract {
    id: string;
    contract_party_id: string;
    status: string;
    doc_type: string;
    doc_type_latest: string;
    no_kontrak_awal: string;
    no_kontrak_terbaru: string | null;
    awal_perjanjian: string | null;
    tanggal_efektif: string | null;
    akhir_perjanjian: string | null;
    volume_jpmh_bbtud: number | null;
    volume_jpmh_mmscfd: number | null;
    price_value: string | null;
    price_unit: string;
    hgbt_value: number | null;
    hgbt_unit: string | null;
    tjk_bbtud?: number | null;
    tjk_mmscfd?: number | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    // joined from contract_parties + site_dim
    pemasok_name?: string | null;
    pembangkit_name?: string | null;
    transportir_name?: string | null;
    region?: string | null;
    owner_kit?: string | null;
}

export interface CreateContractPayload {
    contract_party_id: string;
    status?: string;
    doc_type?: string;
    doc_type_latest?: string;
    no_kontrak_awal: string;
    no_kontrak_terbaru?: string;
    awal_perjanjian?: string;
    tanggal_efektif?: string;
    akhir_perjanjian?: string;
    volume_jpmh_bbtud?: number;
    volume_jpmh_mmscfd?: number;
    price_value?: string;
    price_unit?: string;
    hgbt_value?: number;
    hgbt_unit?: string;
    tjk_bbtud?: number;
    tjk_mmscfd?: number;
}

export interface UpdateContractPayload {
    contract_party_id?: string;
    status?: string;
    doc_type?: string;
    doc_type_latest?: string;
    no_kontrak_awal?: string;
    no_kontrak_terbaru?: string;
    awal_perjanjian?: string;
    tanggal_efektif?: string;
    akhir_perjanjian?: string;
    volume_jpmh_bbtud?: number;
    volume_jpmh_mmscfd?: number;
    price_value?: string;
    price_unit?: string;
    hgbt_value?: number;
    hgbt_unit?: string;
    tjk_bbtud?: number;
    tjk_mmscfd?: number;
}

export interface ContractFilters {
    contract_party_id?: string;
    status?: string;
    search?: string;
    pemasok_site_id?: string;
    pembangkit_site_id?: string;
}

// ---------------------------------------------------------------------------
// Types — Contract Versions
// ---------------------------------------------------------------------------

export interface ContractVersion {
    id: string;
    contract_id: string;
    version_no: number;
    doc_type: string;
    no_kontrak: string;
    effective_from: string | null;
    effective_to: string | null;
    notes: string | null;
    created_at: string;
}

export interface CreateContractVersionPayload {
    version_no: number;
    doc_type?: string;
    no_kontrak: string;
    effective_from?: string;
    effective_to?: string;
    notes?: string;
}

// ---------------------------------------------------------------------------
// Types — Contract Volumes
// ---------------------------------------------------------------------------

export interface ContractVolume {
    id: string;
    contract_id: string;
    year: number;
    basis: string;
    value_bbtud: number;
    value_mmscfd: number | null;
    top_percentage: number | null;
    top_percentage_mmscfd: number | null;
    is_kepmen: boolean;
    created_at: string;
}

export interface UpsertContractVolumeItem {
    year: number;
    basis?: string;
    value_bbtud: number;
    value_mmscfd?: number;
    top_percentage?: number;
    top_percentage_mmscfd?: number;
    is_kepmen?: boolean;
}

// ---------------------------------------------------------------------------
// Types — Contract Daily Delivery
// ---------------------------------------------------------------------------

export interface ContractDailyDelivery {
    id: string;
    contract_id: string;
    year: number;
    value_bbtud: number;
    value_mmscfd: number | null;
    created_at: string;
}

export interface UpsertContractDailyDeliveryItem {
    year: number;
    value_bbtud: number;
    value_mmscfd?: number;
}

// ---------------------------------------------------------------------------
// Types — Contract Annual Total
// ---------------------------------------------------------------------------

export interface ContractAnnualTotal {
    id: string;
    contract_id: string;
    year: number;
    total_bbtu: number;
    total_mmscfd: number | null;
    created_at: string;
}

export interface UpsertContractAnnualTotalItem {
    year: number;
    total_bbtu: number;
    total_mmscfd?: number;
}

// ---------------------------------------------------------------------------
// Types — Contract Documents
// ---------------------------------------------------------------------------

export interface ContractDocument {
    id: string;
    contract_id: string;
    original_name: string;
    stored_name: string;
    uploaded_by: string | null;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Types — Contract Relation Links
// ---------------------------------------------------------------------------

export interface ContractRelationLink {
    id: string;
    contract_id: string;
    site_relation_id: string;
    is_primary: boolean;
    created_at: string;
    // joined
    source_site_id?: string;
    target_site_id?: string;
    relation_type?: string;
    source_site_name?: string;
    target_site_name?: string;
}

export interface CreateContractRelationLinkPayload {
    site_relation_id: string;
    is_primary?: boolean;
}

// ---------------------------------------------------------------------------
// Helper to build query string
// ---------------------------------------------------------------------------

function buildQuery(
    params: Record<string, string | number | boolean | undefined>,
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

export const contractKeys = {
    all: ["contracts"] as const,
    parties: (filters?: { region?: string; commodity?: string; search?: string }) =>
        [...contractKeys.all, "parties", filters] as const,
    party: (id: string) =>
        [...contractKeys.all, "parties", id] as const,
    contracts: (filters?: ContractFilters) =>
        [...contractKeys.all, "list", filters] as const,
    contract: (id: string) =>
        [...contractKeys.all, "detail", id] as const,
    versions: (contractId: string) =>
        [...contractKeys.all, "versions", contractId] as const,
    volumes: (contractId: string) =>
        [...contractKeys.all, "volumes", contractId] as const,
    dailyDelivery: (contractId: string) =>
        [...contractKeys.all, "daily-delivery", contractId] as const,
    annualTotal: (contractId: string) =>
        [...contractKeys.all, "annual-total", contractId] as const,
    relationLinks: (contractId: string) =>
        [...contractKeys.all, "relation-links", contractId] as const,
    documents: (contractId: string) =>
        [...contractKeys.all, "documents", contractId] as const,
};

// ---------------------------------------------------------------------------
// API functions — Contract Parties
// ---------------------------------------------------------------------------

export function getContractParties(filters?: {
    region?: string;
    commodity?: string;
    search?: string;
}) {
    const query = buildQuery({
        region: filters?.region,
        commodity: filters?.commodity,
        search: filters?.search,
    });
    return contractFetch<ContractParty[]>(`/contract-parties${query}`);
}

export function getContractPartyById(id: string) {
    return contractFetch<ContractParty>(`/contract-parties/${id}`);
}

export function createContractParty(payload: CreateContractPartyPayload) {
    return contractFetch<ContractParty>("/contract-parties", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateContractParty(
    id: string,
    payload: UpdateContractPartyPayload,
) {
    return contractFetch<ContractParty>(`/contract-parties/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export function deleteContractParty(id: string) {
    return contractFetch<{ deleted: boolean }>(`/contract-parties/${id}`, {
        method: "DELETE",
    });
}

// ---------------------------------------------------------------------------
// API functions — Contracts
// ---------------------------------------------------------------------------

export function getContracts(filters?: ContractFilters) {
    const query = buildQuery({
        contract_party_id: filters?.contract_party_id,
        status: filters?.status,
        search: filters?.search,
        pemasok_site_id: filters?.pemasok_site_id,
        pembangkit_site_id: filters?.pembangkit_site_id,
    });
    return contractFetch<Contract[]>(`/contracts${query}`);
}

export function getContractById(id: string) {
    return contractFetch<Contract>(`/contracts/${id}`);
}

export function createContract(payload: CreateContractPayload) {
    return contractFetch<Contract>("/contracts", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateContract(id: string, payload: UpdateContractPayload) {
    return contractFetch<Contract>(`/contracts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export function deleteContract(id: string) {
    return contractFetch<{ deleted: boolean }>(`/contracts/${id}`, {
        method: "DELETE",
    });
}

export async function uploadContractPdf(contractId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const accessToken = getAccessToken();
    const url = `${CONTRACT_API_HOST}/contracts/${contractId}/documents`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: formData,
    });

    if (!res.ok) {
        throw new Error("Gagal mengunggah file");
    }

    return res.json();
}

// ---------------------------------------------------------------------------
// API functions — Contract Versions
// ---------------------------------------------------------------------------

export function getContractVersions(contractId: string) {
    return contractFetch<ContractVersion[]>(`/contracts/${contractId}/versions`);
}

export function createContractVersion(
    contractId: string,
    payload: CreateContractVersionPayload,
) {
    return contractFetch<ContractVersion>(
        `/contracts/${contractId}/versions`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
    );
}

export function deleteContractVersion(contractId: string, versionId: string) {
    return contractFetch<{ deleted: boolean }>(
        `/contracts/${contractId}/versions/${versionId}`,
        { method: "DELETE" },
    );
}

// ---------------------------------------------------------------------------
// API functions — Contract Volumes
// ---------------------------------------------------------------------------

export function getContractVolumes(contractId: string) {
    return contractFetch<ContractVolume[]>(`/contracts/${contractId}/volumes`);
}

export function upsertContractVolumes(
    contractId: string,
    items: UpsertContractVolumeItem[],
) {
    return contractFetch<ContractVolume[]>(`/contracts/${contractId}/volumes`, {
        method: "PUT",
        body: JSON.stringify({ items }),
    });
}

// ---------------------------------------------------------------------------
// API functions — Contract Daily Delivery
// ---------------------------------------------------------------------------

export function getContractDailyDelivery(contractId: string) {
    return contractFetch<ContractDailyDelivery[]>(
        `/contracts/${contractId}/daily-delivery`,
    );
}

export function upsertContractDailyDelivery(
    contractId: string,
    items: UpsertContractDailyDeliveryItem[],
) {
    return contractFetch<ContractDailyDelivery[]>(
        `/contracts/${contractId}/daily-delivery`,
        {
            method: "PUT",
            body: JSON.stringify({ items }),
        },
    );
}

// ---------------------------------------------------------------------------
// API functions — Contract Annual Total
// ---------------------------------------------------------------------------

export function getContractAnnualTotal(contractId: string) {
    return contractFetch<ContractAnnualTotal[]>(
        `/contracts/${contractId}/annual-total`,
    );
}

export function upsertContractAnnualTotal(
    contractId: string,
    items: UpsertContractAnnualTotalItem[],
) {
    return contractFetch<ContractAnnualTotal[]>(
        `/contracts/${contractId}/annual-total`,
        {
            method: "PUT",
            body: JSON.stringify({ items }),
        },
    );
}

// ---------------------------------------------------------------------------
// API functions — Contract Relation Links
// ---------------------------------------------------------------------------

export function getContractRelationLinks(contractId: string) {
    return contractFetch<ContractRelationLink[]>(
        `/contracts/${contractId}/relation-links`,
    );
}

export function createContractRelationLink(
    contractId: string,
    payload: CreateContractRelationLinkPayload,
) {
    return contractFetch<ContractRelationLink>(
        `/contracts/${contractId}/relation-links`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
    );
}

export function deleteContractRelationLink(
    contractId: string,
    linkId: string,
) {
    return contractFetch<{ deleted: boolean }>(
        `/contracts/${contractId}/relation-links/${linkId}`,
        { method: "DELETE" },
    );
}

// ---------------------------------------------------------------------------
// API functions — Contract Documents
// ---------------------------------------------------------------------------

export function getContractDocuments(contractId: string) {
    return contractFetch<ContractDocument[]>(
        `/contracts/${contractId}/documents`,
    );
}

export async function downloadContractDocument(contractId: string, documentId: string, fileName: string) {
    const accessToken = getAccessToken();
    const url = `${CONTRACT_API_HOST}/contracts/${contractId}/documents/${documentId}/download`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
    });

    if (!res.ok) {
        throw new Error("Gagal mengunduh dokumen");
    }

    const blob = await res.blob();
    const windowUrl = window.URL || window.webkitURL;
    const blobUrl = windowUrl.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();

    // Clean up
    document.body.removeChild(anchor);
    windowUrl.revokeObjectURL(blobUrl);
}

export async function previewContractDocument(contractId: string, documentId: string) {
    const accessToken = getAccessToken();
    const url = `${CONTRACT_API_HOST}/contracts/${contractId}/documents/${documentId}/download`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
    });

    if (!res.ok) {
        throw new Error("Gagal memuat dokumen untuk pratinjau");
    }

    const blob = await res.blob();
    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    const windowUrl = window.URL || window.webkitURL;
    const blobUrl = windowUrl.createObjectURL(pdfBlob);

    window.open(blobUrl, "_blank");

    setTimeout(() => {
        windowUrl.revokeObjectURL(blobUrl);
    }, 1000 * 60);
}

export function deleteContractDocument(contractId: string, documentId: string) {
    return contractFetch<{ deleted: boolean }>(
        `/contracts/${contractId}/documents/${documentId}`,
        { method: "DELETE" },
    );
}

// ---------------------------------------------------------------------------
// React Query hooks — Contract Parties
// ---------------------------------------------------------------------------

export function useContractParties(
    filters?: { region?: string; commodity?: string; search?: string },
    options?: Partial<UseQueryOptions<ContractParty[]>>,
) {
    return useQuery({
        queryKey: contractKeys.parties(filters),
        queryFn: () => getContractParties(filters),
        ...options,
    });
}

export function useCreateContractParty(
    options?: Partial<
        UseMutationOptions<ContractParty, Error, CreateContractPartyPayload>
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateContractPartyPayload) =>
            createContractParty(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

export function useUpdateContractParty(
    options?: Partial<
        UseMutationOptions<
            ContractParty,
            Error,
            { id: string; payload: UpdateContractPartyPayload }
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
            payload: UpdateContractPartyPayload;
        }) => updateContractParty(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

export function useDeleteContractParty(
    options?: Partial<
        UseMutationOptions<{ deleted: boolean }, Error, string>
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteContractParty(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

// ---------------------------------------------------------------------------
// React Query hooks — Contracts
// ---------------------------------------------------------------------------

export function useContracts(
    filters?: ContractFilters,
    options?: Partial<UseQueryOptions<Contract[]>>,
) {
    return useQuery({
        queryKey: contractKeys.contracts(filters),
        queryFn: () => getContracts(filters),
        ...options,
    });
}

export function useContract(
    id: string,
    options?: Partial<UseQueryOptions<Contract>>,
) {
    return useQuery({
        queryKey: contractKeys.contract(id),
        queryFn: () => getContractById(id),
        enabled: !!id,
        ...options,
    });
}

export function useCreateContract(
    options?: Partial<
        UseMutationOptions<Contract, Error, CreateContractPayload>
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateContractPayload) => createContract(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

export function useUpdateContract(
    options?: Partial<
        UseMutationOptions<
            Contract,
            Error,
            { id: string; payload: UpdateContractPayload }
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
            payload: UpdateContractPayload;
        }) => updateContract(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

export function useDeleteContract(
    options?: Partial<
        UseMutationOptions<{ deleted: boolean }, Error, string>
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteContract(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

export function useDeleteContractDocument(
    options?: Partial<
        UseMutationOptions<
            { deleted: boolean },
            Error,
            { contractId: string; documentId: string }
        >
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            contractId,
            documentId,
        }: {
            contractId: string;
            documentId: string;
        }) => deleteContractDocument(contractId, documentId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

export function useUploadContractPdf() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) => uploadContractPdf(id, file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
    });
}

// ---------------------------------------------------------------------------
// React Query hooks — Contract Versions
// ---------------------------------------------------------------------------

export function useContractVersions(
    contractId: string,
    options?: Partial<UseQueryOptions<ContractVersion[]>>,
) {
    return useQuery({
        queryKey: contractKeys.versions(contractId),
        queryFn: () => getContractVersions(contractId),
        enabled: !!contractId,
        ...options,
    });
}

export function useCreateContractVersion(
    options?: Partial<
        UseMutationOptions<
            ContractVersion,
            Error,
            { contractId: string; payload: CreateContractVersionPayload }
        >
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            contractId,
            payload,
        }: {
            contractId: string;
            payload: CreateContractVersionPayload;
        }) => createContractVersion(contractId, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

export function useDeleteContractVersion(
    options?: Partial<
        UseMutationOptions<
            { deleted: boolean },
            Error,
            { contractId: string; versionId: string }
        >
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            contractId,
            versionId,
        }: {
            contractId: string;
            versionId: string;
        }) => deleteContractVersion(contractId, versionId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

// ---------------------------------------------------------------------------
// React Query hooks — Contract Volumes
// ---------------------------------------------------------------------------

export function useContractVolumes(
    contractId: string,
    options?: Partial<UseQueryOptions<ContractVolume[]>>,
) {
    return useQuery({
        queryKey: contractKeys.volumes(contractId),
        queryFn: () => getContractVolumes(contractId),
        enabled: !!contractId,
        ...options,
    });
}

export function useUpsertContractVolumes(
    options?: Partial<
        UseMutationOptions<
            ContractVolume[],
            Error,
            { contractId: string; items: UpsertContractVolumeItem[] }
        >
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            contractId,
            items,
        }: {
            contractId: string;
            items: UpsertContractVolumeItem[];
        }) => upsertContractVolumes(contractId, items),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

// ---------------------------------------------------------------------------
// React Query hooks — Contract Daily Delivery
// ---------------------------------------------------------------------------

export function useContractDailyDelivery(
    contractId: string,
    options?: Partial<UseQueryOptions<ContractDailyDelivery[]>>,
) {
    return useQuery({
        queryKey: contractKeys.dailyDelivery(contractId),
        queryFn: () => getContractDailyDelivery(contractId),
        enabled: !!contractId,
        ...options,
    });
}

export function useUpsertContractDailyDelivery(
    options?: Partial<
        UseMutationOptions<
            ContractDailyDelivery[],
            Error,
            { contractId: string; items: UpsertContractDailyDeliveryItem[] }
        >
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            contractId,
            items,
        }: {
            contractId: string;
            items: UpsertContractDailyDeliveryItem[];
        }) => upsertContractDailyDelivery(contractId, items),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

// ---------------------------------------------------------------------------
// React Query hooks — Contract Annual Total
// ---------------------------------------------------------------------------

export function useContractAnnualTotal(
    contractId: string,
    options?: Partial<UseQueryOptions<ContractAnnualTotal[]>>,
) {
    return useQuery({
        queryKey: contractKeys.annualTotal(contractId),
        queryFn: () => getContractAnnualTotal(contractId),
        enabled: !!contractId,
        ...options,
    });
}

export function useUpsertContractAnnualTotal(
    options?: Partial<
        UseMutationOptions<
            ContractAnnualTotal[],
            Error,
            { contractId: string; items: UpsertContractAnnualTotalItem[] }
        >
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            contractId,
            items,
        }: {
            contractId: string;
            items: UpsertContractAnnualTotalItem[];
        }) => upsertContractAnnualTotal(contractId, items),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

// ---------------------------------------------------------------------------
// React Query hooks — Contract Relation Links
// ---------------------------------------------------------------------------

export function useContractRelationLinks(
    contractId: string,
    options?: Partial<UseQueryOptions<ContractRelationLink[]>>,
) {
    return useQuery({
        queryKey: contractKeys.relationLinks(contractId),
        queryFn: () => getContractRelationLinks(contractId),
        enabled: !!contractId,
        ...options,
    });
}

export function useCreateContractRelationLink(
    options?: Partial<
        UseMutationOptions<
            ContractRelationLink,
            Error,
            { contractId: string; payload: CreateContractRelationLinkPayload }
        >
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            contractId,
            payload,
        }: {
            contractId: string;
            payload: CreateContractRelationLinkPayload;
        }) => createContractRelationLink(contractId, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

export function useDeleteContractRelationLink(
    options?: Partial<
        UseMutationOptions<
            { deleted: boolean },
            Error,
            { contractId: string; linkId: string }
        >
    >,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            contractId,
            linkId,
        }: {
            contractId: string;
            linkId: string;
        }) => deleteContractRelationLink(contractId, linkId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all });
        },
        ...options,
    });
}

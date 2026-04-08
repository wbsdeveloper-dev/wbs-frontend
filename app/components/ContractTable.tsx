"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    DataGrid,
    GridColDef,
    GridColumnGroupingModel,
    GridRenderCellParams,
    useGridApiRef,
} from "@mui/x-data-grid";
import {
    Box,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Typography,
    Divider,
} from "@mui/material";
import {
    Pencil,
    Trash2,
    Plus,
    FileText,
    Save,
    X,
    RefreshCw,
    Download,
    Upload,
    Eye
} from "lucide-react";
import {
    useContracts,
    useCreateContract,
    useUpdateContract,
    useDeleteContract,
    createContractParty,
    updateContractParty,
    getContractVolumes,
    upsertContractVolumes,
    getContractDailyDelivery,
    getContractAnnualTotal,
    upsertContractAnnualTotal,
    type Contract,
    type ContractVolume,
    type ContractAnnualTotal,
    type UpsertContractVolumeItem,
    type UpsertContractAnnualTotalItem,
    type ContractDocument,
    type CreateContractPayload,
    useUploadContractPdf,
    getContractDocuments,
    downloadContractDocument,
    previewContractDocument,
} from "@/hooks/service/contract-api";
import { useSites } from "@/hooks/service/site-api";

// ---------------------------------------------------------------------------
// Row shape for the DataGrid (flattened from API response)
// ---------------------------------------------------------------------------

interface ContractTableRow {
    id: string;
    no: number;
    region: string;
    pemasok: string;
    pembangkit: string;
    pemilikKIT: string;
    jenisDokumen: string;
    noKontrakAwal: string;
    jenisDokumenTambahan: string;
    noKontrakTerbaru: string;
    awalPerjanjian: string;
    tanggalEfektif: string;
    akhirPerjanjian: string;
    hargaPJBG: string;
    hgbt: string;
    volumeJPMH: string;
    unitSwitch: string;
    // Keep original contract data for API calls
    _contractId: string;
    _contractPartyId: string;
    _priceUnit: string;
    _hgbtUnit: string;
    _isNew?: boolean;
    // Hidden unit-specific base values
    _bbtud_volumeJPMH: string;
    _mmscfd_volumeJPMH: string;
    // Year tracking for dynamic volume columns
    _awalPerjanjianYear: number | null;
    _akhirPerjanjianYear: number | null;

    // Document
    document: ContractDocument | null;

    // Dynamic volume year fields (volume{year}JPH, volume{year}TOP, etc.)
    [key: string]: string | number | boolean | null | undefined | ContractDocument;
}

// ---------------------------------------------------------------------------
// Format ISO date string → DD-MM-YYYY
// ---------------------------------------------------------------------------

function formatDate(isoStr: string | null | undefined): string {
    if (!isoStr) return "";
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    } catch {
        return isoStr;
    }
}

/** Convert DD-MM-YYYY back to ISO 8601 (YYYY-MM-DD) for the API */
function toISODate(display: string): string | undefined {
    if (!display || !display.trim()) return undefined;
    // Already ISO? (starts with 4-digit year)
    if (/^\d{4}-/.test(display)) return display;
    // DD-MM-YYYY → YYYY-MM-DD
    const parts = display.split("-");
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return display;
}

// ---------------------------------------------------------------------------
// Map API Contract → table row
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers to look up sub-resource data by year / basis
// ---------------------------------------------------------------------------

function findVolume(
    volumes: ContractVolume[],
    year: number,
    basis: string,
    isKepmen = false,
): ContractVolume | undefined {
    return volumes.find(
        (v) => v.year === year && v.basis === basis && v.is_kepmen === isKepmen,
    );
}

function findKepmen(
    volumes: ContractVolume[],
    year: number,
): ContractVolume | undefined {
    return volumes.find((v) => v.year === year && v.is_kepmen === true);
}

function findAnnualTotal(
    items: ContractAnnualTotal[],
    year: number,
): ContractAnnualTotal | undefined {
    return items.find((a) => a.year === year);
}

function numStr(v: number | null | undefined): string {
    return v != null ? String(v) : "";
}

function mapContractToRow(
    contract: Contract,
    index: number,
    volumes: ContractVolume[] = [],
    _dailyDeliveries: unknown[] = [], // eslint-disable-line @typescript-eslint/no-unused-vars
    annualTotals: ContractAnnualTotal[] = [],
    document: ContractDocument | null = null,
    years: number[] = [],
): ContractTableRow {
    // Parse contract year range
    const awalYear = contract.awal_perjanjian ? new Date(contract.awal_perjanjian).getFullYear() : null;
    const akhirYear = contract.akhir_perjanjian ? new Date(contract.akhir_perjanjian).getFullYear() : null;

    const row: ContractTableRow = {
        id: contract.id,
        no: index + 1,
        region: contract.region || "",
        pemasok: contract.pemasok_name || "",
        pembangkit: contract.pembangkit_name || "",
        pemilikKIT: contract.owner_kit || "",
        jenisDokumen: contract.doc_type || "",
        noKontrakAwal: contract.no_kontrak_awal || "",
        jenisDokumenTambahan: contract.doc_type_latest || "",
        noKontrakTerbaru: contract.no_kontrak_terbaru || "",
        awalPerjanjian: formatDate(contract.awal_perjanjian),
        tanggalEfektif: formatDate(contract.tanggal_efektif),
        akhirPerjanjian: formatDate(contract.akhir_perjanjian),
        hargaPJBG: contract.price_value != null ? String(contract.price_value) : "",
        hgbt: contract.hgbt_value != null ? String(contract.hgbt_value) : "",
        volumeJPMH: contract.volume_jpmh_bbtud != null
            ? String(contract.volume_jpmh_bbtud)
            : "",
        unitSwitch: "BBTUD",
        _contractId: contract.id,
        _contractPartyId: contract.contract_party_id,
        _priceUnit: contract.price_unit || "USD_PER_MMBTU",
        _hgbtUnit: contract.hgbt_unit || "",
        _awalPerjanjianYear: awalYear,
        _akhirPerjanjianYear: akhirYear,
        // Hidden unit-specific base values
        _bbtud_volumeJPMH: contract.volume_jpmh_bbtud != null ? String(contract.volume_jpmh_bbtud) : "",
        _mmscfd_volumeJPMH: contract.volume_jpmh_mmscfd != null ? String(contract.volume_jpmh_mmscfd) : "",

        document,
    };

    // Dynamically populate volume year fields (JPH, TOP, %TOP, Jumlah Kontrak Tahunan, Volume Kepmen)
    for (const year of years) {
        const jph = findVolume(volumes, year, "JPH");
        const top = findVolume(volumes, year, "TOP");
        const kepmen = findKepmen(volumes, year);
        const annual = findAnnualTotal(annualTotals, year);

        // Visible values (default to BBTUD)
        row[`volume${year}JPH`] = numStr(jph?.value_bbtud);
        row[`volume${year}TOP`] = numStr(top?.value_bbtud);
        row[`volume${year}PercentTOP`] = numStr(top?.top_percentage);
        row[`jumlahKontrakTahunan${year}`] = numStr(annual?.total_bbtu);
        row[`volumeKepmen${year}`] = numStr(kepmen?.value_bbtud);

        // Hidden BBTUD values
        row[`_bbtud_volume${year}JPH`] = numStr(jph?.value_bbtud);
        row[`_bbtud_volume${year}TOP`] = numStr(top?.value_bbtud);
        row[`_bbtud_volume${year}PercentTOP`] = numStr(top?.top_percentage);
        row[`_bbtud_jumlahKontrakTahunan${year}`] = numStr(annual?.total_bbtu);
        row[`_bbtud_volumeKepmen${year}`] = numStr(kepmen?.value_bbtud);

        // Hidden MMSCFD values
        row[`_mmscfd_volume${year}JPH`] = numStr(jph?.value_mmscfd);
        row[`_mmscfd_volume${year}TOP`] = numStr(top?.value_mmscfd);
        row[`_mmscfd_volume${year}PercentTOP`] = numStr(top?.top_percentage_mmscfd);
        row[`_mmscfd_jumlahKontrakTahunan${year}`] = numStr(annual?.total_mmscfd);
        row[`_mmscfd_volumeKepmen${year}`] = numStr(kepmen?.value_mmscfd);
    }

    return row;
}

function createEmptyRow(rowNumber: number, years: number[] = []): ContractTableRow {
    const newId = `new-${Date.now()}`;
    const row: ContractTableRow = {
        id: newId,
        no: rowNumber,
        region: "",
        pemasok: "",
        pembangkit: "",
        pemilikKIT: "",
        jenisDokumen: "",
        noKontrakAwal: "",
        jenisDokumenTambahan: "",
        noKontrakTerbaru: "",
        awalPerjanjian: "",
        tanggalEfektif: "",
        akhirPerjanjian: "",
        hargaPJBG: "",
        hgbt: "",
        volumeJPMH: "",
        unitSwitch: "BBTUD",
        _contractId: newId,
        _contractPartyId: "",
        _priceUnit: "USD_PER_MMBTU",
        _hgbtUnit: "",
        _isNew: true,
        _awalPerjanjianYear: null,
        _akhirPerjanjianYear: null,
        // Hidden unit-specific base values
        _bbtud_volumeJPMH: "",
        _mmscfd_volumeJPMH: "",

        document: null,
    };

    // Dynamically populate volume year fields
    for (const year of years) {
        row[`volume${year}JPH`] = "";
        row[`volume${year}TOP`] = "";
        row[`volume${year}PercentTOP`] = "";
        row[`jumlahKontrakTahunan${year}`] = "";
        row[`volumeKepmen${year}`] = "";
        row[`_bbtud_volume${year}JPH`] = "";
        row[`_bbtud_volume${year}TOP`] = "";
        row[`_bbtud_volume${year}PercentTOP`] = "";
        row[`_bbtud_jumlahKontrakTahunan${year}`] = "";
        row[`_bbtud_volumeKepmen${year}`] = "";
        row[`_mmscfd_volume${year}JPH`] = "";
        row[`_mmscfd_volume${year}TOP`] = "";
        row[`_mmscfd_volume${year}PercentTOP`] = "";
        row[`_mmscfd_jumlahKontrakTahunan${year}`] = "";
        row[`_mmscfd_volumeKepmen${year}`] = "";
    }

    return row;
}

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

// Cell renderer — edit mode shows bordered input-like box, view mode shows plain text
function makeRenderCell(isEditMode: boolean) {
    const RenderCell = (params: GridRenderCellParams) => {
        if (isEditMode) {
            return (
                <Box
                    sx={{
                        width: "calc(100% - 8px)",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        backgroundColor: "#fff",
                        px: 1,
                        mx: "auto",
                        fontSize: "12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {params.value}
                </Box>
            );
        }
        return (
            <span className="text-xs text-gray-700 truncate">
                {params.value || <span style={{ fontSize: "10px", color: "#aaa" }}>—</span>}
            </span>
        );
    };
    RenderCell.displayName = "RenderCell";
    return RenderCell;
}

// ---------------------------------------------------------------------------
// Build columns dynamically based on edit mode
// ---------------------------------------------------------------------------

function buildColumns(
    isEditMode: boolean,
    supplierNames: string[],
    powerplantNames: string[],
    years: number[] = [],
): GridColDef[] {
    const renderCell = makeRenderCell(isEditMode);

    // Custom renderCell for volume year columns with grayed-out support
    const makeVolumeYearRenderCell = (year: number) => {
        const VolumeYearCell = (params: GridRenderCellParams) => {
            const row = params.row;
            const contractEndYear = row._akhirPerjanjianYear;

            // Year is beyond contract end → grayed/disabled cell
            if (contractEndYear !== null && contractEndYear !== undefined && year > contractEndYear) {
                return (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f3f4f6",
                            color: "#d1d5db",
                            fontSize: "12px",
                            cursor: "not-allowed",
                        }}
                    >
                        —
                    </Box>
                );
            }

            // Normal rendering
            if (isEditMode) {
                return (
                    <Box
                        sx={{
                            width: "calc(100% - 8px)",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            backgroundColor: "#fff",
                            px: 1,
                            mx: "auto",
                            fontSize: "12px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {params.value || "—"}
                    </Box>
                );
            }
            return (
                <span className="text-xs text-gray-700 truncate">
                    {params.value || <span style={{ fontSize: "10px", color: "#aaa" }}>—</span>}
                </span>
            );
        };
        VolumeYearCell.displayName = `VolumeYearCell_${year}`;
        return VolumeYearCell;
    };

    const cols: GridColDef[] = [
        {
            field: "no",
            headerName: "No",
            width: 60,
            headerAlign: "center",
            align: "center",
            editable: false,
        },
        {
            field: "region",
            headerName: "Region",
            width: 160,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "pemasok",
            headerName: "Pemasok",
            width: 160,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            type: isEditMode ? "singleSelect" : "string",
            valueOptions: supplierNames,
            renderCell,
        },
        {
            field: "pembangkit",
            headerName: "Pembangkit",
            width: 180,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            type: isEditMode ? "singleSelect" : "string",
            valueOptions: powerplantNames,
            renderCell,
        },
        {
            field: "pemilikKIT",
            headerName: "Pemilik KIT",
            width: 150,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "jenisDokumen",
            headerName: "Jenis Dokumen",
            width: 200,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "noKontrakAwal",
            headerName: "No Kontrak Awal",
            width: 180,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "jenisDokumenTambahan",
            headerName: "Jenis Dokumen",
            width: 210,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "noKontrakTerbaru",
            headerName: "No Kontrak Terbaru",
            width: 160,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "awalPerjanjian",
            headerName: "Awal Perjanjian",
            width: 140,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "tanggalEfektif",
            headerName: "Tanggal Efektif",
            width: 140,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "akhirPerjanjian",
            headerName: "Akhir Perjanjian",
            width: 140,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "hargaPJBG",
            headerName: "Harga PJBG",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "hgbt",
            headerName: "HGBT",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeJPMH",
            headerName: "Volume JPMH",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
    ];

    // Add dynamic volume year group columns (JPH, TOP, %TOP, Jumlah Kontrak Tahunan, Volume Kepmen)
    for (const year of years) {
        const yearRenderCell = makeVolumeYearRenderCell(year);
        cols.push(
            {
                field: `volume${year}JPH`,
                headerName: "JPH",
                width: 100,
                headerAlign: "center",
                align: "center",
                editable: isEditMode,
                renderCell: yearRenderCell,
            },
            {
                field: `volume${year}TOP`,
                headerName: "TOP",
                width: 120,
                headerAlign: "center",
                align: "center",
                editable: isEditMode,
                renderCell: yearRenderCell,
            },
            {
                field: `volume${year}PercentTOP`,
                headerName: "% TOP",
                width: 120,
                headerAlign: "center",
                align: "center",
                editable: isEditMode,
                renderCell: yearRenderCell,
            },
            {
                field: `jumlahKontrakTahunan${year}`,
                headerName: `JUMLAH KONTRAK TAHUNAN ${year}`,
                width: 240,
                headerAlign: "center",
                align: "center",
                editable: isEditMode,
                renderCell: yearRenderCell,
            },
            {
                field: `volumeKepmen${year}`,
                headerName: `Volume Kepmen ${year}`,
                width: 120,
                headerAlign: "center",
                align: "center",
                editable: isEditMode,
                renderCell: yearRenderCell,
            },
        );
    }

    return cols;
}

// ---------------------------------------------------------------------------
// Column grouping
// ---------------------------------------------------------------------------

function buildColumnGroupingModel(years: number[]): GridColumnGroupingModel {
    return years.map((year) => ({
        groupId: `volume${year}`,
        headerName: `Volume ${year}`,
        headerAlign: "center" as const,
        children: [
            { field: `volume${year}JPH` },
            { field: `volume${year}TOP` },
            { field: `volume${year}PercentTOP` },
        ],
    }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContractTable() {
    const apiRef = useGridApiRef();

    // File Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const uploadMutation = useUploadContractPdf();

    const [rows, setRows] = useState<ContractTableRow[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [documentModalRowId, setDocumentModalRowId] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error";
    }>({ open: false, message: "", severity: "success" });

    // ---- API hooks ----
    const { data: supplierSitesData } = useSites({ type: "PEMASOK" });
    const { data: powerplantSitesData } = useSites({ type: "PEMBANGKIT" });

    const supplierSites = useMemo(() => supplierSitesData || [], [supplierSitesData]);
    const powerplantSites = useMemo(() => powerplantSitesData || [], [powerplantSitesData]);
    const supplierNames = useMemo(() => supplierSites.map((s) => s.name), [supplierSites]);
    const powerplantNames = useMemo(() => powerplantSites.map((s) => s.name), [powerplantSites]);

    const {
        data: contracts,
        isLoading,
        isError,
        error,
        refetch,
    } = useContracts();

    const createMutation = useCreateContract({
        onSuccess: () => {
            setSnackbar({
                open: true,
                message: "Kontrak berhasil disimpan",
                severity: "success",
            });
        },
        onError: (err) => {
            setSnackbar({
                open: true,
                message: `Gagal menyimpan: ${err.message}`,
                severity: "error",
            });
        },
    });

    const updateMutation = useUpdateContract({
        onSuccess: () => {
            setSnackbar({
                open: true,
                message: "Kontrak berhasil diperbarui",
                severity: "success",
            });
        },
        onError: (err) => {
            setSnackbar({
                open: true,
                message: `Gagal memperbarui: ${err.message}`,
                severity: "error",
            });
        },
    });

    const deleteMutation = useDeleteContract({
        onSuccess: () => {
            setSnackbar({
                open: true,
                message: "Kontrak berhasil dihapus",
                severity: "success",
            });
        },
        onError: (err) => {
            setSnackbar({
                open: true,
                message: `Gagal menghapus: ${err.message}`,
                severity: "error",
            });
        },
    });

    // ---- Compute dynamic year range from contracts ----
    const yearRange = useMemo(() => {
        if (!contracts || contracts.length === 0) return [];
        let minYear = Infinity;
        let maxYear = -Infinity;
        for (const c of contracts) {
            if (c.awal_perjanjian) {
                const y = new Date(c.awal_perjanjian).getFullYear();
                if (y < minYear) minYear = y;
            }
            if (c.akhir_perjanjian) {
                const y = new Date(c.akhir_perjanjian).getFullYear();
                if (y > maxYear) maxYear = y;
            }
        }
        if (minYear === Infinity || maxYear === -Infinity) return [];
        const years: number[] = [];
        for (let y = minYear; y <= maxYear; y++) years.push(y);
        return years;
    }, [contracts]);

    // ---- Sync API data → local rows (fetch sub-resources per contract) ----
    useEffect(() => {
        if (!contracts || contracts.length === 0) {
            setRows([]);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const enriched = await Promise.all(
                    contracts.map(async (contract, index) => {
                        const [volumes, dailyDeliveries, annualTotals, documents] =
                            await Promise.all([
                                getContractVolumes(contract.id).catch(() => []),
                                getContractDailyDelivery(contract.id).catch(() => []),
                                getContractAnnualTotal(contract.id).catch(() => []),
                                getContractDocuments(contract.id).catch(() => []),
                            ]);

                        // Just use the latest document if it exists
                        const latestDocument = documents.length > 0 ? documents[0] : null;

                        return mapContractToRow(
                            contract,
                            index,
                            volumes,
                            dailyDeliveries,
                            annualTotals,
                            latestDocument,
                            yearRange,
                        );
                    }),
                );
                if (!cancelled) setRows(enriched);
            } catch (err) {
                console.error("Failed to load sub-resource data:", err);
                // Fallback: show rows without sub-resource data
                if (!cancelled) setRows(contracts.map((c, i) => mapContractToRow(c, i, [], [], [], null, yearRange)));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [contracts, yearRange]);

    // ---- Handlers ----

    const processRowUpdate = useCallback(
        (newRow: ContractTableRow) => {
            setRows((prev) =>
                prev.map((row) => (row.id === newRow.id ? newRow : row)),
            );
            return newRow;
        },
        [],
    );

    const handleExport = useCallback(() => {
        if (!rows || rows.length === 0) {
            setSnackbar({ open: true, message: "Tidak ada data untuk diekspor", severity: "error" });
            return;
        }

        const headers = [
            "No", "Region", "Pemasok", "Pembangkit", "Pemilik KIT",
            "Jenis Dokumen", "No Kontrak Awal", "Jenis Dokumen Tambahan", "No Kontrak Terbaru",
            "Awal Perjanjian", "Tanggal Efektif", "Akhir Perjanjian",
            "Harga PJBG", "Harga HGBT", "Unit", "Volume JPMH"
        ];

        for (const year of yearRange) {
            headers.push(`Volume ${year} JPH`);
            headers.push(`Volume ${year} TOP`);
            headers.push(`Volume ${year} % TOP`);
            headers.push(`Jumlah Kontrak Tahunan ${year}`);
            headers.push(`Volume Kepmen ${year}`);
        }

        const escapeCSV = (val: unknown) => {
            if (val === null || val === undefined || val === "") return '""';
            const str = String(val);
            if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("—")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return `"${str}"`;
        };

        const csvRows: string[] = [headers.map(escapeCSV).join(",")];

        for (const row of rows) {
            const rowData: unknown[] = [
                row.no, row.region, row.pemasok, row.pembangkit, row.pemilikKIT,
                row.jenisDokumen, row.noKontrakAwal, row.jenisDokumenTambahan, row.noKontrakTerbaru,
                row.awalPerjanjian, row.tanggalEfektif, row.akhirPerjanjian,
                row.hargaPJBG, row.hgbt, row.unitSwitch, row.volumeJPMH
            ];

            for (const year of yearRange) {
                if (row._akhirPerjanjianYear !== null && row._akhirPerjanjianYear !== undefined && year > row._akhirPerjanjianYear) {
                    rowData.push("—", "—", "—", "—", "—");
                } else {
                    rowData.push(
                        row[`volume${year}JPH`],
                        row[`volume${year}TOP`],
                        row[`volume${year}PercentTOP`],
                        row[`jumlahKontrakTahunan${year}`],
                        row[`volumeKepmen${year}`]
                    );
                }
            }

            csvRows.push(rowData.map(escapeCSV).join(","));
        }

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `kontrak_gas_pipa_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [rows, yearRange]);

    const handleAddRow = useCallback(() => {
        setRows((prev) => [...prev, createEmptyRow(prev.length + 1, yearRange)]);
        setIsEditMode(true);
    }, [yearRange]);

    const handleDeleteRow = useCallback(
        (id: string) => {
            setDeleteConfirmId(id);
        },
        [],
    );

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteConfirmId) return;

        const row = rows.find((r) => r.id === deleteConfirmId);
        if (!row) {
            setDeleteConfirmId(null);
            return;
        }

        // New unsaved row — just remove from local state
        if (row._isNew) {
            setRows((prev) => {
                const filtered = prev.filter((r) => r.id !== deleteConfirmId);
                return filtered.map((r, i) => ({ ...r, no: i + 1 }));
            });
            setSnackbar({
                open: true,
                message: "Kontrak berhasil dihapus",
                severity: "success",
            });
            setDeleteConfirmId(null);
            return;
        }

        // Existing row — delete via API immediately
        try {
            await deleteMutation.mutateAsync(deleteConfirmId);
            setRows((prev) => {
                const filtered = prev.filter((r) => r.id !== deleteConfirmId);
                return filtered.map((r, i) => ({ ...r, no: i + 1 }));
            });
            // Remove from pendingDeletes if it was tracked
            setPendingDeletes((prev) => prev.filter((id) => id !== deleteConfirmId));
            setSnackbar({
                open: true,
                message: "Kontrak berhasil dihapus",
                severity: "success",
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Terjadi kesalahan";
            setSnackbar({
                open: true,
                message: `Gagal menghapus: ${message}`,
                severity: "error",
            });
        }

        setDeleteConfirmId(null);
    }, [deleteConfirmId, rows, deleteMutation]);

    // ---- Helper: save volume sub-resources for a contract row ----
    const saveSubResources = useCallback(
        async (contractId: string, row: ContractTableRow) => {
            // First, make sure hidden fields are up-to-date with visible values
            const currentPrefix = row.unitSwitch === "BBTUD" ? "_bbtud_" : "_mmscfd_";
            const volumeFieldNames = [
                "volumeJPMH",
                ...yearRange.flatMap(y => [
                    `volume${y}JPH`, `volume${y}TOP`, `volume${y}PercentTOP`,
                    `jumlahKontrakTahunan${y}`, `volumeKepmen${y}`,
                ]),
            ];
            for (const field of volumeFieldNames) {
                row[`${currentPrefix}${field}`] = row[field];
            }

            // Helper to parse hidden field value
            const bVal = (field: string): number | undefined => {
                const v = row[`_bbtud_${field}`];
                return v ? parseFloat(String(v)) : undefined;
            };
            const mVal = (field: string): number | undefined => {
                const v = row[`_mmscfd_${field}`];
                return v ? parseFloat(String(v)) : undefined;
            };

            // --- Contract Volumes (JPH, TOP, Kepmen for each year) ---
            const volumeItems: UpsertContractVolumeItem[] = [];

            for (const year of yearRange) {
                // JPH
                if (bVal(`volume${year}JPH`) !== undefined || mVal(`volume${year}JPH`) !== undefined) {
                    volumeItems.push({
                        year,
                        basis: "JPH",
                        value_bbtud: bVal(`volume${year}JPH`) ?? 0,
                        value_mmscfd: mVal(`volume${year}JPH`),
                    });
                }
                // TOP (+ %TOP as top_percentage)
                if (bVal(`volume${year}TOP`) !== undefined || bVal(`volume${year}PercentTOP`) !== undefined ||
                    mVal(`volume${year}TOP`) !== undefined || mVal(`volume${year}PercentTOP`) !== undefined) {
                    volumeItems.push({
                        year,
                        basis: "TOP",
                        value_bbtud: bVal(`volume${year}TOP`) ?? 0,
                        value_mmscfd: mVal(`volume${year}TOP`),
                        top_percentage: bVal(`volume${year}PercentTOP`),
                        top_percentage_mmscfd: mVal(`volume${year}PercentTOP`),
                    });
                }
                // Kepmen
                if (bVal(`volumeKepmen${year}`) !== undefined || mVal(`volumeKepmen${year}`) !== undefined) {
                    volumeItems.push({
                        year,
                        basis: "JPH",
                        value_bbtud: bVal(`volumeKepmen${year}`) ?? 0,
                        value_mmscfd: mVal(`volumeKepmen${year}`),
                        is_kepmen: true,
                    });
                }
            }

            if (volumeItems.length > 0) {
                await upsertContractVolumes(contractId, volumeItems);
            }

            // --- Contract Annual Total (dynamic years) ---
            const annualItems: UpsertContractAnnualTotalItem[] = [];
            for (const year of yearRange) {
                const bbtudAnnual = bVal(`jumlahKontrakTahunan${year}`);
                const mmscfdAnnual = mVal(`jumlahKontrakTahunan${year}`);
                if (bbtudAnnual !== undefined || mmscfdAnnual !== undefined) {
                    annualItems.push({
                        year,
                        total_bbtu: bbtudAnnual ?? 0,
                        total_mmscfd: mmscfdAnnual,
                    });
                }
            }
            if (annualItems.length > 0) {
                await upsertContractAnnualTotal(contractId, annualItems);
            }
        },
        [yearRange],
    );

    const handleSave = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);

        // Commit any pending cell edits before saving
        try {
            const editRows = apiRef.current?.state?.editRows;
            if (editRows) {
                const editRowIds = Object.keys(editRows);
                for (const rowId of editRowIds) {
                    const fields = Object.keys(editRows[rowId] || {});
                    for (const field of fields) {
                        apiRef.current!.stopCellEditMode({ id: rowId, field });
                    }
                }
            }
        } catch {
            // Ignore — grid may not be in edit mode
        }

        // Wait a tick for React state to update with committed edits
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Read the latest rows from state
        const currentRows = await new Promise<ContractTableRow[]>(
            (resolve) => {
                setRows((prev) => {
                    resolve(prev);
                    return prev;
                });
            },
        );

        try {
            // Delete rows that were removed during edit mode
            for (const deleteId of pendingDeletes) {
                await deleteMutation.mutateAsync(deleteId);
            }

            for (const row of currentRows) {
                if (row._isNew) {

                    // Auto-create a contract party if none is set
                    let partyId = row._contractPartyId;
                    if (!partyId) {
                        const selectedSupplier = supplierSites.find((s) => s.name === row.pemasok);
                        const selectedPowerplant = powerplantSites.find((s) => s.name === row.pembangkit);

                        const party = await createContractParty({
                            region: row.region || undefined,
                            owner_kit: row.pemilikKIT || undefined,
                            pemasok_site_id: selectedSupplier?.id,
                            pembangkit_site_id: selectedPowerplant?.id,
                        });
                        partyId = party.id;
                    }

                    // Build payload matching backend Joi schema
                    const validDocTypes = ["PJBG", "OTHER"];
                    const createPayload: Record<string, unknown> = {
                        contract_party_id: partyId,
                        no_kontrak_awal: row.noKontrakAwal.trim() || "",
                    };

                    // doc_type must be "PJBG" or "OTHER"
                    if (validDocTypes.includes(row.jenisDokumen))
                        createPayload.doc_type = row.jenisDokumen;
                    if (validDocTypes.includes(row.jenisDokumenTambahan))
                        createPayload.doc_type_latest = row.jenisDokumenTambahan;

                    // Optional string fields
                    if (row.noKontrakTerbaru.trim())
                        createPayload.no_kontrak_terbaru = row.noKontrakTerbaru;

                    // Date fields (convert DD-MM-YYYY → ISO)
                    const isoAwal = toISODate(row.awalPerjanjian);
                    if (isoAwal) createPayload.awal_perjanjian = isoAwal;
                    const isoEfektif = toISODate(row.tanggalEfektif);
                    if (isoEfektif) createPayload.tanggal_efektif = isoEfektif;
                    const isoAkhir = toISODate(row.akhirPerjanjian);
                    if (isoAkhir) createPayload.akhir_perjanjian = isoAkhir;

                    // Numeric fields — sync JPMH to hidden fields first
                    const newJpmhPrefix = row.unitSwitch === "BBTUD" ? "_bbtud_" : "_mmscfd_";
                    row[`${newJpmhPrefix}volumeJPMH`] = row.volumeJPMH;

                    if (row._bbtud_volumeJPMH)
                        createPayload.volume_jpmh_bbtud = parseFloat(String(row._bbtud_volumeJPMH));
                    if (row._mmscfd_volumeJPMH)
                        createPayload.volume_jpmh_mmscfd = parseFloat(String(row._mmscfd_volumeJPMH));
                    if (row.hargaPJBG)
                        createPayload.price_value = parseFloat(row.hargaPJBG);
                    if (row.hgbt)
                        createPayload.hgbt_value = parseFloat(row.hgbt);

                    const createdContract = await createMutation.mutateAsync(createPayload as unknown as CreateContractPayload);

                    // Save sub-resource data for the newly created contract
                    await saveSubResources(createdContract.id, row);
                } else {
                    const original = contracts?.find((c) => c.id === row.id);
                    if (!original) continue;

                    const payload: Record<string, unknown> = {};
                    if (row.jenisDokumen !== (original.doc_type || ""))
                        payload.doc_type = row.jenisDokumen;
                    if (row.jenisDokumenTambahan !== (original.doc_type_latest || ""))
                        payload.doc_type_latest = row.jenisDokumenTambahan;
                    if (row.noKontrakAwal !== (original.no_kontrak_awal || ""))
                        payload.no_kontrak_awal = row.noKontrakAwal;
                    if (row.noKontrakTerbaru !== (original.no_kontrak_terbaru || ""))
                        payload.no_kontrak_terbaru = row.noKontrakTerbaru;
                    if (row.awalPerjanjian !== formatDate(original.awal_perjanjian))
                        payload.awal_perjanjian = toISODate(row.awalPerjanjian) || null;
                    if (row.tanggalEfektif !== formatDate(original.tanggal_efektif))
                        payload.tanggal_efektif = toISODate(row.tanggalEfektif) || null;
                    if (row.akhirPerjanjian !== formatDate(original.akhir_perjanjian))
                        payload.akhir_perjanjian = toISODate(row.akhirPerjanjian) || null;

                    const newPrice = row.hargaPJBG ? parseFloat(row.hargaPJBG) : null;
                    if (newPrice !== original.price_value)
                        payload.price_value = newPrice;

                    const newhgbt = row.hgbt ? parseFloat(row.hgbt) : null;
                    if (newhgbt !== original.hgbt_value) payload.hgbt_value = newhgbt;

                    // Sync visible volumeJPMH to correct hidden field
                    const jpmhPrefix = row.unitSwitch === "BBTUD" ? "_bbtud_" : "_mmscfd_";
                    (row as any)[`${jpmhPrefix}volumeJPMH`] = row.volumeJPMH;

                    const newVolBbtud = row._bbtud_volumeJPMH ? parseFloat(row._bbtud_volumeJPMH) : null;
                    if (newVolBbtud !== original.volume_jpmh_bbtud)
                        payload.volume_jpmh_bbtud = newVolBbtud;

                    const newVolMmscfd = row._mmscfd_volumeJPMH ? parseFloat(row._mmscfd_volumeJPMH) : null;
                    if (newVolMmscfd !== original.volume_jpmh_mmscfd)
                        payload.volume_jpmh_mmscfd = newVolMmscfd;

                    // Update contract party fields (region, pemilikKIT, pemasok_site_id, pembangkit_site_id)
                    const partyPayload: Record<string, unknown> = {};
                    if (row.region !== (original.region || ""))
                        partyPayload.region = row.region || null;
                    if (row.pemilikKIT !== (original.owner_kit || ""))
                        partyPayload.owner_kit = row.pemilikKIT || null;

                    if (row.pemasok !== ((original as any).pemasok_name || "")) {
                        const newSupplier = supplierSites.find((s) => s.name === row.pemasok);
                        partyPayload.pemasok_site_id = newSupplier ? newSupplier.id : null;
                    }
                    if (row.pembangkit !== ((original as any).pembangkit_name || "")) {
                        const newPowerplant = powerplantSites.find((s) => s.name === row.pembangkit);
                        partyPayload.pembangkit_site_id = newPowerplant ? newPowerplant.id : null;
                    }

                    if (Object.keys(partyPayload).length > 0) {
                        await updateContractParty(row._contractPartyId, partyPayload as any);
                    }

                    if (Object.keys(payload).length > 0) {
                        await updateMutation.mutateAsync({
                            id: row.id,
                            payload,
                        });
                    }

                    // Always save sub-resource data for existing rows
                    await saveSubResources(row.id, row);
                }
            }

            setPendingDeletes([]);
            setIsEditMode(false);
        } catch (err) {
            console.error("Save error:", err);
            const message = err instanceof Error ? err.message : "Terjadi kesalahan";
            setSnackbar({
                open: true,
                message: `Gagal menyimpan: ${message}`,
                severity: "error",
            });
        } finally {
            setIsSaving(false);
        }
    }, [contracts, createMutation, updateMutation, deleteMutation, apiRef, isSaving, pendingDeletes, saveSubResources, powerplantSites, supplierSites]);

    const handleCancel = useCallback(() => {
        if (contracts) {
            setRows(contracts.map((c, i) => mapContractToRow(c, i, [], [], [], null, yearRange)));
        }
        setPendingDeletes([]);
        setIsEditMode(false);
    }, [contracts, yearRange]);

    const handleUnitToggle = useCallback(
        (id: string, newValue: string | null) => {
            if (newValue !== null) {
                setRows((prev) =>
                    prev.map((row) => {
                        if (row.id !== id || row.unitSwitch === newValue) return row;

                        const updated: ContractTableRow = { ...row, unitSwitch: newValue };

                        // Save current visible values back to the old unit's hidden fields
                        const oldPrefix = row.unitSwitch === "BBTUD" ? "_bbtud_" : "_mmscfd_";
                        const volumeFields = [
                            "volumeJPMH",
                            ...yearRange.flatMap(y => [
                                `volume${y}JPH`, `volume${y}TOP`, `volume${y}PercentTOP`,
                                `jumlahKontrakTahunan${y}`, `volumeKepmen${y}`,
                            ]),
                        ];

                        for (const field of volumeFields) {
                            updated[`${oldPrefix}${field}`] = row[field];
                        }

                        // Copy new unit's hidden values into visible fields
                        const newPrefix = newValue === "BBTUD" ? "_bbtud_" : "_mmscfd_";
                        for (const field of volumeFields) {
                            updated[field] = row[`${newPrefix}${field}`] || "";
                        }

                        return updated;
                    }),
                );
            }
        },
        [yearRange],
    );

    const handleUploadClick = useCallback((rowId: string) => {
        setUploadingRowId(rowId);
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !uploadingRowId) return;

        setSelectedFileName(file.name);
        setSelectedFile(file);

        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [uploadingRowId]);

    // ---- Column definitions ----

    const baseColumns = buildColumns(isEditMode, supplierNames, powerplantNames, yearRange);

    const unitColumn: GridColDef = {
        field: "unitSwitch",
        headerName: "Unit",
        width: 170,
        headerAlign: "center",
        align: "center",
        editable: false,
        sortable: false,
        renderCell: (params) => (
            <ToggleButtonGroup
                value={params.value}
                exclusive
                onChange={(_, newValue) =>
                    handleUnitToggle(params.row.id, newValue)
                }
                size="small"
                sx={{
                    height: "30px",
                    borderRadius: "8px",
                    gap: "1px",
                    "& .MuiToggleButton-root": {
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        px: 1.5,
                        py: 0.3,
                        textTransform: "none",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px !important",
                        color: "#9ca3af",
                        "&.Mui-selected": {
                            backgroundColor: "#115d72",
                            color: "#fff",
                            border: "1px solid #115d72",
                            "&:hover": {
                                backgroundColor: "#0d4a5c",
                            },
                        },
                    },
                }}
            >
                <ToggleButton value="BBTUD">BBTUD</ToggleButton>
                <ToggleButton value="MMSCFD">MMSCFD</ToggleButton>
            </ToggleButtonGroup>
        ),
    };

    // Insert unitSwitch after hgbt
    const hgbtIndex = baseColumns.findIndex((col) => col.field === "hgbt");
    const columnsWithSwitch = [
        ...baseColumns.slice(0, hgbtIndex + 1),
        unitColumn,
        ...baseColumns.slice(hgbtIndex + 1),
    ];

    const allColumns: GridColDef[] = [
        ...columnsWithSwitch,
        {
            field: "action",
            headerName: "Action",
            width: 100,
            headerAlign: "center",
            align: "center",
            sortable: false,
            editable: false,
            renderCell: (params) => {
                const document = params.row.document;

                return (
                    <Box
                        sx={{
                            display: "flex",
                            gap: 0.5,
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                        }}
                    >
                        <IconButton
                            size="small"
                            sx={{
                                color: document ? "#115d72" : "#f59e0b", // Green if has document, amber if not
                                "&:hover": { color: document ? "#115d72" : "#d97706" },
                            }}
                            onClick={() => setDocumentModalRowId(params.row.id as string)}
                            title="Kelola Dokumen"
                        >
                            <FileText size={16} />
                        </IconButton>

                        <IconButton
                            size="small"
                            sx={{
                                color: "#ef4444",
                                "&:hover": { color: "#dc2626" },
                            }}
                            onClick={() => handleDeleteRow(params.row.id as string)}
                            title="Hapus Kontrak"
                        >
                            <Trash2 size={16} />
                        </IconButton>
                    </Box>
                );
            },
        },
    ];



    // ---- Loading state ----
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-[#115d72]" />
                        <h3 className="text-sm font-semibold text-gray-800">
                            Tabel Kontrak Gas Pipa
                        </h3>
                    </div>
                </div>
                <div className="flex items-center justify-center py-20">
                    <CircularProgress size={40} sx={{ color: "#115d72" }} />
                    <span className="ml-3 text-sm text-gray-500">
                        Memuat data kontrak...
                    </span>
                </div>
            </div>
        );
    }

    // ---- Error state ----
    if (isError) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-[#115d72]" />
                        <h3 className="text-sm font-semibold text-gray-800">
                            Tabel Kontrak Gas Pipa
                        </h3>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="text-red-500 text-sm font-medium">
                        Gagal memuat data kontrak
                    </div>
                    <div className="text-gray-400 text-xs">
                        {error?.message || "Terjadi kesalahan"}
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200"
                    >
                        <RefreshCw size={14} />
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    // ---- Main render ----
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <input
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            {/* Card Header with Actions */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-[#115d72]" />
                    <h3 className="text-sm font-semibold text-gray-800">
                        Tabel Kontrak Gas Pipa
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    {/* Export button */}
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#115d72] bg-[#115d72]/5 border border-[#115d72]/20 rounded-lg hover:bg-[#115d72]/10 transition-all duration-200">
                        <FileText size={16} />
                        Ekspor
                    </button>

                    {/* Add row button (only in edit mode) */}
                    {isEditMode && (
                        <button
                            onClick={handleAddRow}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
                        >
                            <Plus size={16} />
                            Tambah Baris
                        </button>
                    )}

                    {/* View/Edit toggle */}
                    {isEditMode ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
                            >
                                <X size={16} />
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <CircularProgress
                                        size={16}
                                        sx={{ color: "#fff" }}
                                    />
                                ) : (
                                    <Save size={16} />
                                )}
                                {isSaving ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
                        >
                            <Pencil size={16} />
                            Edit Data
                        </button>
                    )}
                </div>
            </div>

            {/* Mode indicator */}
            {isEditMode && (
                <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                    <Pencil size={14} className="text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">
                        Mode Edit — Klik sel untuk mengedit, lalu tekan Simpan
                        untuk menyimpan perubahan
                    </span>
                </div>
            )}

            {/* Data Table */}
            <div className="w-full">
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                    <DataGrid
                        apiRef={apiRef}
                        rows={rows}
                        columns={allColumns}
                        columnGroupingModel={buildColumnGroupingModel(yearRange)}
                        processRowUpdate={processRowUpdate}
                        isCellEditable={(params) => {
                            if (!isEditMode) return false;
                            const field = params.field;
                            // Match dynamic year-based fields: volume{year}JPH, volume{year}TOP, volume{year}PercentTOP, jumlahKontrakTahunan{year}, volumeKepmen{year}
                            const yearMatch = field.match(/^(?:volume(\d{4})(?:JPH|TOP|PercentTOP)|jumlahKontrakTahunan(\d{4})|volumeKepmen(\d{4}))$/);
                            if (yearMatch) {
                                const year = parseInt(yearMatch[1] || yearMatch[2] || yearMatch[3]);
                                const row = params.row;
                                if (row._akhirPerjanjianYear !== null && row._akhirPerjanjianYear !== undefined && year > row._akhirPerjanjianYear) {
                                    return false;
                                }
                            }
                            return params.colDef.editable !== false;
                        }}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 10 },
                            },
                        }}
                        rowHeight={56}
                        pageSizeOptions={[5, 10, 25, 50]}
                        columnHeaderHeight={56}
                        disableRowSelectionOnClick
                        onCellClick={(params) => {
                            if (isEditMode && params.isEditable) {
                                const state = apiRef.current?.state;
                                const isEditing = state?.editRows?.[params.id]?.[params.field];
                                if (!isEditing) {
                                    apiRef.current?.startCellEditMode({
                                        id: params.id,
                                        field: params.field,
                                    });
                                }
                            }
                        }}
                        sx={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontFamily: "inherit",
                            "& .MuiDataGrid-cell": {
                                borderBottom: "1px solid #e5e7eb",
                                borderRight: "1px solid #e5e7eb",
                                py: 1,
                                px: 1,
                                display: "flex",
                                alignItems: "center",
                            },
                            "& .MuiDataGrid-columnHeaders": {
                                backgroundColor: "#f8fafc !important",
                                borderBottom: "1px solid #e5e7eb",
                                fontSize: "14px",
                                fontWeight: 600,
                            },
                            "& .MuiDataGrid-columnHeader": {
                                backgroundColor: "#f8fafc !important",
                                borderRight:
                                    "1px solid #e5e7eb !important",
                            },
                            "& .MuiDataGrid-filler": {
                                backgroundColor: "#f8fafc !important",
                            },
                            "& .MuiDataGrid-columnHeaderTitle": {
                                fontWeight: 600,
                                fontSize: "14px",
                                whiteSpace: "normal",
                                lineHeight: "1.2",
                                textAlign: "center",
                                overflow: "visible",
                                textOverflow: "clip",
                            },
                            "& .MuiDataGrid-columnHeader--filledGroup .MuiDataGrid-columnHeaderTitleContainer":
                            {
                                borderBottom: "1px solid #e5e7eb",
                            },
                            "& .MuiDataGrid-row": {
                                "&:hover": {
                                    backgroundColor: isEditMode
                                        ? "#fefce8"
                                        : "#f8fafc",
                                },
                            },
                            "& .MuiDataGrid-cell:focus": {
                                outline: "none",
                            },
                            "& .MuiDataGrid-cell:focus-within": {
                                outline: "none",
                            },
                            "& .MuiSelect-select": {
                                "&:focus": {
                                    backgroundColor: "transparent",
                                },
                            },
                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                border: "none",
                                outline: "none",
                            },
                            "& .MuiDataGrid-editInputCell": {
                                "&:focus, &:focus-visible": {
                                    outline: "none",
                                    border: "none",
                                },
                            },
                            "& .MuiDataGrid-footerContainer": {
                                borderTop: "1px solid #e5e7eb",
                            },
                        }}
                    />
                </Box>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: "12px",
                            px: 1,
                        },
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 600, fontSize: "16px" }}>
                    Konfirmasi Hapus
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: "14px" }}>
                        Apakah Anda yakin ingin menghapus kontrak ini?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDeleteConfirmId(null)}
                        sx={{
                            textTransform: "none",
                            color: "#6b7280",
                            fontWeight: 500,
                            borderRadius: "8px",
                        }}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        sx={{
                            textTransform: "none",
                            backgroundColor: "#ef4444",
                            fontWeight: 500,
                            borderRadius: "8px",
                            "&:hover": {
                                backgroundColor: "#dc2626",
                            },
                        }}
                    >
                        Hapus
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Document Management Modal */}
            <Dialog
                open={documentModalRowId !== null}
                onClose={() => {
                    setDocumentModalRowId(null);
                    setSelectedFileName(null);
                    setSelectedFile(null);
                    setUploadingRowId(null);
                }}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: "12px",
                            px: 1,
                        },
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 600, fontSize: "16px", display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    Dokumen Kontrak
                    <IconButton
                        onClick={() => {
                            setDocumentModalRowId(null);
                            setSelectedFileName(null);
                            setSelectedFile(null);
                            setUploadingRowId(null);
                        }}
                        size="small"
                        sx={{ color: '#6b7280' }}
                    >
                        <X size={20} />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {(() => {
                        const row = rows.find(r => r.id === documentModalRowId);
                        if (!row) return null;

                        const doc = row.document;
                        const isUploadingThis = uploadMutation.isPending && uploadingRowId === documentModalRowId;

                        return (
                            <div className="flex flex-col gap-4 py-2">
                                {/* Current Document Section */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>
                                        Dokumen Saat Ini
                                    </Typography>

                                    {doc ? (
                                        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText size={18} className="text-[#115d72] shrink-0" />
                                                <Typography variant="body2" sx={{ color: "#4b5563", fontWeight: 500 }} noWrap>
                                                    {doc.original_name}
                                                </Typography>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: "#115d72", "&:hover": { color: "#0d4a5c", backgroundColor: "#eff6ff" } }}
                                                    title="Pratinjau Dokumen"
                                                    onClick={async () => {
                                                        try {
                                                            await previewContractDocument(row._contractId, doc.id);
                                                        } catch {
                                                            setSnackbar({ open: true, message: "Gagal memuat dokumen untuk pratinjau", severity: "error" });
                                                        }
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: "#115d72", "&:hover": { color: "#0d4a5c", backgroundColor: "#eff6ff" } }}
                                                    title="Unduh Dokumen"
                                                    onClick={async () => {
                                                        try {
                                                            await downloadContractDocument(row._contractId, doc.id, doc.original_name);
                                                        } catch {
                                                            setSnackbar({ open: true, message: "Gagal mengunduh dokumen", severity: "error" });
                                                        }
                                                    }}
                                                >
                                                    <Download size={16} />
                                                </IconButton>
                                                {/* We can add a delete document mutation here later if needed */}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md bg-white">
                                            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                                                Belum ada dokumen yang diunggah
                                            </Typography>
                                        </div>
                                    )}
                                </div>

                                <Divider />

                                {/* Upload Section */}
                                <div>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 2 }}>
                                        {doc ? "Unggah Dokumen Baru" : "Unggah Dokumen"}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={isUploadingThis ? <CircularProgress size={16} /> : <Upload size={16} />}
                                        onClick={() => {
                                            if (documentModalRowId) {
                                                handleUploadClick(documentModalRowId);
                                            }
                                        }}
                                        disabled={isUploadingThis}
                                        sx={{
                                            textTransform: "none",
                                            fontWeight: 500,
                                            borderRadius: "8px",
                                            color: "#115d72",
                                            borderColor: "#115d72",
                                            "&:hover": {
                                                borderColor: "#0d4a5c",
                                                backgroundColor: "#f8fafc"
                                            }
                                        }}
                                    >
                                        {isUploadingThis
                                            ? (selectedFileName ? `Mengunggah ${selectedFileName}...` : "Mengunggah...")
                                            : (selectedFileName ? selectedFileName : "Pilih File")}
                                    </Button>
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: "#6b7280", textAlign: 'center' }}>
                                        Format yang didukung: PDF. Ukuran maksimal: 10MB.
                                    </Typography>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => {
                            setDocumentModalRowId(null);
                            setSelectedFileName(null);
                            setSelectedFile(null);
                            setUploadingRowId(null);
                        }}
                        sx={{
                            textTransform: "none",
                            color: "#374151",          // text-gray-700
                            backgroundColor: "#f9fafb", // bg-gray-50
                            border: "1px solid #e5e7eb", // border + border-gray-200
                            fontWeight: 500,
                            borderRadius: "8px",
                            "&:hover": {
                                backgroundColor: "#f3f4f6"
                            } // hover:bg-gray-100
                        }}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={async () => {
                            if (selectedFile && documentModalRowId) {
                                try {
                                    await uploadMutation.mutateAsync({
                                        id: documentModalRowId,
                                        file: selectedFile
                                    });
                                    setSnackbar({ open: true, message: "Dokumen berhasil disimpan", severity: "success" });

                                    const documents = await getContractDocuments(documentModalRowId).catch(() => []);
                                    const latestDocument = documents.length > 0 ? documents[0] : null;

                                    setRows((prev) =>
                                        prev.map((r) => r.id === documentModalRowId ? { ...r, document: latestDocument } : r)
                                    );

                                    setSelectedFile(null);
                                    setSelectedFileName(null);
                                    setUploadingRowId(null);
                                } catch {
                                    setSnackbar({ open: true, message: "Gagal mengunggah PDF", severity: "error" });
                                }
                            } else {
                                setDocumentModalRowId(null);
                                setSelectedFileName(null);
                                setSelectedFile(null);
                                setUploadingRowId(null);
                            }
                        }}
                        disabled={uploadMutation.isPending}
                        sx={{
                            textTransform: "none",
                            color: "#ffffffff",
                            fontWeight: 500,
                            borderRadius: "8px",
                            backgroundColor: "#115d72",
                            "&:hover": { backgroundColor: "#0d4a5c" },
                            "&.Mui-disabled": { backgroundColor: "#0d4a5c", color: "#ffffff" }
                        }}
                    >
                        {uploadMutation.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() =>
                    setSnackbar((prev) => ({ ...prev, open: false }))
                }
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() =>
                        setSnackbar((prev) => ({ ...prev, open: false }))
                    }
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
}
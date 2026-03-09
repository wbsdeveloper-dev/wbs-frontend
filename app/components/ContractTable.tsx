"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    Upload
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
    upsertContractDailyDelivery,
    getContractAnnualTotal,
    upsertContractAnnualTotal,
    type Contract,
    type ContractVolume,
    type ContractDailyDelivery,
    type ContractAnnualTotal,
    type UpsertContractVolumeItem,
    type UpsertContractDailyDeliveryItem,
    type UpsertContractAnnualTotalItem,
    type ContractDocument,
    useUploadContractPdf,
    getContractDocuments,
    downloadContractDocument,
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
    volume2024JPH: string;
    volume2024TOP: string;
    volume2024PercentTOP: string;
    jumlahKontrakTahunan: string;
    volumeKepmen2024: string;
    volume2025JPH: string;
    volume2025TOP: string;
    volume2025PercentTOP: string;
    jumlahKontrakTahunan2025: string;
    volumeKepmen2025: string;
    volumeJumlah2023: string;
    volumeJumlah2024: string;
    volumeJumlah2025: string;
    volumeJumlah2026: string;
    volumeJumlah2027: string;
    volumeJumlah2028: string;
    volumeJumlah2029: string;
    volumeJumlah2030: string;
    unitSwitch: string;
    // Keep original contract data for API calls
    _contractId: string;
    _contractPartyId: string;
    _priceUnit: string;
    _hgbtUnit: string;
    _isNew?: boolean;
    // Hidden BBTUD values (always stored for saving)
    _bbtud_volumeJPMH: string;
    _bbtud_volume2024JPH: string;
    _bbtud_volume2024TOP: string;
    _bbtud_volume2024PercentTOP: string;
    _bbtud_jumlahKontrakTahunan: string;
    _bbtud_volumeKepmen2024: string;
    _bbtud_volume2025JPH: string;
    _bbtud_volume2025TOP: string;
    _bbtud_volume2025PercentTOP: string;
    _bbtud_jumlahKontrakTahunan2025: string;
    _bbtud_volumeKepmen2025: string;
    _bbtud_volumeJumlah2023: string;
    _bbtud_volumeJumlah2024: string;
    _bbtud_volumeJumlah2025: string;
    _bbtud_volumeJumlah2026: string;
    _bbtud_volumeJumlah2027: string;
    _bbtud_volumeJumlah2028: string;
    _bbtud_volumeJumlah2029: string;
    _bbtud_volumeJumlah2030: string;
    // Hidden MMSCFD values (from database)
    _mmscfd_volumeJPMH: string;
    _mmscfd_volume2024JPH: string;
    _mmscfd_volume2024TOP: string;
    _mmscfd_volume2024PercentTOP: string;
    _mmscfd_jumlahKontrakTahunan: string;
    _mmscfd_volumeKepmen2024: string;
    _mmscfd_volume2025JPH: string;
    _mmscfd_volume2025TOP: string;
    _mmscfd_volume2025PercentTOP: string;
    _mmscfd_jumlahKontrakTahunan2025: string;
    _mmscfd_volumeKepmen2025: string;
    _mmscfd_volumeJumlah2023: string;
    _mmscfd_volumeJumlah2024: string;
    _mmscfd_volumeJumlah2025: string;
    _mmscfd_volumeJumlah2026: string;
    _mmscfd_volumeJumlah2027: string;
    _mmscfd_volumeJumlah2028: string;
    _mmscfd_volumeJumlah2029: string;
    _mmscfd_volumeJumlah2030: string;

    // Document
    document: ContractDocument | null;
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

function findDailyDelivery(
    items: ContractDailyDelivery[],
    year: number,
): ContractDailyDelivery | undefined {
    return items.find((d) => d.year === year);
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
    dailyDeliveries: ContractDailyDelivery[] = [],
    annualTotals: ContractAnnualTotal[] = [],
    document: ContractDocument | null = null,
): ContractTableRow {
    // Volume entries by year + basis
    const jph2024 = findVolume(volumes, 2024, "JPH");
    const top2024 = findVolume(volumes, 2024, "TOP");
    const kepmen2024 = findKepmen(volumes, 2024);
    const jph2025 = findVolume(volumes, 2025, "JPH");
    const top2025 = findVolume(volumes, 2025, "TOP");
    const kepmen2025 = findKepmen(volumes, 2025);

    // BBTUD values
    const bbtud_volume2024JPH = numStr(jph2024?.value_bbtud);
    const bbtud_volume2024TOP = numStr(top2024?.value_bbtud);
    const bbtud_volume2024PercentTOP = numStr(top2024?.top_percentage);
    const bbtud_jumlahKontrakTahunan = numStr(findAnnualTotal(annualTotals, 2024)?.total_bbtu);
    const bbtud_volumeKepmen2024 = numStr(kepmen2024?.value_bbtud);
    const bbtud_volume2025JPH = numStr(jph2025?.value_bbtud);
    const bbtud_volume2025TOP = numStr(top2025?.value_bbtud);
    const bbtud_volume2025PercentTOP = numStr(top2025?.top_percentage);
    const bbtud_jumlahKontrakTahunan2025 = numStr(findAnnualTotal(annualTotals, 2025)?.total_bbtu);
    const bbtud_volumeKepmen2025 = numStr(kepmen2025?.value_bbtud);
    const bbtud_volumeJumlah2023 = numStr(findDailyDelivery(dailyDeliveries, 2023)?.value_bbtud);
    const bbtud_volumeJumlah2024 = numStr(findDailyDelivery(dailyDeliveries, 2024)?.value_bbtud);
    const bbtud_volumeJumlah2025 = numStr(findDailyDelivery(dailyDeliveries, 2025)?.value_bbtud);
    const bbtud_volumeJumlah2026 = numStr(findDailyDelivery(dailyDeliveries, 2026)?.value_bbtud);
    const bbtud_volumeJumlah2027 = numStr(findDailyDelivery(dailyDeliveries, 2027)?.value_bbtud);
    const bbtud_volumeJumlah2028 = numStr(findDailyDelivery(dailyDeliveries, 2028)?.value_bbtud);
    const bbtud_volumeJumlah2029 = numStr(findDailyDelivery(dailyDeliveries, 2029)?.value_bbtud);
    const bbtud_volumeJumlah2030 = numStr(findDailyDelivery(dailyDeliveries, 2030)?.value_bbtud);

    // MMSCFD values
    const mmscfd_volume2024JPH = numStr(jph2024?.value_mmscfd);
    const mmscfd_volume2024TOP = numStr(top2024?.value_mmscfd);
    const mmscfd_volume2024PercentTOP = numStr(top2024?.top_percentage_mmscfd);
    const mmscfd_jumlahKontrakTahunan = numStr(findAnnualTotal(annualTotals, 2024)?.total_mmscfd);
    const mmscfd_volumeKepmen2024 = numStr(kepmen2024?.value_mmscfd);
    const mmscfd_volume2025JPH = numStr(jph2025?.value_mmscfd);
    const mmscfd_volume2025TOP = numStr(top2025?.value_mmscfd);
    const mmscfd_volume2025PercentTOP = numStr(top2025?.top_percentage_mmscfd);
    const mmscfd_jumlahKontrakTahunan2025 = numStr(findAnnualTotal(annualTotals, 2025)?.total_mmscfd);
    const mmscfd_volumeKepmen2025 = numStr(kepmen2025?.value_mmscfd);
    const mmscfd_volumeJumlah2023 = numStr(findDailyDelivery(dailyDeliveries, 2023)?.value_mmscfd);
    const mmscfd_volumeJumlah2024 = numStr(findDailyDelivery(dailyDeliveries, 2024)?.value_mmscfd);
    const mmscfd_volumeJumlah2025 = numStr(findDailyDelivery(dailyDeliveries, 2025)?.value_mmscfd);
    const mmscfd_volumeJumlah2026 = numStr(findDailyDelivery(dailyDeliveries, 2026)?.value_mmscfd);
    const mmscfd_volumeJumlah2027 = numStr(findDailyDelivery(dailyDeliveries, 2027)?.value_mmscfd);
    const mmscfd_volumeJumlah2028 = numStr(findDailyDelivery(dailyDeliveries, 2028)?.value_mmscfd);
    const mmscfd_volumeJumlah2029 = numStr(findDailyDelivery(dailyDeliveries, 2029)?.value_mmscfd);
    const mmscfd_volumeJumlah2030 = numStr(findDailyDelivery(dailyDeliveries, 2030)?.value_mmscfd);

    return {
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
        // Display values default to BBTUD
        volume2024JPH: bbtud_volume2024JPH,
        volume2024TOP: bbtud_volume2024TOP,
        volume2024PercentTOP: bbtud_volume2024PercentTOP,
        jumlahKontrakTahunan: bbtud_jumlahKontrakTahunan,
        volumeKepmen2024: bbtud_volumeKepmen2024,
        volume2025JPH: bbtud_volume2025JPH,
        volume2025TOP: bbtud_volume2025TOP,
        volume2025PercentTOP: bbtud_volume2025PercentTOP,
        jumlahKontrakTahunan2025: bbtud_jumlahKontrakTahunan2025,
        volumeKepmen2025: bbtud_volumeKepmen2025,
        volumeJumlah2023: bbtud_volumeJumlah2023,
        volumeJumlah2024: bbtud_volumeJumlah2024,
        volumeJumlah2025: bbtud_volumeJumlah2025,
        volumeJumlah2026: bbtud_volumeJumlah2026,
        volumeJumlah2027: bbtud_volumeJumlah2027,
        volumeJumlah2028: bbtud_volumeJumlah2028,
        volumeJumlah2029: bbtud_volumeJumlah2029,
        volumeJumlah2030: bbtud_volumeJumlah2030,
        unitSwitch: "BBTUD",
        _contractId: contract.id,
        _contractPartyId: contract.contract_party_id,
        _priceUnit: contract.price_unit || "USD_PER_MMBTU",
        _hgbtUnit: contract.hgbt_unit || "",
        // Hidden BBTUD values
        _bbtud_volumeJPMH: contract.volume_jpmh_bbtud != null ? String(contract.volume_jpmh_bbtud) : "",
        _bbtud_volume2024JPH: bbtud_volume2024JPH,
        _bbtud_volume2024TOP: bbtud_volume2024TOP,
        _bbtud_volume2024PercentTOP: bbtud_volume2024PercentTOP,
        _bbtud_jumlahKontrakTahunan: bbtud_jumlahKontrakTahunan,
        _bbtud_volumeKepmen2024: bbtud_volumeKepmen2024,
        _bbtud_volume2025JPH: bbtud_volume2025JPH,
        _bbtud_volume2025TOP: bbtud_volume2025TOP,
        _bbtud_volume2025PercentTOP: bbtud_volume2025PercentTOP,
        _bbtud_jumlahKontrakTahunan2025: bbtud_jumlahKontrakTahunan2025,
        _bbtud_volumeKepmen2025: bbtud_volumeKepmen2025,
        _bbtud_volumeJumlah2023: bbtud_volumeJumlah2023,
        _bbtud_volumeJumlah2024: bbtud_volumeJumlah2024,
        _bbtud_volumeJumlah2025: bbtud_volumeJumlah2025,
        _bbtud_volumeJumlah2026: bbtud_volumeJumlah2026,
        _bbtud_volumeJumlah2027: bbtud_volumeJumlah2027,
        _bbtud_volumeJumlah2028: bbtud_volumeJumlah2028,
        _bbtud_volumeJumlah2029: bbtud_volumeJumlah2029,
        _bbtud_volumeJumlah2030: bbtud_volumeJumlah2030,
        // Hidden MMSCFD values
        _mmscfd_volumeJPMH: contract.volume_jpmh_mmscfd != null ? String(contract.volume_jpmh_mmscfd) : "",
        _mmscfd_volume2024JPH: mmscfd_volume2024JPH,
        _mmscfd_volume2024TOP: mmscfd_volume2024TOP,
        _mmscfd_volume2024PercentTOP: mmscfd_volume2024PercentTOP,
        _mmscfd_jumlahKontrakTahunan: mmscfd_jumlahKontrakTahunan,
        _mmscfd_volumeKepmen2024: mmscfd_volumeKepmen2024,
        _mmscfd_volume2025JPH: mmscfd_volume2025JPH,
        _mmscfd_volume2025TOP: mmscfd_volume2025TOP,
        _mmscfd_volume2025PercentTOP: mmscfd_volume2025PercentTOP,
        _mmscfd_jumlahKontrakTahunan2025: mmscfd_jumlahKontrakTahunan2025,
        _mmscfd_volumeKepmen2025: mmscfd_volumeKepmen2025,
        _mmscfd_volumeJumlah2023: mmscfd_volumeJumlah2023,
        _mmscfd_volumeJumlah2024: mmscfd_volumeJumlah2024,
        _mmscfd_volumeJumlah2025: mmscfd_volumeJumlah2025,
        _mmscfd_volumeJumlah2026: mmscfd_volumeJumlah2026,
        _mmscfd_volumeJumlah2027: mmscfd_volumeJumlah2027,
        _mmscfd_volumeJumlah2028: mmscfd_volumeJumlah2028,
        _mmscfd_volumeJumlah2029: mmscfd_volumeJumlah2029,
        _mmscfd_volumeJumlah2030: mmscfd_volumeJumlah2030,

        document,
    };
}

function createEmptyRow(rowNumber: number): ContractTableRow {
    const newId = `new-${Date.now()}`;
    return {
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
        volume2024JPH: "",
        volume2024TOP: "",
        volume2024PercentTOP: "",
        jumlahKontrakTahunan: "",
        volumeKepmen2024: "",
        volume2025JPH: "",
        volume2025TOP: "",
        volume2025PercentTOP: "",
        jumlahKontrakTahunan2025: "",
        volumeKepmen2025: "",
        volumeJumlah2023: "",
        volumeJumlah2024: "",
        volumeJumlah2025: "",
        volumeJumlah2026: "",
        volumeJumlah2027: "",
        volumeJumlah2028: "",
        volumeJumlah2029: "",
        volumeJumlah2030: "",
        unitSwitch: "BBTUD",
        _contractId: newId,
        _contractPartyId: "",
        _priceUnit: "USD_PER_MMBTU",
        _hgbtUnit: "",
        _isNew: true,
        // Hidden BBTUD values
        _bbtud_volumeJPMH: "",
        _bbtud_volume2024JPH: "",
        _bbtud_volume2024TOP: "",
        _bbtud_volume2024PercentTOP: "",
        _bbtud_jumlahKontrakTahunan: "",
        _bbtud_volumeKepmen2024: "",
        _bbtud_volume2025JPH: "",
        _bbtud_volume2025TOP: "",
        _bbtud_volume2025PercentTOP: "",
        _bbtud_jumlahKontrakTahunan2025: "",
        _bbtud_volumeKepmen2025: "",
        _bbtud_volumeJumlah2023: "",
        _bbtud_volumeJumlah2024: "",
        _bbtud_volumeJumlah2025: "",
        _bbtud_volumeJumlah2026: "",
        _bbtud_volumeJumlah2027: "",
        _bbtud_volumeJumlah2028: "",
        _bbtud_volumeJumlah2029: "",
        _bbtud_volumeJumlah2030: "",
        // Hidden MMSCFD values
        _mmscfd_volumeJPMH: "",
        _mmscfd_volume2024JPH: "",
        _mmscfd_volume2024TOP: "",
        _mmscfd_volume2024PercentTOP: "",
        _mmscfd_jumlahKontrakTahunan: "",
        _mmscfd_volumeKepmen2024: "",
        _mmscfd_volume2025JPH: "",
        _mmscfd_volume2025TOP: "",
        _mmscfd_volume2025PercentTOP: "",
        _mmscfd_jumlahKontrakTahunan2025: "",
        _mmscfd_volumeKepmen2025: "",
        _mmscfd_volumeJumlah2023: "",
        _mmscfd_volumeJumlah2024: "",
        _mmscfd_volumeJumlah2025: "",
        _mmscfd_volumeJumlah2026: "",
        _mmscfd_volumeJumlah2027: "",
        _mmscfd_volumeJumlah2028: "",
        _mmscfd_volumeJumlah2029: "",
        _mmscfd_volumeJumlah2030: "",

        document: null,
    };
}

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

// Cell renderer — edit mode shows bordered input-like box, view mode shows plain text
const makeRenderCell =
    (isEditMode: boolean) => (params: GridRenderCellParams) => {
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

// ---------------------------------------------------------------------------
// Build columns dynamically based on edit mode
// ---------------------------------------------------------------------------

function buildColumns(
    isEditMode: boolean,
    supplierNames: string[],
    powerplantNames: string[],
): GridColDef[] {
    const renderCell = makeRenderCell(isEditMode);

    return [
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
        {
            field: "volume2024JPH",
            headerName: "JPH",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volume2024TOP",
            headerName: "TOP",
            width: 120,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volume2024PercentTOP",
            headerName: "% TOP",
            width: 120,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "jumlahKontrakTahunan",
            headerName: "JUMLAH KONTRAK TAHUNAN 2024",
            width: 240,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeKepmen2024",
            headerName: "Volume Kepmen 2024",
            width: 120,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volume2025JPH",
            headerName: "JPH",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volume2025TOP",
            headerName: "TOP",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volume2025PercentTOP",
            headerName: "% TOP",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "jumlahKontrakTahunan2025",
            headerName: "JUMLAH KONTRAK TAHUNAN 2025",
            width: 240,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeKepmen2025",
            headerName: "Volume Kepmen 2025",
            width: 120,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeJumlah2023",
            headerName: "2023",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeJumlah2024",
            headerName: "2024",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeJumlah2025",
            headerName: "2025",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeJumlah2026",
            headerName: "2026",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeJumlah2027",
            headerName: "2027",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeJumlah2028",
            headerName: "2028",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeJumlah2029",
            headerName: "2029",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
        {
            field: "volumeJumlah2030",
            headerName: "2030",
            width: 100,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
            renderCell,
        },
    ];
}

// ---------------------------------------------------------------------------
// Column grouping
// ---------------------------------------------------------------------------

const columnGroupingModel: GridColumnGroupingModel = [
    {
        groupId: "volume2024",
        headerName: "Volume 2024",
        headerAlign: "center",
        children: [{ field: "volume2024JPH" }, { field: "volume2024TOP" }, { field: "volume2024PercentTOP" }],
    },
    {
        groupId: "volume2025",
        headerName: "Volume 2025",
        headerAlign: "center",
        children: [{ field: "volume2025JPH" }, { field: "volume2025TOP" }, { field: "volume2025PercentTOP" }],
    },
    {
        groupId: "volumeJumlahPH",
        headerName: "Volume Jumlah Penyerahan Harian",
        headerAlign: "center",
        children: [
            { field: "volumeJumlah2023" },
            { field: "volumeJumlah2024" },
            { field: "volumeJumlah2025" },
            { field: "volumeJumlah2026" },
            { field: "volumeJumlah2027" },
            { field: "volumeJumlah2028" },
            { field: "volumeJumlah2029" },
            { field: "volumeJumlah2030" },
        ],
    },
];

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

    const supplierSites = supplierSitesData || [];
    const powerplantSites = powerplantSitesData || [];
    const supplierNames = supplierSites.map((s) => s.name);
    const powerplantNames = powerplantSites.map((s) => s.name);

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
                        );
                    }),
                );
                if (!cancelled) setRows(enriched);
            } catch (err) {
                console.error("Failed to load sub-resource data:", err);
                // Fallback: show rows without sub-resource data
                if (!cancelled) setRows(contracts.map((c, i) => mapContractToRow(c, i, [], [], [], null)));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [contracts]);

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

    const handleAddRow = useCallback(() => {
        setRows((prev) => [...prev, createEmptyRow(prev.length + 1)]);
        setIsEditMode(true);
    }, []);

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
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: `Gagal menghapus: ${err?.message || "Terjadi kesalahan"}`,
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
                "volume2024JPH", "volume2024TOP", "volume2024PercentTOP",
                "jumlahKontrakTahunan", "volumeKepmen2024",
                "volume2025JPH", "volume2025TOP", "volume2025PercentTOP",
                "jumlahKontrakTahunan2025", "volumeKepmen2025",
                "volumeJumlah2023", "volumeJumlah2024", "volumeJumlah2025",
                "volumeJumlah2026", "volumeJumlah2027", "volumeJumlah2028",
                "volumeJumlah2029", "volumeJumlah2030",
            ] as const;
            for (const field of volumeFieldNames) {
                (row as any)[`${currentPrefix}${field}`] = row[field];
            }

            // Helper to parse hidden field value
            const bVal = (field: string): number | undefined => {
                const v = (row as any)[`_bbtud_${field}`];
                return v ? parseFloat(v) : undefined;
            };
            const mVal = (field: string): number | undefined => {
                const v = (row as any)[`_mmscfd_${field}`];
                return v ? parseFloat(v) : undefined;
            };

            // --- Contract Volumes (JPH, TOP, Kepmen for 2024 & 2025) ---
            const volumeItems: UpsertContractVolumeItem[] = [];

            // 2024 JPH
            if (bVal("volume2024JPH") !== undefined || mVal("volume2024JPH") !== undefined) {
                volumeItems.push({
                    year: 2024,
                    basis: "JPH",
                    value_bbtud: bVal("volume2024JPH") ?? 0,
                    value_mmscfd: mVal("volume2024JPH"),
                });
            }
            // 2024 TOP (+ %TOP as top_percentage)
            if (bVal("volume2024TOP") !== undefined || bVal("volume2024PercentTOP") !== undefined ||
                mVal("volume2024TOP") !== undefined || mVal("volume2024PercentTOP") !== undefined) {
                volumeItems.push({
                    year: 2024,
                    basis: "TOP",
                    value_bbtud: bVal("volume2024TOP") ?? 0,
                    value_mmscfd: mVal("volume2024TOP"),
                    top_percentage: bVal("volume2024PercentTOP"),
                    top_percentage_mmscfd: mVal("volume2024PercentTOP"),
                });
            }
            // 2024 Kepmen
            if (bVal("volumeKepmen2024") !== undefined || mVal("volumeKepmen2024") !== undefined) {
                volumeItems.push({
                    year: 2024,
                    basis: "JPH",
                    value_bbtud: bVal("volumeKepmen2024") ?? 0,
                    value_mmscfd: mVal("volumeKepmen2024"),
                    is_kepmen: true,
                });
            }
            // 2025 JPH
            if (bVal("volume2025JPH") !== undefined || mVal("volume2025JPH") !== undefined) {
                volumeItems.push({
                    year: 2025,
                    basis: "JPH",
                    value_bbtud: bVal("volume2025JPH") ?? 0,
                    value_mmscfd: mVal("volume2025JPH"),
                });
            }
            // 2025 TOP (+ %TOP as top_percentage)
            if (bVal("volume2025TOP") !== undefined || bVal("volume2025PercentTOP") !== undefined ||
                mVal("volume2025TOP") !== undefined || mVal("volume2025PercentTOP") !== undefined) {
                volumeItems.push({
                    year: 2025,
                    basis: "TOP",
                    value_bbtud: bVal("volume2025TOP") ?? 0,
                    value_mmscfd: mVal("volume2025TOP"),
                    top_percentage: bVal("volume2025PercentTOP"),
                    top_percentage_mmscfd: mVal("volume2025PercentTOP"),
                });
            }
            // 2025 Kepmen
            if (bVal("volumeKepmen2025") !== undefined || mVal("volumeKepmen2025") !== undefined) {
                volumeItems.push({
                    year: 2025,
                    basis: "JPH",
                    value_bbtud: bVal("volumeKepmen2025") ?? 0,
                    value_mmscfd: mVal("volumeKepmen2025"),
                    is_kepmen: true,
                });
            }

            if (volumeItems.length > 0) {
                await upsertContractVolumes(contractId, volumeItems);
            }

            // --- Contract Daily Delivery (2023–2030) ---
            const dailyItems: UpsertContractDailyDeliveryItem[] = [];
            const dailyYears = [
                { year: 2023, field: "volumeJumlah2023" },
                { year: 2024, field: "volumeJumlah2024" },
                { year: 2025, field: "volumeJumlah2025" },
                { year: 2026, field: "volumeJumlah2026" },
                { year: 2027, field: "volumeJumlah2027" },
                { year: 2028, field: "volumeJumlah2028" },
                { year: 2029, field: "volumeJumlah2029" },
                { year: 2030, field: "volumeJumlah2030" },
            ];
            for (const { year, field } of dailyYears) {
                const bbtudVal = bVal(field);
                const mmscfdVal = mVal(field);
                if (bbtudVal !== undefined || mmscfdVal !== undefined) {
                    dailyItems.push({
                        year,
                        value_bbtud: bbtudVal ?? 0,
                        value_mmscfd: mmscfdVal,
                    });
                }
            }
            if (dailyItems.length > 0) {
                await upsertContractDailyDelivery(contractId, dailyItems);
            }

            // --- Contract Annual Total (2024 & 2025) ---
            const annualItems: UpsertContractAnnualTotalItem[] = [];
            const bbtud2024Annual = bVal("jumlahKontrakTahunan");
            const mmscfd2024Annual = mVal("jumlahKontrakTahunan");
            if (bbtud2024Annual !== undefined || mmscfd2024Annual !== undefined) {
                annualItems.push({
                    year: 2024,
                    total_bbtu: bbtud2024Annual ?? 0,
                    total_mmscfd: mmscfd2024Annual,
                });
            }
            const bbtud2025Annual = bVal("jumlahKontrakTahunan2025");
            const mmscfd2025Annual = mVal("jumlahKontrakTahunan2025");
            if (bbtud2025Annual !== undefined || mmscfd2025Annual !== undefined) {
                annualItems.push({
                    year: 2025,
                    total_bbtu: bbtud2025Annual ?? 0,
                    total_mmscfd: mmscfd2025Annual,
                });
            }
            if (annualItems.length > 0) {
                await upsertContractAnnualTotal(contractId, annualItems);
            }
        },
        [],
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

            let hasNewRows = false;
            for (const row of currentRows) {
                if (row._isNew) {
                    hasNewRows = true;

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
                    (row as any)[`${newJpmhPrefix}volumeJPMH`] = row.volumeJPMH;

                    if (row._bbtud_volumeJPMH)
                        createPayload.volume_jpmh_bbtud = parseFloat(row._bbtud_volumeJPMH);
                    if (row._mmscfd_volumeJPMH)
                        createPayload.volume_jpmh_mmscfd = parseFloat(row._mmscfd_volumeJPMH);
                    if (row.hargaPJBG)
                        createPayload.price_value = parseFloat(row.hargaPJBG);
                    if (row.hgbt)
                        createPayload.hgbt_value = parseFloat(row.hgbt);

                    const createdContract = await createMutation.mutateAsync(createPayload as any);

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
                            payload: payload as any,
                        });
                    }

                    // Always save sub-resource data for existing rows
                    await saveSubResources(row.id, row);
                }
            }

            setPendingDeletes([]);
            setIsEditMode(false);
        } catch (err: any) {
            console.error("Save error:", err);
            setSnackbar({
                open: true,
                message: `Gagal menyimpan: ${err?.message || "Terjadi kesalahan"}`,
                severity: "error",
            });
        } finally {
            setIsSaving(false);
        }
    }, [contracts, createMutation, updateMutation, deleteMutation, apiRef, isSaving, pendingDeletes, saveSubResources]);

    const handleCancel = useCallback(() => {
        if (contracts) {
            setRows(contracts.map((c, i) => mapContractToRow(c, i, [], [], [], null)));
        }
        setPendingDeletes([]);
        setIsEditMode(false);
    }, [contracts]);

    const handleUnitToggle = useCallback(
        (id: string, newValue: string | null) => {
            if (newValue !== null) {
                setRows((prev) =>
                    prev.map((row) => {
                        if (row.id !== id || row.unitSwitch === newValue) return row;

                        const updated = { ...row, unitSwitch: newValue };

                        // Save current visible values back to the old unit's hidden fields
                        const oldPrefix = row.unitSwitch === "BBTUD" ? "_bbtud_" : "_mmscfd_";
                        const volumeFields = [
                            "volumeJPMH",
                            "volume2024JPH", "volume2024TOP", "volume2024PercentTOP",
                            "jumlahKontrakTahunan", "volumeKepmen2024",
                            "volume2025JPH", "volume2025TOP", "volume2025PercentTOP",
                            "jumlahKontrakTahunan2025", "volumeKepmen2025",
                            "volumeJumlah2023", "volumeJumlah2024", "volumeJumlah2025",
                            "volumeJumlah2026", "volumeJumlah2027", "volumeJumlah2028",
                            "volumeJumlah2029", "volumeJumlah2030",
                        ] as const;

                        for (const field of volumeFields) {
                            (updated as any)[`${oldPrefix}${field}`] = row[field];
                        }

                        // Copy new unit's hidden values into visible fields
                        const newPrefix = newValue === "BBTUD" ? "_bbtud_" : "_mmscfd_";
                        for (const field of volumeFields) {
                            (updated as any)[field] = (row as any)[`${newPrefix}${field}`] || "";
                        }

                        return updated;
                    }),
                );
            }
        },
        [],
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

    const baseColumns = buildColumns(isEditMode, supplierNames, powerplantNames);

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
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#115d72] bg-[#115d72]/5 border border-[#115d72]/20 rounded-lg hover:bg-[#115d72]/10 transition-all duration-200">
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
                        columnGroupingModel={columnGroupingModel}
                        processRowUpdate={processRowUpdate}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 10 },
                            },
                        }}
                        rowHeight={56}
                        pageSizeOptions={[5, 10, 25, 50]}
                        columnHeaderHeight={56}
                        disableRowSelectionOnClick
                        onCellClick={(params, event) => {
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
                                                    title="Unduh Dokumen"
                                                    onClick={async () => {
                                                        try {
                                                            await downloadContractDocument(row._contractId, doc.id, doc.original_name);
                                                        } catch (error) {
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
                                        {doc ? "Unggah Dokumen Baru (Akan menggantikan yang lama)" : "Unggah Dokumen"}
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
                            color: "#6b7280",
                            fontWeight: 500,
                            borderRadius: "8px",
                            "&:hover": { backgroundColor: "#f3f4f6" }
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
                                } catch (error) {
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
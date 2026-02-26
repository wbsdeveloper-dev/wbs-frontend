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
} from "@mui/material";
import { Pencil, Trash2, Plus, FileText, Save, X, RefreshCw } from "lucide-react";
import {
    useContracts,
    useCreateContract,
    useUpdateContract,
    useDeleteContract,
    createContractParty,
    type Contract,
} from "@/hooks/service/contract-api";

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
    volume2025JPH: string;
    volume2025TOP: string;
    volume2025PercentTOP: string;
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
    _hbgtUnit: string;
    _isNew?: boolean;
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

function mapContractToRow(contract: Contract, index: number): ContractTableRow {
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
        hgbt: contract.hbgt_value != null ? String(contract.hbgt_value) : "",
        volumeJPMH: contract.volume_jpmh_bbtud != null
            ? String(contract.volume_jpmh_bbtud)
            : "",
        volume2024JPH: "",
        volume2024TOP: "",
        volume2024PercentTOP: "",
        jumlahKontrakTahunan: "",
        volume2025JPH: "",
        volume2025TOP: "",
        volume2025PercentTOP: "",
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
        _contractId: contract.id,
        _contractPartyId: contract.contract_party_id,
        _priceUnit: contract.price_unit || "USD_PER_MMBTU",
        _hbgtUnit: contract.hbgt_unit || "",
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
        volume2025JPH: "",
        volume2025TOP: "",
        volume2025PercentTOP: "",
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
        _hbgtUnit: "",
        _isNew: true,
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

function buildColumns(isEditMode: boolean): GridColDef[] {
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
            renderCell,
        },
        {
            field: "pembangkit",
            headerName: "Pembangkit",
            width: 180,
            headerAlign: "center",
            align: "center",
            editable: isEditMode,
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
    const [rows, setRows] = useState<ContractTableRow[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error";
    }>({ open: false, message: "", severity: "success" });

    // ---- API hooks ----
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

    // ---- Sync API data → local rows ----
    useEffect(() => {
        if (contracts) {
            setRows(contracts.map(mapContractToRow));
        }
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
                        const party = await createContractParty({
                            region: row.region || undefined,
                            owner_kit: row.pemilikKIT || undefined,
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

                    // Numeric fields
                    if (row.volumeJPMH)
                        createPayload.volume_jpmh_bbtud = parseFloat(row.volumeJPMH);
                    if (row.hargaPJBG)
                        createPayload.price_value = parseFloat(row.hargaPJBG);
                    if (row.hgbt)
                        createPayload.hbgt_value = parseFloat(row.hgbt);

                    await createMutation.mutateAsync(createPayload as any);
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

                    const newHbgt = row.hgbt ? parseFloat(row.hgbt) : null;
                    if (newHbgt !== original.hbgt_value) payload.hbgt_value = newHbgt;

                    const newVol = row.volumeJPMH
                        ? parseFloat(row.volumeJPMH)
                        : null;
                    if (newVol !== original.volume_jpmh_bbtud)
                        payload.volume_jpmh_bbtud = newVol;

                    if (Object.keys(payload).length > 0) {
                        await updateMutation.mutateAsync({
                            id: row.id,
                            payload: payload as any,
                        });
                    }
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
    }, [contracts, createMutation, updateMutation, deleteMutation, apiRef, isSaving, pendingDeletes]);

    const handleCancel = useCallback(() => {
        if (contracts) {
            setRows(contracts.map(mapContractToRow));
        }
        setPendingDeletes([]);
        setIsEditMode(false);
    }, [contracts]);

    const handleUnitToggle = useCallback(
        (id: string, newValue: string | null) => {
            if (newValue !== null) {
                setRows((prev) =>
                    prev.map((row) =>
                        row.id === id ? { ...row, unitSwitch: newValue } : row,
                    ),
                );
            }
        },
        [],
    );

    // ---- Column definitions ----

    const baseColumns = buildColumns(isEditMode);

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
            renderCell: (params) => (
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
                            color: "#f59e0b",
                            "&:hover": { color: "#d97706" },
                        }}
                        onClick={() => console.log("View", params.row.id)}
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
                    >
                        <Trash2 size={16} />
                    </IconButton>
                </Box>
            ),
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
                                apiRef.current?.startCellEditMode({
                                    id: params.id,
                                    field: params.field,
                                });
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
                                outline: isEditMode
                                    ? "none"
                                    : "none",
                            },
                            "& .MuiDataGrid-cell:focus-within": {
                                outline: isEditMode
                                    ? "none"
                                    : "none",
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
                PaperProps={{
                    sx: {
                        borderRadius: "12px",
                        px: 1,
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
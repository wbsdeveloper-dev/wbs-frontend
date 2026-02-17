"use client";

import { useState } from "react";
import {
    DataGrid,
    GridColDef,
    GridColumnGroupingModel,
    GridRenderCellParams,
} from "@mui/x-data-grid";
import { Box, IconButton, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Pencil, Trash2, Plus, FileText, Eye, Save, X } from "lucide-react";

// Sample data based on the design
const initialRows = [
    {
        id: 1,
        no: 1,
        region: "Jawa Barat",
        pemilik: "PHE ONWJ",
        perusahaanLT: "Muara Karang",
        pemilikMT: "PJBS",
        jenisDokumen: "04814-K9/042/0/2010",
        noKontrakAwal: "K.999",
        jenisDokumenTambahan: "5958/HK.043/D1V4 MR/01/2016",
        noKontrakTambahan: "H/06/2003",
        awalPerjanjian: "0/01/2024",
        tanggalEBBT: "1/82/2033",
        tanggalPerjanjian: "7.00",
        volume2024JHR: "6.30",
        volume2024TOP: "2,805.00",
        jumlahKontrakJHR: "",
        jumlahKontrakTOP: "8.00",
        volume2025JHR: "80%",
        volume2025TOP: "7.00",
        volumeExposure2025: "18.00",
        volumeExposure2026: "7.00",
        volumeJumlah2027: "7.00",
        volumeJumlah2028: "7.00",
        volumeJumlah2029: "7.00",
        volumeJumlah2030: "7.00",
        volumeHargaJGB8: "30.00",
        hbot: "6,068/MMETU",
        unitSwitch: "BBTUD",
    },
    {
        id: 2,
        no: 2,
        region: "Jawa Barat",
        pemilik: "PHE ONWJ",
        perusahaanLT: "Muara Karang",
        pemilikMT: "PJBS",
        jenisDokumen: "04814-K9/042/0/2010",
        noKontrakAwal: "K.999",
        jenisDokumenTambahan: "5958/HK.043/D1V4 MR/01/2016",
        noKontrakTambahan: "H/06/2003",
        awalPerjanjian: "0/01/2024",
        tanggalEBBT: "1/82/2033",
        tanggalPerjanjian: "7.00",
        volume2024JHR: "6.30",
        volume2024TOP: "2,805.00",
        jumlahKontrakJHR: "8.02",
        jumlahKontrakTOP: "8.00",
        volume2025JHR: "80%",
        volume2025TOP: "7.00",
        volumeExposure2025: "18.00",
        volumeExposure2026: "7.00",
        volumeJumlah2027: "7.00",
        volumeJumlah2028: "7.00",
        volumeJumlah2029: "7.00",
        volumeJumlah2030: "7.00",
        volumeHargaJGB8: "30.00",
        hbot: "6,068/MMETU",
        unitSwitch: "BBTUD",
    },
    {
        id: 3,
        no: 3,
        region: "",
        pemilik: "",
        perusahaanLT: "",
        pemilikMT: "",
        jenisDokumen: "",
        noKontrakAwal: "",
        jenisDokumenTambahan: "",
        noKontrakTambahan: "",
        awalPerjanjian: "",
        tanggalEBBT: "",
        tanggalPerjanjian: "",
        volume2024JHR: "",
        volume2024TOP: "",
        jumlahKontrakJHR: "",
        jumlahKontrakTOP: "",
        volume2025JHR: "",
        volume2025TOP: "",
        volumeExposure2025: "",
        volumeExposure2026: "",
        volumeJumlah2027: "",
        volumeJumlah2028: "",
        volumeJumlah2029: "",
        volumeJumlah2030: "",
        volumeHargaJGB8: "",
        hgbt: "",
        unitSwitch: "BBTUD",
    },
];

// Helper to render cells with input-like styling
const renderInputCell = (params: any) => (
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
            fontSize: "0.875rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
        }}
    >
        {params.value}
    </Box>
);

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
            <span className="text-sm text-gray-700 truncate">
                {params.value || "—"}
            </span>
        );
    };

// Build columns dynamically based on edit mode
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

const columnGroupingModel: GridColumnGroupingModel = [
    {
        groupId: "volume2024",
        headerName: "Volume 2024",
        headerAlign: "center",
        children: [{ field: "volume2024JPH" }, { field: "volume2024TOP" }],
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

export default function ContractTable() {
    const [rows, setRows] = useState(initialRows);
    const [isEditMode, setIsEditMode] = useState(false);

    const processRowUpdate = (newRow: any) => {
        setRows(rows.map((row) => (row.id === newRow.id ? newRow : row)));
        return newRow;
    };

    const handleAddRow = () => {
        const columns = buildColumns(true);
        const newId = rows.length > 0 ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
        const newRow: any = { id: newId, no: rows.length + 1, unitSwitch: "BBTUD" };
        columns.forEach((col) => {
            if (col.field !== "no" && col.field !== "action") {
                newRow[col.field] = "";
            }
        });
        setRows([...rows, newRow]);
        // Auto-enter edit mode when adding a row
        setIsEditMode(true);
    };

    const handleDeleteRow = (id: number) => {
        const updatedRows = rows
            .filter((row) => row.id !== id)
            .map((row, index) => ({ ...row, no: index + 1 }));
        setRows(updatedRows);
    };

    const handleUnitToggle = (id: number, newValue: string | null) => {
        if (newValue !== null) {
            setRows(rows.map((row) =>
                row.id === id ? { ...row, unitSwitch: newValue } : row
            ));
        }
    };

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
                onChange={(_, newValue) => handleUnitToggle(params.row.id, newValue)}
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
                        sx={{ color: "#f59e0b", "&:hover": { color: "#d97706" } }}
                        onClick={() => console.log("Edit", params.row.id)}
                    >
                        <FileText size={16} />
                    </IconButton>
                    <IconButton
                        size="small"
                        sx={{ color: "#ef4444", "&:hover": { color: "#dc2626" } }}
                        onClick={() => handleDeleteRow(params.row.id)}
                    >
                        <Trash2 size={16} />
                    </IconButton>
                </Box>
            ),
        },
    ];

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
                                onClick={() => setIsEditMode(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200"
                            >
                                <X size={16} />
                                Batal
                            </button>
                            <button
                                onClick={() => setIsEditMode(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-200 hover:shadow-md active:scale-95"
                            >
                                <Save size={16} />
                                Simpan
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
                        Mode Edit — Klik sel untuk mengedit, lalu tekan Simpan untuk
                        menyimpan perubahan
                    </span>
                </div>
            )}

            {/* Data Table */}
            <div className="w-full">
                <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                    <DataGrid
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
                                borderRight: "1px solid #e5e7eb !important",
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
                                    backgroundColor: isEditMode ? "#fefce8" : "#f8fafc",
                                },
                            },
                            "& .MuiDataGrid-cell:focus": {
                                outline: isEditMode ? "2px solid #14a2bb" : "none",
                            },
                            "& .MuiDataGrid-cell:focus-within": {
                                outline: isEditMode ? "2px solid #14a2bb" : "none",
                            },
                            "& .MuiDataGrid-footerContainer": {
                                borderTop: "1px solid #e5e7eb",
                            },
                        }}
                    />
                </Box>
            </div>
        </div>
    );
}
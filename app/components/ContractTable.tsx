"use client";

import { useState } from "react";
import { DataGrid, GridColDef, GridColumnGroupingModel } from "@mui/x-data-grid";
import { Box, Button, IconButton, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { Pencil, Trash2, Plus, FileText } from "lucide-react";

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
        hbgt: "",
        unitSwitch: "BBTUD",
    },
];

// Helper to render cells with input-like styling
const renderInputCell = (params: any) => (
    <Box
        sx={{
            width: "calc(100% - 8px)",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            backgroundColor: "#fff",
            px: 1,
            mx: "auto",
            fontSize: "0.75rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
        }}
    >
        {params.value}
    </Box>
);

const baseColumns: GridColDef[] = [
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
        width: 130,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "pemasok",
        headerName: "Pemasok",
        width: 130,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "pembangkit",
        headerName: "Pembangkit",
        width: 150,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "pemilikKIT",
        headerName: "Pemilik KIT",
        width: 120,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "jenisDokumen",
        headerName: "Jenis Dokumen",
        width: 170,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "noKontrakAwal",
        headerName: "No Kontrak Awal",
        width: 150,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "jenisDokumenTambahan",
        headerName: "Jenis Dokumen",
        width: 180,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "noKontrakTerbaru",
        headerName: "No Kontrak Terbaru",
        width: 160,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "awalPerjanjian",
        headerName: "Awal Perjanjian",
        width: 140,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "tanggalEfektif",
        headerName: "Tanggal Efektif",
        width: 140,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "akhirPerjanjian",
        headerName: "Akhir Perjanjian",
        width: 140,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "hargaPJBG",
        headerName: "Harga PJBG",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "hbgt",
        headerName: "HBGT",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volumeJPMH",
        headerName: "Volume JPMH",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volume2024JPH",
        headerName: "JPH",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volume2024TOP",
        headerName: "TOP",
        width: 120,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "jumlahKontrakTahunan",
        headerName: "JUMLAH KONTRAK TAHUNAN 2024",
        width: 240,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volume2025JPH",
        headerName: "JHR",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volume2025TOP",
        headerName: "TOP",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volume2025%TOP",
        headerName: "% TOP",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volumeKepmen2025",
        headerName: "Volume Kepmen 2025",
        width: 120,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volumeJumlah2023",
        headerName: "2023",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volumeJumlah2024",
        headerName: "2024",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volumeJumlah2025",
        headerName: "2025",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volumeJumlah2026",
        headerName: "2026",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volumeJumlah2027",
        headerName: "2027",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volumeJumlah2028",
        headerName: "2028",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volumeJumlah2029",
        headerName: "2029",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
    {
        field: "volumeJumlah2030",
        headerName: "2030",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        renderCell: renderInputCell,
    },
];

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
        children: [{ field: "volume2025JPH" }, { field: "volume2025TOP" }, { field: "volume2025%TOP" }],
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

    const processRowUpdate = (newRow: any) => {
        setRows(rows.map((row) => (row.id === newRow.id ? newRow : row)));
        return newRow;
    };

    const handleAddRow = () => {
        const newId = rows.length > 0 ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
        const newRow: any = { id: newId, no: rows.length + 1, unitSwitch: "BBTUD" };
        // Initialize all editable fields as empty strings
        baseColumns.forEach((col) => {
            if (col.field !== "no" && col.field !== "action") {
                newRow[col.field] = "";
            }
        });
        setRows([...rows, newRow]);
    };

    const handleDeleteRow = (id: number) => {
        const updatedRows = rows
            .filter((row) => row.id !== id)
            .map((row, index) => ({ ...row, no: index + 1 }));
        setRows(updatedRows);
    };

    // Build full columns: insert unitSwitch between hbgt and volumeJPMH
    const handleUnitToggle = (id: number, newValue: string | null) => {
        if (newValue !== null) {
            setRows(rows.map((row) =>
                row.id === id ? { ...row, unitSwitch: newValue } : row
            ));
        }
    };

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
                    "& .MuiToggleButton-root": {
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        px: 1.5,
                        py: 0.3,
                        textTransform: "none",
                        border: "1px solid #e5e7eb",
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

    // Insert unitSwitch after hbgt
    const hbgtIndex = baseColumns.findIndex((col) => col.field === "hbgt");
    const columnsWithSwitch = [
        ...baseColumns.slice(0, hbgtIndex + 1),
        unitColumn,
        ...baseColumns.slice(hbgtIndex + 1),
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
        <div>
            {/* Action Buttons */}
            <div className="flex gap-3 mb-4 ml-177">
                <Button
                    variant="outlined"
                    startIcon={<FileText size={18} />}
                    sx={{
                        borderColor: "#115d72",
                        color: "#115d72",
                        textTransform: "none",
                        borderRadius: 2,
                        px: 3,
                        "&:hover": {
                            borderColor: "#0d4a5c",
                            backgroundColor: "#115d72/20",
                        },
                    }}
                >
                    Ekspor ke Dokumen
                </Button>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleAddRow}
                    sx={{
                        backgroundColor: "#115d72",
                        textTransform: "none",
                        borderRadius: 2,
                        px: 3,
                        "&:hover": {
                            backgroundColor: "#0d4a5c",
                        },
                    }}
                >
                    Tambah Kontrak
                </Button>
            </div>

            {/* Data Table */}
            <div className="w-full bg-gray-50">
                <Box>
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
                        pageSizeOptions={[5, 10, 25, 50]}
                        columnHeaderHeight={60}
                        disableRowSelectionOnClick
                        sx={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            "& .MuiDataGrid-cell": {
                                borderBottom: "1px solid #e5e7eb",
                                borderRight: "1px solid #e5e7eb",
                                py: 1,
                                px: 0.5,
                                display: "flex",
                                alignItems: "center",
                            },
                            "& .MuiDataGrid-columnHeaders": {
                                backgroundColor: "#f3f3f8 !important",
                                borderBottom: "1px solid #e5e7eb",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                            },
                            "& .MuiDataGrid-columnHeader": {
                                backgroundColor: "#f3f3f8 !important",
                                borderRight: "1px solid #e5e7eb !important",
                            },
                            "& .MuiDataGrid-filler": {
                                backgroundColor: "#f3f3f8 !important",
                            },
                            "& .MuiDataGrid-columnHeaderTitle": {
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                whiteSpace: "normal",
                                lineHeight: "1.2",
                                textAlign: "center",
                                overflow: "visible",
                                textOverflow: "clip",
                            },
                            "& .MuiDataGrid-columnHeader--filledGroup .MuiDataGrid-columnHeaderTitleContainer": {
                                borderBottom: "1px solid #e5e7eb",
                            },
                            "& .MuiDataGrid-row": {
                                "&:nth-of-type(odd)": {
                                    backgroundColor: "#ffffff",
                                },
                                "&:nth-of-type(even)": {
                                    backgroundColor: "#ffffff",
                                },
                            },
                            "& .MuiDataGrid-cell:focus": {
                                outline: "none",
                            },
                            "& .MuiDataGrid-cell:focus-within": {
                                outline: "none",
                            },
                        }}
                    />
                </Box>
            </div>

            {/* Save Button */}
            <div className="mt-4">
                <Button
                    variant="contained"
                    sx={{
                        backgroundColor: "#115d72",
                        textTransform: "none",
                        borderRadius: 2,
                        px: 4,
                        "&:hover": {
                            backgroundColor: "#0d4a5c",
                        },
                    }}
                >
                    Simpan
                </Button>
            </div>
        </div>
    );
}
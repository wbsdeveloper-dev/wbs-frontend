"use client";

import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, IconButton, Chip, TextField, InputAdornment, Typography } from "@mui/material";
import { Pencil, Trash2, Search, Menu } from "lucide-react";

// Sample data for Site Table based on the design
const siteRows = [
    {
        id: 1,
        namaSite: "PN PLN Gresik",
        jenisSite: "Pembangkit",
        pembangkit: "PN PLN Gresik",
        lokasi: "Gresik",
        status: "Aktif",
    },
    {
        id: 2,
        namaSite: "Terminal Gas A",
        jenisSite: "Pemasok",
        pembangkit: "-",
        lokasi: "Bali",
        status: "Aktif",
    },
];

// Sample data for Relasi Table based on the design
const relasiRows = [
    {
        id: 1,
        siteSumber: "Pemasok Gas A",
        jenisRelasi: "Menyuplai",
        siteTujuan: "PN PLN Gresik",
        keterangan: "Gas Utama",
        status: "Aktif",
    },
    {
        id: 2,
        siteSumber: "Transportir B",
        jenisRelasi: "Mengangkut",
        siteTujuan: "Pemasok Gas A",
        keterangan: "Jalur laut",
        status: "Aktif",
    },
];

// Status chip component
const StatusChip = ({ status }: { status: string }) => (
    <Chip
        icon={
            <Box
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: status === "Aktif" ? "#22c55e" : "#ef4444",
                    ml: 1,
                }}
            />
        }
        label={status}
        size="small"
        sx={{
            backgroundColor: status === "Aktif" ? "#dcfce7" : "#fee2e2",
            color: status === "Aktif" ? "#16a34a" : "#dc2626",
            fontWeight: 500,
            fontSize: "0.75rem",
            height: 28,
            "& .MuiChip-icon": {
                marginLeft: "8px",
            },
        }}
    />
);

// Action buttons component
const ActionButtons = ({ id, onEdit, onDelete }: { id: number; onEdit: (id: number) => void; onDelete: (id: number) => void }) => (
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
            sx={{ color: "#3b82f6", "&:hover": { color: "#2563eb", backgroundColor: "#eff6ff" } }}
            onClick={() => onEdit(id)}
        >
            <Pencil size={16} />
        </IconButton>
        <IconButton
            size="small"
            sx={{ color: "#ef4444", "&:hover": { color: "#dc2626", backgroundColor: "#fef2f2" } }}
            onClick={() => onDelete(id)}
        >
            <Trash2 size={16} />
        </IconButton>
    </Box>
);

// Site table columns
const siteColumns: GridColDef[] = [
    {
        field: "namaSite",
        headerName: "Nama Site",
        flex: 1,
        minWidth: 120,
        headerAlign: "center",
        align: "center",
        renderHeader: () => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <span>Nama Site</span>
            </Box>
        ),
    },
    {
        field: "jenisSite",
        headerName: "Jenis Site",
        flex: 1,
        minWidth: 100,
        headerAlign: "center",
        align: "center",
    },
    {
        field: "pembangkit",
        headerName: "Pembangkit",
        flex: 1,
        minWidth: 120,
        headerAlign: "center",
        align: "center",
    },
    {
        field: "lokasi",
        headerName: "Lokasi",
        flex: 1,
        minWidth: 100,
        headerAlign: "center",
        align: "center",
    },
    {
        field: "status",
        headerName: "Status",
        flex: 1,
        minWidth: 100,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
        field: "aksi",
        headerName: "Aksi",
        flex: 1,
        minWidth: 100,
        headerAlign: "center",
        align: "center",
        sortable: false,
        renderCell: (params) => (
            <ActionButtons
                id={params.row.id}
                onEdit={(id) => console.log("Edit site", id)}
                onDelete={(id) => console.log("Delete site", id)}
            />
        ),
    },
];

// Relasi table columns
const relasiColumns: GridColDef[] = [
    {
        field: "siteSumber",
        headerName: "Site Sumber",
        flex: 1,
        minWidth: 120,
        headerAlign: "center",
        align: "center",
    },
    {
        field: "jenisRelasi",
        headerName: "Jenis Relasi",
        flex: 1,
        minWidth: 100,
        headerAlign: "center",
        align: "center",
    },
    {
        field: "siteTujuan",
        headerName: "Site Tujuan",
        flex: 1,
        minWidth: 120,
        headerAlign: "center",
        align: "center",
    },
    {
        field: "keterangan",
        headerName: "Keterangan",
        flex: 1,
        minWidth: 100,
        headerAlign: "center",
        align: "center",
    },
    {
        field: "status",
        headerName: "Status",
        flex: 1,
        minWidth: 100,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
        field: "aksi",
        headerName: "Aksi",
        flex: 1,
        minWidth: 100,
        headerAlign: "center",
        align: "center",
        sortable: false,
        renderCell: (params) => (
            <ActionButtons
                id={params.row.id}
                onEdit={(id) => console.log("Edit relasi", id)}
                onDelete={(id) => console.log("Delete relasi", id)}
            />
        ),
    },
];

// Common DataGrid styles
const dataGridStyles = {
    border: "none",
    fontSize: "0.875rem",
    "& .MuiDataGrid-cell": {
        borderColor: "#f3f4f6",
        py: 1.5,
    },
    "& .MuiDataGrid-columnHeaders": {
        backgroundColor: "#f8fafc",
        borderColor: "#e5e7eb",
        fontSize: "0.875rem",
        fontWeight: 600,
    },
    "& .MuiDataGrid-columnHeaderTitle": {
        fontWeight: 600,
        color: "#374151",
    },
    "& .MuiDataGrid-row": {
        "&:hover": {
            backgroundColor: "#f8fafc",
        },
    },
    "& .MuiDataGrid-cell:focus": {
        outline: "none",
    },
    "& .MuiDataGrid-cell:focus-within": {
        outline: "none",
    },
    "& .MuiDataGrid-footerContainer": {
        borderTop: "1px solid #e5e7eb",
    },
};

interface TableCardProps {
    title: string;
    searchPlaceholder: string;
    rows: typeof siteRows | typeof relasiRows;
    columns: GridColDef[];
}

// Reusable Table Card component
const TableCard = ({ title, searchPlaceholder, rows, columns }: TableCardProps) => (
    <Box
        sx={{
            bgcolor: "white",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
            border: "1px solid #e5e7eb",
        }}
    >
        {/* Table Header */}
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 3,
                py: 2,
                borderBottom: "1px solid #e5e7eb",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Menu size={20} color="#6b7280" />
                <Typography
                    sx={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "#374151",
                    }}
                >
                    {title}
                </Typography>
            </Box>
            <TextField
                placeholder={searchPlaceholder}
                size="small"
                sx={{
                    width: 200,
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#f9fafb",
                        "& fieldset": {
                            borderColor: "#e5e7eb",
                        },
                        "&:hover fieldset": {
                            borderColor: "#d1d5db",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#3b82f6",
                        },
                    },
                    "& .MuiInputBase-input": {
                        fontSize: "0.875rem",
                        py: 1,
                    },
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search size={16} color="#9ca3af" />
                        </InputAdornment>
                    ),
                }}
            />
        </Box>

        {/* Data Table */}
        <Box sx={{ height: 300, width: "100%", px: 2, pb: 2 }}>
            <DataGrid
                rows={rows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 5 },
                    },
                }}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
                sx={dataGridStyles}
            />
        </Box>
    </Box>
);

// Export Site Table component
export function DaftarSiteTable() {
    return (
        <TableCard
            title="Tabel Daftar Site"
            searchPlaceholder="Cari site..."
            rows={siteRows}
            columns={siteColumns}
        />
    );
}

// Export Relasi Table component
export function RelasiOperasionalTable() {
    return (
        <TableCard
            title="Tabel Daftar Relasi"
            searchPlaceholder="Cari relasi..."
            rows={relasiRows}
            columns={relasiColumns}
        />
    );
}

// Default export for backward compatibility
export default function SiteTable() {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <DaftarSiteTable />
            <RelasiOperasionalTable />
        </Box>
    );
}

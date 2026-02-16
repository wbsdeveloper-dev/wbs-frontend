"use client";

import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { Box, IconButton, Chip } from "@mui/material";
import { Pencil, Trash2, Download, Loader2 } from "lucide-react";
import type {
  MonitoringRecord,
  MonitoringPagination,
} from "@/hooks/service/monitoring-api";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditDataTableProps {
  records: MonitoringRecord[];
  pagination: MonitoringPagination;
  isLoading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
}

// ---------------------------------------------------------------------------
// Status chip colour helper
// ---------------------------------------------------------------------------

function statusColor(
  status: string,
): "success" | "error" | "warning" | "info" | "default" {
  switch (status) {
    case "MATCH":
      return "success";
    case "MISMATCH":
      return "error";
    case "NEED_REVIEW":
      return "warning";
    case "RESOLVED":
      return "info";
    default:
      return "default";
  }
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columns: GridColDef[] = [
  {
    field: "rowNumber",
    headerName: "No",
    width: 60,
    headerAlign: "center",
    align: "center",
    sortable: false,
  },
  {
    field: "id",
    headerName: "ID",
    width: 120,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "reportDate",
    headerName: "Tanggal",
    width: 120,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "siteName",
    headerName: "Pembangkit",
    width: 200,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "metricType",
    headerName: "Metrik",
    width: 100,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "periodType",
    headerName: "Periode",
    width: 100,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "waValue",
    headerName: "WA Value",
    width: 110,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => params.value ?? "-",
  },
  {
    field: "plnValue",
    headerName: "PLN Value",
    width: 110,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => params.value ?? "-",
  },
  {
    field: "finalValue",
    headerName: "Final Value",
    width: 110,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => params.value ?? "-",
  },
  {
    field: "delta",
    headerName: "Delta",
    width: 80,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => params.value ?? "-",
  },
  {
    field: "status",
    headerName: "Status",
    width: 130,
    headerAlign: "center",
    align: "center",
    renderCell: (params) => (
      <Chip
        label={params.value}
        color={statusColor(params.value)}
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    field: "action",
    headerName: "Action",
    width: 150,
    headerAlign: "center",
    align: "center",
    sortable: false,
    renderCell: (params) => (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <IconButton
          size="small"
          sx={{ color: "#6b7280", "&:hover": { color: "#3b82f6" } }}
          onClick={() => console.log("Edit", params.row.id)}
        >
          <Pencil size={18} />
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: "#ef4444", "&:hover": { color: "#dc2626" } }}
          onClick={() => console.log("Delete", params.row.id)}
        >
          <Trash2 size={18} />
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: "#6b7280", "&:hover": { color: "#10b981" } }}
          onClick={() => console.log("Download", params.row.id)}
        >
          <Download size={18} />
        </IconButton>
      </Box>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditDataTable({
  records,
  pagination,
  isLoading,
  onPageChange,
}: EditDataTableProps) {
  // Map records to rows with a sequential `rowNumber`
  const rows = records.map((record, index) => ({
    ...record,
    rowNumber: (pagination.page - 1) * pagination.limit + index + 1,
  }));

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    // MUI DataGrid pages are 0-based; API pages are 1-based
    onPageChange(model.page + 1, model.pageSize);
  };

  if (isLoading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl">
        <Loader2 className="animate-spin text-[#14a2bb]" size={36} />
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50">
      <Box
        sx={{
          height: 500,
          width: "100%",
          bgcolor: "white",
          borderRadius: 6,
          overflow: "hidden",
          py: 2,
          px: 3,
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={pagination.total}
          paginationMode="server"
          paginationModel={{
            page: pagination.page - 1,
            pageSize: pagination.limit,
          }}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[5, 10, 20, 50]}
          loading={isLoading}
          disableRowSelectionOnClick
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": {
              borderColor: "#ffffff",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f3f4f6",
              borderColor: "#e5e7eb",
              fontSize: "0.875rem",
              fontWeight: 600,
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 600,
            },
            "& .MuiDataGrid-row": {
              "&:nth-of-type(odd)": {
                backgroundColor: "#dbeafe",
                borderRadius: 3,
                borderColor: "#ffffff",
              },
              "&:nth-of-type(even)": {
                backgroundColor: "#ffffff",
              },
              "&:hover": {
                backgroundColor: "#bfdbfe !important",
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
  );
}

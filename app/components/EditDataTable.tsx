import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, IconButton } from "@mui/material";
import { Pencil, Trash2, Download } from "lucide-react";
import FilterAutocomplete from "./FilterAutocomplete";

const rows = [
  {
    id: 45,
    no: 1,
    jam: "08:10",
    tanggal: "2025-10",
    product: "Gas Pipa",
    handoverPoint: "Stasiun Gas Pltu Cilegon",
    supplier: "HUSKY CN001 Madura Ltd.",
    powerPlant: "PLN IP Cilegon",
  },
  {
    id: 46,
    no: 2,
    jam: "16:06",
    tanggal: "2025-10",
    product: "Gas Pipa",
    handoverPoint: "Stasiun Gas Pltu Cilegon",
    supplier: "HUSKY CN001 Madura Ltd.",
    powerPlant: "PLN IP Cilegon",
  },
  {
    id: 47,
    no: 3,
    jam: "12:11",
    tanggal: "2025-10",
    product: "Gas Pipa",
    handoverPoint: "Stasiun Gas Pltu Cilegon",
    supplier: "HUSKY CN001 Madura Ltd.",
    powerPlant: "PLN IP Cilegon",
  },
  {
    id: 48,
    no: 4,
    jam: "18:34",
    tanggal: "2025-10",
    product: "Gas Pipa",
    handoverPoint: "Stasiun Gas Pltu Cilegon",
    supplier: "HUSKY CN001 Madura Ltd.",
    powerPlant: "PLN IP Cilegon",
  },
  {
    id: 49,
    no: 5,
    jam: "17:11",
    tanggal: "2025-10",
    product: "Gas Pipa",
    handoverPoint: "Stasiun Gas Pltu Cilegon",
    supplier: "HUSKY CN001 Madura Ltd.",
    powerPlant: "PLN IP Cilegon",
  },
];

const columns: GridColDef[] = [
  {
    field: "no",
    headerName: "No",
    width: 70,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "id",
    headerName: "ID",
    width: 70,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "jam",
    headerName: "Jam",
    width: 80,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "tanggal",
    headerName: "Tanggal",
    width: 120,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "product",
    headerName: "Product",
    width: 130,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "supplier",
    headerName: "Pemasok",
    width: 200,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "powerPlant",
    headerName: "Power Plant",
    width: 180,
    headerAlign: "center",
    align: "center",
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

export default function BBMMonitoringTable() {
  return (
    <div>
      <div className="w-full bg-gray-50">
        {/* <FilterAutocomplete
          label=""
          options={filterTypeOptions}
          value={filterType}
          onChange={setFilterType}
          placeholder="Pilih Filter Berdasar"
        /> */}
      </div>
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
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
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
    </div>
  );
}

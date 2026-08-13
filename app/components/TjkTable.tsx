"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useContracts, useUpdateContract } from "@/hooks/service/contract-api";
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  useGridApiRef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { Box, CircularProgress } from "@mui/material";
import { RefreshCw, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

const formatTanggal = (dateStr?: string | null) => {
  if (!dateStr || dateStr === "-") return "-";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
};

const unformatTanggal = (dateStr?: string | null) => {
  if (!dateStr || dateStr === "-") return null;
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[0].length === 2)
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
};

export interface TjkTableRef {
  save: () => Promise<void>;
  cancel: () => void;
}

function makeRenderCell(isEditMode: boolean) {
  const RenderCell = (params: GridRenderCellParams) => {
    if (isEditMode && params.colDef.editable) {
      return (
        <Box
          sx={{
            width: "calc(100% - 8px)",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            backgroundColor: "var(--surface)",
            color: "var(--text-primary)",
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
        {params.value || (
          <span style={{ fontSize: "10px", color: "#aaa" }}>—</span>
        )}
      </span>
    );
  };
  RenderCell.displayName = "RenderCell";
  return RenderCell;
}

const TjkTable = forwardRef<TjkTableRef, { isEditMode: boolean }>(
  ({ isEditMode }, ref) => {
    const { data: contracts, isLoading, isError, refetch } = useContracts();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <CircularProgress size={40} sx={{ color: "var(--theme-primary)" }} />
          <span className="ml-3 text-sm text-gray-500">Memuat data TJK...</span>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="text-red-500 text-sm font-medium">
            Gagal memuat data TJK
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#0d4a5c] transition-all duration-200"
          >
            <RefreshCw size={14} /> Coba Lagi
          </button>
        </div>
      );
    }

    const updateContract = useUpdateContract();
    const apiRef = useGridApiRef();
    const [rows, setRows] = useState<any[]>([]);
    const [paginationModel, setPaginationModel] = useState({
      page: 0,
      pageSize: 10,
    });

    useEffect(() => {
      if (contracts) {
        setRows(
          contracts.map((c, index) => ({
            id: c.id,
            no: index + 1,
            region: c.region || "-",
            pemasok: c.pemasok_name || "-",
            pembangkit: c.pembangkit_name || "-",
            tjkBbtud: c.tjk_bbtud != null ? c.tjk_bbtud : "-",
            tjkMmscfd: c.tjk_mmscfd != null ? c.tjk_mmscfd : "-",
            nilaiInisialisasi:
              c.nilai_inisialisasi != null
                ? Number(c.nilai_inisialisasi).toFixed(2)
                : "-",
            tanggalCutoff:
              c.tanggal_cutoff != null ? formatTanggal(c.tanggal_cutoff) : "-",
          })),
        );
      }
    }, [contracts]);

    const renderCell = makeRenderCell(isEditMode);

    const columns: GridColDef[] = [
      {
        field: "no",
        headerName: "No",
        width: 60,
        align: "center",
        headerAlign: "center",
        renderCell,
      },
      {
        field: "region",
        headerName: "Region",
        width: 180,
        align: "center",
        headerAlign: "center",
        renderCell,
      },
      {
        field: "pemasok",
        headerName: "Pemasok",
        width: 180,
        align: "center",
        headerAlign: "center",
        renderCell,
      },
      {
        field: "pembangkit",
        headerName: "Pembangkit",
        width: 180,
        align: "center",
        headerAlign: "center",
        renderCell,
      },
      {
        field: "tjkBbtud",
        headerName: "TJK (BBTUD)",
        width: 130,
        align: "center",
        headerAlign: "center",
        editable: isEditMode,
        renderCell,
      },
      {
        field: "tjkMmscfd",
        headerName: "TJK (MMSCFD)",
        width: 130,
        align: "center",
        headerAlign: "center",
        editable: isEditMode,
        renderCell,
      },
      {
        field: "nilaiInisialisasi",
        headerName: "Nilai Inisialisasi",
        width: 160,
        align: "center",
        headerAlign: "center",
        editable: isEditMode,
        renderCell,
      },
      {
        field: "tanggalCutoff",
        headerName: "Tanggal Cutoff",
        width: 160,
        align: "center",
        headerAlign: "center",
        editable: isEditMode,
        renderCell,
      },
    ];

    const processRowUpdate = (newRow: any) => {
      setRows((prev) =>
        prev.map((row) => (row.id === newRow.id ? newRow : row)),
      );
      return newRow;
    };

    useImperativeHandle(ref, () => ({
      save: async () => {
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
        } catch {}

        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
          for (const row of rows) {
            const contract = contracts?.find((c) => c.id === row.id);
            if (!contract) continue;

            const originalBbtud =
              contract.tjk_bbtud != null ? contract.tjk_bbtud : "-";
            const originalMmscfd =
              contract.tjk_mmscfd != null ? contract.tjk_mmscfd : "-";
            const originalInisialisasi =
              contract.nilai_inisialisasi != null
                ? Number(contract.nilai_inisialisasi).toFixed(2)
                : "-";
            const originalCutoff =
              contract.tanggal_cutoff != null
                ? formatTanggal(contract.tanggal_cutoff)
                : "-";

            // We only update if the fields have changed
            if (
              row.tjkBbtud !== originalBbtud ||
              row.tjkMmscfd !== originalMmscfd ||
              row.nilaiInisialisasi !== originalInisialisasi ||
              row.tanggalCutoff !== originalCutoff
            ) {
              const payload: any = {};
              if (row.tjkBbtud !== originalBbtud)
                payload.tjk_bbtud =
                  row.tjkBbtud === "-" || row.tjkBbtud === ""
                    ? null
                    : Number(row.tjkBbtud);
              if (row.tjkMmscfd !== originalMmscfd)
                payload.tjk_mmscfd =
                  row.tjkMmscfd === "-" || row.tjkMmscfd === ""
                    ? null
                    : Number(row.tjkMmscfd);
              if (row.nilaiInisialisasi !== originalInisialisasi)
                payload.nilai_inisialisasi =
                  row.nilaiInisialisasi === "-" || row.nilaiInisialisasi === ""
                    ? null
                    : Number(row.nilaiInisialisasi);
              if (row.tanggalCutoff !== originalCutoff)
                payload.tanggal_cutoff = unformatTanggal(row.tanggalCutoff);

              await updateContract.mutateAsync({
                id: row.id,
                payload,
              });
            }
          }
          refetch();
        } catch (error) {
          console.error("Failed to save TJK", error);
          throw error;
        }
      },
      cancel: () => {
        refetch(); // reset rows
      },
    }));

    return (
      <div className="w-full">
        {isEditMode && (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
            <Pencil size={14} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              Mode Edit — Klik sel untuk mengedit, lalu tekan Simpan untuk
              menyimpan perubahan
            </span>
          </div>
        )}
        <Box sx={{ px: 2, pb: 2, pt: 1 }}>
          <DataGrid
            apiRef={apiRef}
            rows={rows}
            columns={columns}
            processRowUpdate={processRowUpdate}
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
            slots={{
              toolbar: GridToolbar,
              footer: () => {
                const totalItems = rows.length;
                const totalPages = Math.max(1, Math.ceil(totalItems / paginationModel.pageSize));
                const startIndex = paginationModel.page * paginationModel.pageSize;
                const endIndex = startIndex + paginationModel.pageSize;

                return (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-t border-[var(--border)] gap-3 bg-white rounded-b-xl">
                    {/* Left: info + page size */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-600">
                        Menampilkan{" "}
                        {totalItems > 0 ? (
                          <>
                            {startIndex + 1}-{Math.min(endIndex, totalItems)} dari{" "}
                            {totalItems}
                          </>
                        ) : (
                          "0"
                        )}{" "}
                        data
                      </span>
                      <div className="flex items-center gap-1.5">
                        <label htmlFor="page-size-tjk" className="text-sm text-gray-500">
                          Baris:
                        </label>
                        <select
                          id="page-size-tjk"
                          value={paginationModel.pageSize}
                          onChange={(e) => {
                            setPaginationModel({ page: 0, pageSize: Number(e.target.value) });
                          }}
                          className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all duration-200"
                        >
                          {[5, 10, 25, 50].map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Right: page buttons */}
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        {/* Previous */}
                        <button
                          onClick={() => setPaginationModel((prev) => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
                          disabled={paginationModel.page === 0}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {/* Page numbers */}
                        {(() => {
                          const pages: (number | "...")[] = [];
                          const currentPage = paginationModel.page;
                          const displayPage = currentPage + 1; // 1-indexed for display
                          if (totalPages <= 7) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                          } else {
                            pages.push(1);
                            if (displayPage > 3) pages.push("...");
                            const start = Math.max(2, displayPage - 1);
                            const end = Math.min(totalPages - 1, displayPage + 1);
                            for (let i = start; i <= end; i++) pages.push(i);
                            if (displayPage < totalPages - 2) pages.push("...");
                            pages.push(totalPages);
                          }
                          return pages.map((p, idx) =>
                            p === "..." ? (
                              <span
                                key={`ellipsis-${idx}`}
                                className="px-1 text-sm text-gray-400 select-none"
                              >
                                …
                              </span>
                            ) : (
                              <button
                                key={p}
                                onClick={() => setPaginationModel((prev) => ({ ...prev, page: (p as number) - 1 }))}
                                className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  p === displayPage
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {p}
                              </button>
                            ),
                          );
                        })()}

                        {/* Next */}
                        <button
                          onClick={() => setPaginationModel((prev) => ({ ...prev, page: Math.min(totalPages - 1, prev.page + 1) }))}
                          disabled={paginationModel.page === totalPages - 1}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              },
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowHeight={56}
            pageSizeOptions={[5, 10, 25, 50]}
            columnHeaderHeight={56}
            disableRowSelectionOnClick
            sx={{
              border: "1px solid var(--border)",
              borderRadius: "12px",
              fontSize: "12px",
              fontFamily: "inherit",
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid var(--border)",
                borderRight: "1px solid var(--border)",
                py: 1,
                px: 1,
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "var(--surface-muted) !important",
                borderBottom: "1px solid var(--border)",
                fontSize: "14px",
                fontWeight: 600,
              },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "var(--surface-muted) !important",
                borderRight: "1px solid var(--border) !important",
              },
              "& .MuiDataGrid-filler": {
                backgroundColor: "var(--surface-muted) !important",
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
                  borderBottom: "1px solid var(--border)",
                },
              "& .MuiDataGrid-row": {
                "&:hover": {
                  backgroundColor: isEditMode
                    ? "var(--surface-subtle)"
                    : "var(--surface-muted)",
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
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
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
    );
  },
);

export default TjkTable;

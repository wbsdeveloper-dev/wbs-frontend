"use client";

import { useState, useMemo } from "react";
import {
  Pencil,
  Trash2,
  Menu,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { BbmRecord } from "@/hooks/service/bbm-api";
import { usePrivilege } from "@/hooks/usePrivilege";

interface EditBbmDataTableProps {
  records: BbmRecord[];
  isLoading: boolean;
  hideActions?: boolean;
}

const ActionButtons = ({
  id,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: {
  id: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}) => (
  <div className="flex items-center justify-center gap-1">
    {canUpdate && (
      <button
        onClick={() => onEdit(id)}
        className="p-1.5 text-[#115d72] hover:bg-[#115d72]/10 rounded-lg transition-colors"
        title="Edit"
      >
        <Pencil size={16} />
      </button>
    )}
    {canDelete && (
      <button
        onClick={() => onDelete(id)}
        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Hapus"
      >
        <Trash2 size={16} />
      </button>
    )}
  </div>
);

export default function EditBbmDataTable({
  records,
  isLoading,
  hideActions = false,
}: EditBbmDataTableProps) {
  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const canUpdate = hasPrivilege("data_management", "UPDATE");
  const canDelete = hasPrivilege("data_management", "DELETE");
  const hasAction = !hideActions && (canUpdate || canDelete);

  type SortField = keyof BbmRecord;
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortField(null);
      setSortDir("asc");
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const lower = searchTerm.toLowerCase();
    return records.filter(
      (r) =>
        (r.tbbm?.toLowerCase() || "").includes(lower) ||
        (r.pembangkit?.toLowerCase() || "").includes(lower) ||
        (r.reportDate?.toLowerCase() || "").includes(lower) ||
        (r.product?.toLowerCase() || "").includes(lower),
    );
  }, [records, searchTerm]);

  const sortedRecords = useMemo(() => {
    if (!sortField) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredRecords, sortField, sortDir]);

  const totalItems = sortedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedRecords = sortedRecords.slice(
    startIndex,
    startIndex + pageSize,
  );

  // Reset page to 1 when search term changes
  useMemo(() => {
    setPage(1);
  }, [searchTerm]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ChevronsUpDown size={12} className="ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="ml-1 text-[#115d72]" />
    ) : (
      <ArrowDown size={12} className="ml-1 text-[#115d72]" />
    );
  };

  const Th = ({
    label,
    field,
    align = "center",
  }: {
    label: string;
    field?: SortField;
    align?: "left" | "center" | "right";
  }) => (
    <th
      className={`px-4 py-3 text-${align} text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${
        field
          ? "cursor-pointer select-none hover:bg-gray-100 transition-colors"
          : ""
      }`}
      onClick={field ? () => handleSort(field) : undefined}
    >
      <span className="inline-flex items-center justify-center">
        {label}
        {field && <SortIcon field={field} />}
      </span>
    </th>
  );

  const fmt = (val: number | null | undefined): string => {
    if (val == null) return "-";
    return val.toLocaleString("id-ID");
  };

  const handleDeleteClick = (id: string, name: string) => {
    // TBD: connect to a delete API if needed
    if (window.confirm(`Apakah Anda yakin ingin menghapus record ${name}?`)) {
      alert("Delete action triggered for " + id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-gray-200 gap-3">
        <div className="flex items-center gap-1.5">
          <Menu size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Tabel BBM Monthly
          </span>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari data BBM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb] transition-all w-full sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th label="No" />
              <Th label="Bulan" field="reportDate" />
              <Th label="TBBM" field="tbbm" align="left" />
              <Th label="Pembangkit" field="pembangkit" align="left" />
              <Th label="Produk" field="product" />
              <Th label="Moda" field="moda" />
              <Th label="Nominasi" field="nomination" />
              <Th label="Realisasi" field="realization" />
              <Th label="Pemakaian" field="usage" />
              {hasAction && <Th label="Aksi" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={hasAction ? 9 : 8}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2
                      className="animate-spin text-[#14a2bb]"
                      size={20}
                    />
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={hasAction ? 9 : 8}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {searchTerm
                    ? "Tidak ada data yang cocok dengan pencarian"
                    : "Tidak ada data BBM"}
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record, index) => {
                const rowId =
                  record.id ||
                  `${record.pembangkit}-${record.reportDate}-${index}`;
                return (
                  <tr
                    key={rowId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-gray-700">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 whitespace-nowrap">
                      {record.reportDate}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{record.tbbm}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {record.pembangkit}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {record.product}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {record.moda}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono">
                      {fmt(record.nomination)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono font-medium">
                      {fmt(record.realization)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono">
                      {fmt(record.usage)}
                    </td>
                    {hasAction && (
                      <td className="px-4 py-3 text-center">
                        <ActionButtons
                          id={rowId}
                          onEdit={(id) => router.push(`/edit-bbm/${id}`)}
                          onDelete={(id) =>
                            handleDeleteClick(
                              id,
                              `${record.pembangkit} - ${record.reportDate}`,
                            )
                          }
                          canUpdate={canUpdate}
                          canDelete={canDelete}
                        />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-3 bg-white rounded-b-xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">
              Menampilkan{" "}
              <span className="font-medium text-gray-900">
                {startIndex + 1}
              </span>{" "}
              hingga{" "}
              <span className="font-medium text-gray-900">
                {Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              dari{" "}
              <span className="font-medium text-gray-900">{totalItems}</span>{" "}
              data
            </span>
            <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
              <span className="text-sm text-gray-600">Baris per halaman:</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#14a2bb] focus:border-[#14a2bb] block pl-3 pr-8 py-1.5 cursor-pointer outline-none hover:bg-gray-100 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-2 py-1 text-sm font-medium text-gray-700 select-none min-w-[4rem] text-center">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
              title="Halaman Selanjutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

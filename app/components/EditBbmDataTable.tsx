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
  Filter,
  X,
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
        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
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

const FilterTag = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
    {label}
    <button
      onClick={onRemove}
      className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
    >
      <X size={12} />
    </button>
  </span>
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);

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

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    tbbm?: string;
    pembangkit?: string;
    product?: string;
    moda?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const [localTbbm, setLocalTbbm] = useState("");
  const [localPembangkit, setLocalPembangkit] = useState("");
  const [localProduct, setLocalProduct] = useState("");
  const [localModa, setLocalModa] = useState("");
  const [localStartDate, setLocalStartDate] = useState("");
  const [localEndDate, setLocalEndDate] = useState("");

  const activeFilterCount = [
    filters.tbbm,
    filters.pembangkit,
    filters.product,
    filters.moda,
    filters.startDate || filters.endDate,
  ].filter(Boolean).length;

  const handleApplyFilters = () => {
    setFilters({
      ...(localTbbm ? { tbbm: localTbbm } : {}),
      ...(localPembangkit ? { pembangkit: localPembangkit } : {}),
      ...(localProduct ? { product: localProduct } : {}),
      ...(localModa ? { moda: localModa } : {}),
      ...(localStartDate ? { startDate: localStartDate } : {}),
      ...(localEndDate ? { endDate: localEndDate } : {}),
    });
    setShowFilters(false);
    setPage(1);
  };

  const handleResetFilters = () => {
    setLocalTbbm("");
    setLocalPembangkit("");
    setLocalProduct("");
    setLocalModa("");
    setLocalStartDate("");
    setLocalEndDate("");
    setFilters({});
    setPage(1);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // TBBM
      if (
        filters.tbbm &&
        !r.tbbm?.toLowerCase().includes(filters.tbbm.toLowerCase())
      )
        return false;
      // Pembangkit
      if (
        filters.pembangkit &&
        !r.pembangkit?.toLowerCase().includes(filters.pembangkit.toLowerCase())
      )
        return false;
      // Produk
      if (
        filters.product &&
        !r.product?.toLowerCase().includes(filters.product.toLowerCase())
      )
        return false;
      // Moda
      if (
        filters.moda &&
        !r.moda?.toLowerCase().includes(filters.moda.toLowerCase())
      )
        return false;

      // Date Range (reportDate is YYYY-MM)
      if (filters.startDate) {
        const startMonth = filters.startDate.substring(0, 7);
        if (r.reportDate < startMonth) return false;
      }
      if (filters.endDate) {
        const endMonth = filters.endDate.substring(0, 7);
        if (r.reportDate > endMonth) return false;
      }

      return true;
    });
  }, [records, filters]);

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

  const rowSpans = useMemo(() => {
    const spans = paginatedRecords.map((record) => ({
      nominationSpan: 1,
      usageSpan: 1,
      showNomination: true,
      showUsage: true,
      nominationValue: record.nomination,
      usageValue: record.usage,
    }));

    let i = 0;
    while (i < paginatedRecords.length) {
      let j = i + 1;
      const keyI = `${paginatedRecords[i].reportDate}|${paginatedRecords[i].tbbm}|${paginatedRecords[i].pembangkit}|${paginatedRecords[i].product}`;

      while (j < paginatedRecords.length) {
        const keyJ = `${paginatedRecords[j].reportDate}|${paginatedRecords[j].tbbm}|${paginatedRecords[j].pembangkit}|${paginatedRecords[j].product}`;
        if (keyI === keyJ) {
          j++;
        } else {
          break;
        }
      }

      // Find first non-empty nomination and usage value in this group
      let nominationVal = paginatedRecords[i].nomination;
      for (let k = i; k < j; k++) {
        const val = paginatedRecords[k].nomination;
        if (val != null && val !== 0) {
          nominationVal = val;
          break;
        }
      }

      let usageVal = paginatedRecords[i].usage;
      for (let k = i; k < j; k++) {
        const val = paginatedRecords[k].usage;
        if (val != null && val !== 0) {
          usageVal = val;
          break;
        }
      }

      const count = j - i;
      spans[i].nominationSpan = count;
      spans[i].usageSpan = count;
      spans[i].nominationValue = nominationVal;
      spans[i].usageValue = usageVal;

      if (count > 1) {
        for (let k = i + 1; k < j; k++) {
          spans[k].showNomination = false;
          spans[k].showUsage = false;
          spans[k].nominationSpan = 0;
          spans[k].usageSpan = 0;
        }
      }
      i = j;
    }
    return spans;
  }, [paginatedRecords]);

  // Reset page to 1 when search term changes

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ChevronsUpDown size={12} className="ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="ml-1 text-primary" />
    ) : (
      <ArrowDown size={12} className="ml-1 text-primary" />
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
      className={`px-4 py-3 text-${align} text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${field
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
              showFilters || activeFilterCount > 0
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter size={16} />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1 flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                TBBM / Pemasok
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localTbbm}
                  onChange={(e) => setLocalTbbm(e.target.value)}
                  placeholder="Cari TBBM..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Pembangkit
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localPembangkit}
                  onChange={(e) => setLocalPembangkit(e.target.value)}
                  placeholder="Cari Pembangkit..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Produk
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localProduct}
                  onChange={(e) => setLocalProduct(e.target.value)}
                  placeholder="Cari Produk..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Moda
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localModa}
                  onChange={(e) => setLocalModa(e.target.value)}
                  placeholder="Cari Moda..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <X size={14} />
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#0d4a5c] transition-all duration-200"
            >
              <Search size={14} />
              Terapkan Filter
            </button>
          </div>
        </div>
      )}

      {/* Active filter tags */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">
            Filter aktif:
          </span>
          {filters.tbbm && (
            <FilterTag
              label={`TBBM: ${filters.tbbm}`}
              onRemove={() => {
                setLocalTbbm("");
                setFilters((f) => ({ ...f, tbbm: undefined }));
              }}
            />
          )}
          {filters.pembangkit && (
            <FilterTag
              label={`Pembangkit: ${filters.pembangkit}`}
              onRemove={() => {
                setLocalPembangkit("");
                setFilters((f) => ({ ...f, pembangkit: undefined }));
              }}
            />
          )}
          {filters.product && (
            <FilterTag
              label={`Produk: ${filters.product}`}
              onRemove={() => {
                setLocalProduct("");
                setFilters((f) => ({ ...f, product: undefined }));
              }}
            />
          )}
          {filters.moda && (
            <FilterTag
              label={`Moda: ${filters.moda}`}
              onRemove={() => {
                setLocalModa("");
                setFilters((f) => ({ ...f, moda: undefined }));
              }}
            />
          )}
          {(filters.startDate || filters.endDate) && (
            <FilterTag
              label={`Tanggal: ${filters.startDate || "..."} - ${filters.endDate || "..."}`}
              onRemove={() => {
                setLocalStartDate("");
                setLocalEndDate("");
                setFilters((f) => ({
                  ...f,
                  startDate: undefined,
                  endDate: undefined,
                }));
              }}
            />
          )}
          <button
            onClick={handleResetFilters}
            className="text-xs text-red-500 hover:text-red-700 font-medium ml-1 transition-colors"
          >
            Hapus Semua
          </button>
        </div>
      )}

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
                      className="animate-spin text-secondary"
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
                  "Tidak ada data BBM yang sesuai dengan filter"
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record, index) => {
                const rowId =
                  record.id ||
                  `${record.pembangkit}-${record.reportDate}-${index}`;
                const groupKey = `${record.reportDate}|${record.tbbm}|${record.pembangkit}|${record.product}`;
                return (
                  <tr
                    key={rowId}
                    onMouseEnter={() => setHoveredGroupId(groupKey)}
                    onMouseLeave={() => setHoveredGroupId(null)}
                    className={`transition-colors ${
                      hoveredGroupId === groupKey ? "bg-gray-50" : ""
                    }`}
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
                    {rowSpans[index]?.showNomination && (
                      <td
                        rowSpan={rowSpans[index]?.nominationSpan}
                        className="px-4 py-3 text-center text-gray-700 font-mono align-middle"
                      >
                        {fmt(rowSpans[index]?.nominationValue)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center text-gray-700 font-mono font-medium">
                      {fmt(record.realization)}
                    </td>
                    {rowSpans[index]?.showUsage && (
                      <td
                        rowSpan={rowSpans[index]?.usageSpan}
                        className="px-4 py-3 text-center text-gray-700 font-mono align-middle"
                      >
                        {fmt(rowSpans[index]?.usageValue)}
                      </td>
                    )}
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
                  className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-secondary focus:border-secondary block pl-3 pr-8 py-1.5 cursor-pointer outline-none hover:bg-gray-100 transition-colors"
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

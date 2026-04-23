"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Pencil,
  Trash2,
  Download,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type {
  MonitoringRecord,
  MonitoringPagination,
  MonitoringParams,
} from "@/hooks/service/monitoring-api";
import { useDeleteMonitoringRecord } from "@/hooks/service/monitoring-api";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditDataTableProps {
  records: MonitoringRecord[];
  pagination: MonitoringPagination;
  isLoading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  filters?: MonitoringParams;
  onFilterChange?: (filters: MonitoringParams) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "MATCHED", label: "Matched" },
  { value: "MISMATCH", label: "Mismatch" },
  { value: "NEED_REVIEW", label: "Need Review" },
  { value: "RESOLVED", label: "Resolved" },
];

const PERIOD_OPTIONS = [
  { value: "", label: "Semua Periode" },
  { value: "day", label: "Daily" },
  { value: "hour", label: "Hourly" },
];

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isDeleting: boolean;
}

function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  itemName,
  isDeleting,
}: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <Trash2 className="w-6 h-6 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Konfirmasi Hapus
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            Apakah Anda yakin ingin menghapus record{" "}
            <span className="font-semibold text-gray-900">{itemName}</span>?
          </p>
          <p className="text-sm text-gray-600">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Text normalizer
// ---------------------------------------------------------------------------

const formatNormalizeText = (text: string) => {
  if (!text) return "-";
  if (text.toUpperCase() === "FLOWRATE_MMSCFD") return "Flowrate (MMSCFD)";
  if (text.toUpperCase() === "ENERGY_BBTUD") return "Energy (BBTUD)";
  
  return text
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    MATCHED: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    MISMATCH: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    NEED_REVIEW: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    RESOLVED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  };
  const c = config[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  };

  const label = config[status] ? status : formatNormalizeText(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------

const ActionButtons = ({
  id,
  onEdit,
  onDelete,
}: {
  id: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) => (
  <div className="flex items-center justify-center gap-1">
    <button
      onClick={() => onEdit(id)}
      className="p-1.5 text-[#115d72] hover:bg-[#115d72]/10 rounded-lg transition-colors"
      title="Edit"
    >
      <Pencil size={16} />
    </button>
    <button
      onClick={() => onDelete(id)}
      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      title="Hapus"
    >
      <Trash2 size={16} />
    </button>
    {/* <button
      onClick={() => console.log("Download", id)}
      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
      title="Download"
    >
      <Download size={16} />
    </button> */}
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditDataTable({
  records,
  pagination,
  isLoading,
  onPageChange,
  filters = {},
  onFilterChange,
}: EditDataTableProps) {
  const router = useRouter();

  // Server-side pagination mapping
  const totalItems = pagination.total || 0;
  const totalPages = Math.max(1, pagination.totalPages || 1);
  const apiPage = pagination.page || 1;
  const currentPage = apiPage - 1;
  const itemsPerPage = pagination.limit || 10;

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = records;

  // Sort state
  type SortField = keyof MonitoringRecord;
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      // New column → start ascending
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      // Same column, was asc → go desc
      setSortDir("desc");
    } else {
      // Same column, was desc → reset to default
      setSortField(null);
      setSortDir("asc");
    }
  };

  const sortedRecords = useMemo(() => {
    if (!sortField) return paginatedRecords;
    return [...paginatedRecords].sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [paginatedRecords, sortField, sortDir]);

  // Sort icon helper
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp size={12} className="ml-1 text-[#115d72]" />
      : <ArrowDown size={12} className="ml-1 text-[#115d72]" />;
  };

  // Sortable header helper
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
        field ? "cursor-pointer select-none hover:bg-gray-100 transition-colors" : ""
      }`}
      onClick={field ? () => handleSort(field) : undefined}
    >
      <span className="inline-flex items-center justify-center">
        {label}
        {field && <SortIcon field={field} />}
      </span>
    </th>
  );

  // 4-decimal formatter
  const fmt4 = (val: number | null | undefined): string => {
    if (val == null) return "-";
    return val.toFixed(4);
  };

  // Only show filter UI if the parent provides onFilterChange
  const filtersEnabled = !!onFilterChange;

  // Filter panel toggle
  const [showFilters, setShowFilters] = useState(false);

  // Local filter state (only applied on "Terapkan")
  const [localId, setLocalId] = useState(filters.id ?? "");
  const [localSupplierName, setLocalSupplierName] = useState(
    filters.supplierName ?? "",
  );
  const [localSiteName, setLocalSiteName] = useState(filters.siteName ?? "");
  const [localStartDate, setLocalStartDate] = useState(filters.startDate ?? "");
  const [localEndDate, setLocalEndDate] = useState(filters.endDate ?? "");
  const [localPeriodType, setLocalPeriodType] = useState(
    filters.periodType ?? "",
  );
  const [localStatus, setLocalStatus] = useState(filters.status ?? "");

  const activeFilterCount = [
    filters.id,
    filters.supplierName,
    filters.siteName,
    filters.startDate || filters.endDate,
    filters.periodType,
    filters.status,
  ].filter(Boolean).length;

  const handleApplyFilters = () => {
    onFilterChange?.({
      ...(localId ? { id: localId } : {}),
      ...(localSupplierName ? { supplierName: localSupplierName } : {}),
      ...(localSiteName ? { siteName: localSiteName } : {}),
      ...(localStartDate ? { startDate: localStartDate } : {}),
      ...(localEndDate ? { endDate: localEndDate } : {}),
      ...(localPeriodType ? { periodType: localPeriodType } : {}),
      ...(localStatus ? { status: localStatus } : {}),
    });
  };

  const handleResetFilters = () => {
    setLocalId("");
    setLocalSupplierName("");
    setLocalSiteName("");
    setLocalStartDate("");
    setLocalEndDate("");
    setLocalPeriodType("");
    setLocalStatus("");
    onFilterChange?.({});
  };

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState("");
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useDeleteMonitoringRecord();

  const handleDeleteClick = (id: string, name: string) => {
    setPendingDeleteId(id);
    setPendingDeleteName(name);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      setDeleteError(null);
      deleteMutation
        .mutateAsync(pendingDeleteId)
        .then(() => {
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
          setPendingDeleteName("");
          setShowDeleteSuccess(true);
          setTimeout(() => setShowDeleteSuccess(false), 3000);
        })
        .catch((err) => {
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
          setPendingDeleteName("");
          setDeleteError(err?.message || "Gagal menghapus data");
          setTimeout(() => setDeleteError(null), 5000);
        });
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName("");
  };

  return (
    <>
      {/* Success toast */}
      {showDeleteSuccess && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
          <CheckCircle2 size={18} />
          Data berhasil dihapus
        </div>
      )}

      {/* Error toast */}
      {deleteError && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle size={18} />
          {deleteError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <Menu size={20} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Tabel Monitoring Data
            </span>
          </div>
          <div className="flex items-center gap-2">
            {filtersEnabled && (
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                  showFilters || activeFilterCount > 0
                    ? "bg-[#115d72] text-white border-[#115d72]"
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
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {filtersEnabled && showFilters && (
          <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* ID filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  ID
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={localId}
                    onChange={(e) => setLocalId(e.target.value)}
                    placeholder="Cari berdasarkan ID..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Pemasok filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Pemasok
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={localSupplierName}
                    onChange={(e) => setLocalSupplierName(e.target.value)}
                    placeholder="Cari pemasok..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Pembangkit filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Pembangkit
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={localSiteName}
                    onChange={(e) => setLocalSiteName(e.target.value)}
                    placeholder="Cari pembangkit..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200 bg-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Mulai */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Tanggal Akhir */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Periode filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Periode
                </label>
                <select
                  value={localPeriodType}
                  onChange={(e) => setLocalPeriodType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200 bg-white"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter actions */}
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
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
              >
                <Search size={14} />
                Terapkan Filter
              </button>
            </div>
          </div>
        )}

        {/* Active filter tags */}
        {filtersEnabled && activeFilterCount > 0 && !showFilters && (
          <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">
              Filter aktif:
            </span>
            {filters.id && (
              <FilterTag
                label={`ID: ${filters.id}`}
                onRemove={() => {
                  setLocalId("");
                  onFilterChange?.({ ...filters, id: undefined });
                }}
              />
            )}
            {filters.supplierName && (
              <FilterTag
                label={`Pemasok: ${filters.supplierName}`}
                onRemove={() => {
                  setLocalSupplierName("");
                  onFilterChange?.({ ...filters, supplierName: undefined });
                }}
              />
            )}
            {filters.siteName && (
              <FilterTag
                label={`Pembangkit: ${filters.siteName}`}
                onRemove={() => {
                  setLocalSiteName("");
                  onFilterChange?.({ ...filters, siteName: undefined });
                }}
              />
            )}
            {(filters.startDate || filters.endDate) && (
              <FilterTag
                label={`Tanggal: ${filters.startDate || "..."} - ${filters.endDate || "..."}`}
                onRemove={() => {
                  setLocalStartDate("");
                  setLocalEndDate("");
                  onFilterChange?.({
                    ...filters,
                    startDate: undefined,
                    endDate: undefined,
                  });
                }}
              />
            )}
            {filters.periodType && (
              <FilterTag
                label={`Periode: ${filters.periodType}`}
                onRemove={() => {
                  setLocalPeriodType("");
                  onFilterChange?.({ ...filters, periodType: undefined });
                }}
              />
            )}
            {filters.status && (
              <FilterTag
                label={`Status: ${filters.status}`}
                onRemove={() => {
                  setLocalStatus("");
                  onFilterChange?.({ ...filters, status: undefined });
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

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th label="No" />
                <Th label="Tanggal" field="reportDate" />
                <Th label="Pemasok" field="supplierName" align="left" />
                <Th label="Pembangkit" field="siteName" align="left" />
                <Th label="Metrik" field="metricType" />
                <Th label="Periode" field="periodType" />
                <Th label="Jam" field="periodValue" />
                <Th label="Nilai Dari WA" field="waValue" />
                <Th label="Nilai Dari Email" field="plnValue" />
                <Th label="Nilai Final" field="finalValue" />
                <Th label="Delta" field="delta" />
                <Th label="Status" field="status" />
                <Th label="ID" />
                <Th label="Aksi" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={13}
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
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada data monitoring
                  </td>
                </tr>
              ) : (
                sortedRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-gray-700">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 whitespace-nowrap">
                      {record.reportDate}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {record.supplierName ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {record.siteName}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 whitespace-nowrap">
                      {formatNormalizeText(record.metricType)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {formatNormalizeText(record.periodType)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono text-xs">
                      {record.periodValue || "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono">
                      {fmt4(record.waValue)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono">
                      {fmt4(record.plnValue)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono font-medium">
                      {fmt4(record.finalValue)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono">
                      {fmt4(record.delta)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 font-medium">
                      {record.id}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ActionButtons
                        id={record.id}
                        onEdit={(id) => router.push(`/edit/${id}`)}
                        onDelete={(id) =>
                          handleDeleteClick(
                            id,
                            `${record.siteName} - ${record.reportDate}`,
                          )
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
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
                <label htmlFor="page-size" className="text-sm text-gray-500">
                  Baris:
                </label>
                <select
                  id="page-size"
                  value={itemsPerPage}
                  onChange={(e) => {
                    onPageChange(1, Number(e.target.value));
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb] transition-all duration-200"
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
                  onClick={() => onPageChange(apiPage - 1, itemsPerPage)}
                  disabled={currentPage === 0}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers (1-indexed for display) */}
                {(() => {
                  const pages: (number | "...")[] = [];
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
                        onClick={() => onPageChange(p as number, itemsPerPage)}
                        className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                          p === displayPage
                            ? "bg-[#115d72] text-white shadow-sm"
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
                  onClick={() => onPageChange(apiPage + 1, itemsPerPage)}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={pendingDeleteName}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Filter Tag component
// ---------------------------------------------------------------------------

function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#115d72]/10 text-[#115d72] rounded-full text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-[#115d72]/20 rounded-full p-0.5 transition-colors"
      >
        <X size={12} />
      </button>
    </span>
  );
}

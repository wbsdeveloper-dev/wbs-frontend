"use client";

import {
  Pencil,
  Trash2,
  Download,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
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
// Status badge (same pattern as SiteTable)
// ---------------------------------------------------------------------------

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    MATCH: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    MISMATCH: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    NEED_REVIEW: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    RESOLVED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  };
  const c = config[status] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
    dot: "bg-gray-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Action buttons (same pattern as SiteTable)
// ---------------------------------------------------------------------------

const ActionButtons = ({ id }: { id: string }) => (
  <div className="flex items-center justify-center gap-1">
    <button
      onClick={() => console.log("Edit", id)}
      className="p-1.5 text-[#115d72] hover:bg-[#115d72]/10 rounded-lg transition-colors"
      title="Edit"
    >
      <Pencil size={16} />
    </button>
    <button
      onClick={() => console.log("Delete", id)}
      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      title="Hapus"
    >
      <Trash2 size={16} />
    </button>
    <button
      onClick={() => console.log("Download", id)}
      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
      title="Download"
    >
      <Download size={16} />
    </button>
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
}: EditDataTableProps) {
  const startIndex = (pagination.page - 1) * pagination.limit;
  const totalPages = pagination.totalPages;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Table Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <Menu size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Tabel Monitoring Data
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari data..."
            className="w-48 md:w-56 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                No
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Pembangkit
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Metrik
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Periode
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                WA Value
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                PLN Value
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Final Value
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Delta
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={12}
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
                  colSpan={12}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Tidak ada data monitoring
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-center text-gray-700">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 font-medium">
                    {record.id}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {record.reportDate}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{record.siteName}</td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {record.metricType}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {record.periodType}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {record.waValue ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {record.plnValue ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {record.finalValue ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {record.delta ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ActionButtons id={record.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Menampilkan {startIndex + 1}-
            {Math.min(startIndex + pagination.limit, pagination.total)} dari{" "}
            {pagination.total} data
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onPageChange(pagination.page - 1, pagination.limit)
              }
              disabled={pagination.page <= 1}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-700">
              Halaman {pagination.page} dari {totalPages}
            </span>
            <button
              onClick={() =>
                onPageChange(pagination.page + 1, pagination.limit)
              }
              disabled={pagination.page >= totalPages}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

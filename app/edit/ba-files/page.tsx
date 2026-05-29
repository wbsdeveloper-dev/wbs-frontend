"use client";

import { useState, useMemo } from "react";
import { useBaFiles } from "@/hooks/service/monitoring-api";
import { DASHBOARD_API_HOST } from "@/hooks/service/dashboard-api";
import {
  Download,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

export default function BaFilesPage() {
  const { data: files, isLoading, error } = useBaFiles();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [localReportMonth, setLocalReportMonth] = useState("");
  const [localSupplierName, setLocalSupplierName] = useState("");
  const [localSiteName, setLocalSiteName] = useState("");

  const [filters, setFilters] = useState<{
    reportMonth: string;
    supplierName: string;
    siteName: string;
  }>({
    reportMonth: "",
    supplierName: "",
    siteName: "",
  });

  const activeFilterCount = [
    filters.reportMonth,
    filters.supplierName,
    filters.siteName,
  ].filter(Boolean).length;

  const handleApplyFilters = () => {
    setFilters({
      reportMonth: localReportMonth,
      supplierName: localSupplierName,
      siteName: localSiteName,
    });
    setPage(1); // Reset to first page
  };

  const handleResetFilters = () => {
    setLocalReportMonth("");
    setLocalSupplierName("");
    setLocalSiteName("");
    setFilters({
      reportMonth: "",
      supplierName: "",
      siteName: "",
    });
    setPage(1);
  };

  const FilterTag = ({
    label,
    onRemove,
  }: {
    label: string;
    onRemove: () => void;
  }) => (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#115d72]/10 text-[#115d72]">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-[#115d72]/20 rounded-full transition-colors"
      >
        <X size={12} />
      </button>
    </span>
  );

  // Client-side filtering
  const filteredFiles = useMemo(() => {
    if (!files) return [];
    return files.filter((f) => {
      if (
        filters.reportMonth &&
        !f.report_month
          ?.toLowerCase()
          .includes(filters.reportMonth.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.supplierName &&
        !f.supplier_name
          ?.toLowerCase()
          .includes(filters.supplierName.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.siteName &&
        !f.site_name?.toLowerCase().includes(filters.siteName.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [files, filters]);

  // Client-side pagination
  const totalItems = filteredFiles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              File Berita Acara
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Daftar file Berita Acara (BA) yang telah diunggah dan tersimpan di
              sistem.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table Header & Toggle Filter */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-1.5">
                <Menu size={20} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Tabel File Berita Acara
                </span>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
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
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Bulan
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={localReportMonth}
                        onChange={(e) => setLocalReportMonth(e.target.value)}
                        placeholder="Contoh: 11-2025"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]"
                      />
                    </div>
                  </div>
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
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]"
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
                        value={localSiteName}
                        onChange={(e) => setLocalSiteName(e.target.value)}
                        placeholder="Cari pembangkit..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    <X size={14} /> Reset
                  </button>
                  <button
                    onClick={handleApplyFilters}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200"
                  >
                    <Search size={14} /> Terapkan Filter
                  </button>
                </div>
              </div>
            )}

            {/* Active filter tags */}
            {activeFilterCount > 0 && !showFilters && (
              <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 flex-wrap bg-white">
                <span className="text-xs text-gray-500 font-medium">
                  Filter aktif:
                </span>
                {filters.reportMonth && (
                  <FilterTag
                    label={`Bulan: ${filters.reportMonth}`}
                    onRemove={() => {
                      setLocalReportMonth("");
                      setFilters((prev) => ({ ...prev, reportMonth: "" }));
                      setPage(1);
                    }}
                  />
                )}
                {filters.supplierName && (
                  <FilterTag
                    label={`Pemasok: ${filters.supplierName}`}
                    onRemove={() => {
                      setLocalSupplierName("");
                      setFilters((prev) => ({ ...prev, supplierName: "" }));
                      setPage(1);
                    }}
                  />
                )}
                {filters.siteName && (
                  <FilterTag
                    label={`Pembangkit: ${filters.siteName}`}
                    onRemove={() => {
                      setLocalSiteName("");
                      setFilters((prev) => ({ ...prev, siteName: "" }));
                      setPage(1);
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
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4 border-b border-gray-200">No</th>
                    <th className="px-6 py-4 border-b border-gray-200">
                      Bulan
                    </th>
                    <th className="px-6 py-4 border-b border-gray-200">
                      Pemasok
                    </th>
                    <th className="px-6 py-4 border-b border-gray-200">
                      Pembangkit
                    </th>
                    <th className="px-6 py-4 border-b border-gray-200">
                      Nama File
                    </th>
                    <th className="px-6 py-4 border-b border-gray-200 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <Loader2 className="animate-spin w-8 h-8 mx-auto mb-3 text-[#14a2bb]" />
                        <span className="font-medium">Memuat data...</span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-red-500 font-medium"
                      >
                        Gagal memuat data file BA. Silakan coba lagi.
                      </td>
                    </tr>
                  ) : paginatedFiles.length > 0 ? (
                    paginatedFiles.map((file, index) => {
                      const rootUrl = DASHBOARD_API_HOST.replace(/\/api$/, "");
                      const cleanFilePath = file.file_path.replace(/^\//, "");
                      const fileUrl = `${rootUrl}/${cleanFilePath}`;

                      return (
                        <tr
                          key={file.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-700">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                            {file.report_month}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {file.supplier_name || "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {file.site_name || "-"}
                          </td>
                          <td
                            className="px-6 py-4 text-gray-500 font-mono text-xs max-w-[200px] sm:max-w-[300px] truncate"
                            title={file.filename}
                          >
                            {file.filename}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#115d72] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <ExternalLink size={16} /> Preview
                              </a>
                              <a
                                href={fileUrl}
                                download={file.filename}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] shadow-sm transition-colors"
                              >
                                <Download size={16} /> Unduh
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-400 mb-2">
                          <ExternalLink
                            size={40}
                            className="mx-auto opacity-50"
                          />
                        </div>
                        <p className="text-gray-500 font-medium">
                          Belum ada file Berita Acara yang sesuai filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-t border-gray-200 gap-3 bg-white">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-600">
                    Menampilkan{" "}
                    <span className="font-semibold text-gray-900">
                      {startIndex + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold text-gray-900">
                      {Math.min(endIndex, totalItems)}
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold text-gray-900">
                      {totalItems}
                    </span>{" "}
                    data
                  </span>
                  <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Tampilkan:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] bg-white cursor-pointer"
                    >
                      {[10, 25, 50, 100].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-medium text-gray-700 px-3">
                    Hal <span className="font-semibold">{page}</span> dari{" "}
                    {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

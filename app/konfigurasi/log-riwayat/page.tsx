"use client";

import { useState, useMemo, useCallback } from "react";
import {
  History,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Download,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  FileDown,
  Settings,
  Eye,
  AlertCircle,
  CheckCircle2,
  Info,
  Menu,
} from "lucide-react";
import {
  useActivityLogs,
  type ActivityLog,
  type ActivityLogsParams,
} from "@/hooks/service/use-activity-logs";

// ── Action badge config ──────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  LOGIN: {
    label: "Login",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: <LogIn className="w-3 h-3" />,
  },
  LOGOUT: {
    label: "Logout",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <LogOut className="w-3 h-3" />,
  },
  CREATE: {
    label: "Buat",
    color: "bg-blue-50 text-blue-800 border-blue-200",
    icon: <Plus className="w-3 h-3" />,
  },
  UPDATE: {
    label: "Ubah",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    icon: <Pencil className="w-3 h-3" />,
  },
  DELETE: {
    label: "Hapus",
    color: "bg-red-50 text-red-800 border-red-200",
    icon: <Trash2 className="w-3 h-3" />,
  },
  DOWNLOAD: {
    label: "Unduh",
    color: "bg-purple-50 text-purple-800 border-purple-200",
    icon: <Download className="w-3 h-3" />,
  },
  EXPORT: {
    label: "Ekspor",
    color: "bg-violet-50 text-violet-800 border-violet-200",
    icon: <FileDown className="w-3 h-3" />,
  },
  CONFIG_CHANGE: {
    label: "Konfigurasi",
    color: "bg-orange-50 text-orange-800 border-orange-200",
    icon: <Settings className="w-3 h-3" />,
  },
  VIEW: {
    label: "Lihat",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    icon: <Eye className="w-3 h-3" />,
  },
};

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? {
    label: action,
    color: "bg-gray-50 text-gray-700 border-gray-200",
    icon: <Info className="w-3 h-3" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "SUCCESS") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        Berhasil
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
      <AlertCircle className="w-3 h-3" />
      Gagal
    </span>
  );
}

// ── Resource label mapping ───────────────────────────────────────────────────

const RESOURCE_LABELS: Record<string, string> = {
  auth: "Autentikasi",
  user: "Pengguna",
  role: "Peran & Hak Akses",
  email_source: "Email Source",
  spreadsheet_source: "Spreadsheet Source",
  system_config: "Pengaturan Sistem",
  template: "Template",
  reconciliation_data: "Data Rekonsiliasi",
  monitoring: "Monitoring",
  bbm_monthly: "Data BBM Bulanan",
  kertas_kerja: "Kertas Kerja",
  transportir: "Transportir",
  notification: "Notifikasi",
  export: "Ekspor",
  api_key: "API Key",
  config: "Konfigurasi",
  ocr: "OCR",
};

// ── CSV export ───────────────────────────────────────────────────────────────

function exportToCSV(logs: ActivityLog[]) {
  const headers = [
    "Waktu",
    "Pengguna",
    "Aksi",
    "Resource",
    "Resource ID",
    "Deskripsi",
    "IP",
    "Status",
  ];
  const rows = logs.map((l) => [
    new Date(l.created_at).toLocaleString("id-ID"),
    l.user_email ?? "-",
    l.action,
    RESOURCE_LABELS[l.resource] ?? l.resource,
    l.resource_id ?? "-",
    l.description ?? "-",
    l.ip_address ?? "-",
    l.status,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page Component ───────────────────────────────────────────────────────────

export default function LogRiwayatPage() {
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params: ActivityLogsParams = useMemo(() => {
    const p: ActivityLogsParams = { page, limit: pageSize };
    if (searchEmail.trim()) p.userEmail = searchEmail.trim();
    if (actionFilter !== "all") p.action = actionFilter;
    if (resourceFilter !== "all") p.resource = resourceFilter;
    if (statusFilter !== "all") p.status = statusFilter;
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    return p;
  }, [page, pageSize, searchEmail, actionFilter, resourceFilter, statusFilter, startDate, endDate]);

  const { data, isLoading, isError, refetch } = useActivityLogs(params);

  const logs = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 1 };

  const activeFilterCount = [
    searchEmail,
    actionFilter !== "all" ? actionFilter : "",
    resourceFilter !== "all" ? resourceFilter : "",
    statusFilter !== "all" ? statusFilter : "",
    startDate || endDate,
  ].filter(Boolean).length;

  const handleResetFilters = useCallback(() => {
    setSearchEmail("");
    setActionFilter("all");
    setResourceFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }, []);


  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>Dashboard</span>
              <span className="text-gray-400">/</span>
              <span>Konfigurasi Sistem</span>
              <span className="text-gray-400">/</span>
              <span className="text-primary font-medium">Log Riwayat</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <History className="w-7 h-7 text-primary" />
                  Log Riwayat Aktivitas
                </h1>
                <p className="text-gray-500 mt-1 text-sm">
                  Riwayat seluruh aktivitas pengguna dalam sistem. Data disimpan
                  selama{" "}
                  <span className="font-semibold text-gray-700">1 tahun</span>{" "}
                  dari tanggal kejadian.
                </p>
              </div>
              <button
                onClick={() => exportToCSV(logs)}
                disabled={logs.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Ekspor CSV
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table header toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-1.5">
                <Menu size={20} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Tabel Log Riwayat Aktivitas
                </span>
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (Total {pagination?.total || 0} record ditemukan)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 cursor-pointer ${
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
                    className={`transition-transform duration-200 ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  {/* Search Email filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Cari Email / Pengguna
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchEmail}
                        onChange={(e) => {
                          setSearchEmail(e.target.value);
                          setPage(1);
                        }}
                        placeholder="Cari email pengguna..."
                        className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                      />
                      {searchEmail && (
                        <button
                          onClick={() => {
                            setSearchEmail("");
                            setPage(1);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Jenis Aksi
                    </label>
                    <select
                      value={actionFilter}
                      onChange={(e) => {
                        setActionFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                    >
                      <option value="all">Semua Aksi</option>
                      <option value="LOGIN">Login</option>
                      <option value="LOGOUT">Logout</option>
                      <option value="CREATE">Buat (Create)</option>
                      <option value="UPDATE">Ubah (Update)</option>
                      <option value="DELETE">Hapus (Delete)</option>
                      <option value="DOWNLOAD">Unduh (Download)</option>
                      <option value="EXPORT">Ekspor (Export)</option>
                      <option value="CONFIG_CHANGE">Konfigurasi</option>
                    </select>
                  </div>

                  {/* Resource filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Modul / Resource
                    </label>
                    <select
                      value={resourceFilter}
                      onChange={(e) => {
                        setResourceFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                    >
                      <option value="all">Semua Modul</option>
                      <option value="auth">Autentikasi</option>
                      <option value="user">Pengguna</option>
                      <option value="role">Peran & Hak Akses</option>
                      <option value="reconciliation_data">Data Rekonsiliasi</option>
                      <option value="email_source">Email Source</option>
                      <option value="spreadsheet_source">Spreadsheet Source</option>
                      <option value="template">Template</option>
                      <option value="system_config">Pengaturan Sistem</option>
                      <option value="bbm_monthly">Data BBM Bulanan</option>
                      <option value="kertas_kerja">Kertas Kerja</option>
                      <option value="transportir">Transportir</option>
                      <option value="export">Ekspor</option>
                      <option value="api_key">API Key</option>
                    </select>
                  </div>

                  {/* Status filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                    >
                      <option value="all">Semua Status</option>
                      <option value="SUCCESS">Berhasil</option>
                      <option value="FAILED">Gagal</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Dari Tanggal
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Sampai Tanggal
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Reset Action */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <button
                      onClick={handleResetFilters}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                    >
                      <RotateCcw size={14} /> Reset Filter
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Retention notice */}
            <div className="px-4 py-2 border-b border-gray-100 bg-amber-50/60 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800 font-medium">
                Log aktivitas disimpan selama <strong>1 tahun</strong>. Log yang
                lebih lama akan dihapus secara otomatis oleh sistem.
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap w-[170px]">
                      Waktu
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider w-[200px]">
                      Pengguna
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider w-[120px]">
                      Aksi
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider w-[140px]">
                      Modul
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[220px]">
                      Deskripsi
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider w-[120px]">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-[90px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                        <p className="text-sm text-gray-500 font-medium">
                          Memuat riwayat aktivitas...
                        </p>
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-400" />
                        <p className="text-sm text-red-600 font-medium">
                          Gagal memuat data. Silakan coba lagi.
                        </p>
                        <button
                          onClick={() => refetch()}
                          className="mt-2 text-xs text-primary font-semibold hover:underline cursor-pointer"
                        >
                          Coba Lagi
                        </button>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <History className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-500 font-medium">
                          Tidak ada log aktivitas yang cocok dengan filter yang dipilih.
                        </p>
                        {activeFilterCount > 0 && (
                          <button
                            onClick={handleResetFilters}
                            className="mt-2 text-xs text-primary font-semibold hover:underline cursor-pointer"
                          >
                            Reset Filter
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log: ActivityLog) => (
                      <tr
                        key={log.id}
                        className={`hover:bg-gray-50/60 transition-colors ${
                          log.status === "FAILED" ? "bg-red-50/20" : ""
                        }`}
                      >
                        {/* Waktu */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-gray-800">
                              {new Date(log.created_at).toLocaleDateString(
                                "id-ID",
                                { day: "2-digit", month: "short", year: "numeric" },
                              )}
                            </span>
                            <span className="text-gray-400 font-mono">
                              {new Date(log.created_at).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit", second: "2-digit" },
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Pengguna */}
                        <td className="px-4 py-3">
                          <span
                            className="text-sm font-medium text-gray-900 truncate block max-w-[190px]"
                            title={log.user_email ?? undefined}
                          >
                            {log.user_email ?? (
                              <span className="text-gray-400 italic">Tidak Dikenal</span>
                            )}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3">
                          <ActionBadge action={log.action} />
                        </td>

                        {/* Modul */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                            {RESOURCE_LABELS[log.resource] ?? log.resource}
                          </span>
                        </td>

                        {/* Deskripsi */}
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span
                            className="truncate block max-w-[280px]"
                            title={log.description ?? undefined}
                          >
                            {log.description ?? "-"}
                          </span>
                        </td>

                        {/* IP */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-gray-600">
                            {log.ip_address ?? "-"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={log.status} />
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
                    {pagination.total > 0 ? (
                      <>
                        {(pagination.page - 1) * pagination.limit + 1}-
                        {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
                        {pagination.total}
                      </>
                    ) : (
                      "0"
                    )}{" "}
                    data
                  </span>
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="page-size-logs" className="text-sm text-gray-500">
                      Baris:
                    </label>
                    <select
                      id="page-size-logs"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
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
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {/* Previous */}
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page numbers */}
                    {(() => {
                      const totalPages = pagination.totalPages;
                      const current = pagination.page;
                      const pages: (number | "...")[] = [];
                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        if (current > 3) pages.push("...");
                        const start = Math.max(2, current - 1);
                        const end = Math.min(totalPages - 1, current + 1);
                        for (let i = start; i <= end; i++) pages.push(i);
                        if (current < totalPages - 2) pages.push("...");
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
                            onClick={() => setPage(p as number)}
                            className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                              p === current
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
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

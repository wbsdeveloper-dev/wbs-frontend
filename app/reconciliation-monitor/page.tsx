"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  FileText,
  MessageSquare,
  Mail,
  Table,
  UserCheck,
  CheckCheck,
  Search,
  Filter,
  Eye,
  X,
  Activity,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Card, { CardHeader } from "@/app/components/ui/Card";
import {
  useReconciliationJobs,
  useDeleteReconciliationJob,
  useDeleteReconciliationJobsBulk,
  type ReconciliationJob,
  type ReconciliationJobsParams,
} from "@/hooks/service/use-reconciliation-jobs";
import { usePrivilege } from "@/hooks/usePrivilege";

export default function ReconciliationMonitorPage() {
  const { hasPrivilege } = usePrivilege();
  const canRead = hasPrivilege("monitor_rekonsiliasi_gas", "READ");
  const canDelete = hasPrivilege("monitor_rekonsiliasi_gas", "DELETE");
  const deleteJobMutation = useDeleteReconciliationJob();
  const bulkDeleteJobsMutation = useDeleteReconciliationJobsBulk();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [siteSearch, setSiteSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [selectedJob, setSelectedJob] = useState<ReconciliationJob | null>(null);
  const [jobToDelete, setJobToDelete] = useState<ReconciliationJob | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const queryParams: ReconciliationJobsParams = {
    page,
    limit,
    status: statusFilter !== "all" ? statusFilter : undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    siteName: siteSearch.trim() || undefined,
    supplierName: supplierSearch.trim() || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data, isLoading, isRefetching, refetch } = useReconciliationJobs(
    queryParams,
    { refetchInterval: autoRefresh ? 3000 : false },
  );

  const items = data?.items || [];
  const summary = data?.summaryCounts || {
    pending: 0,
    running: 0,
    retryWait: 0,
    done: 0,
    failed: 0,
    totalJobs: 0,
  };
  const pagination = data?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  // Helper to extract Pembangkit name
  const extractSiteName = (job: ReconciliationJob): string => {
    const payload = job.payload || {};
    return (
      payload.site_name ||
      payload.siteName ||
      payload.pembangkit ||
      payload.site_id ||
      "-"
    );
  };

  // Helper to extract Pemasok name
  const extractSupplierName = (job: ReconciliationJob): string => {
    const payload = job.payload || {};
    return (
      payload.supplier_name ||
      payload.supplierName ||
      payload.supplier ||
      payload.pemasok ||
      payload.supplier_id ||
      "-"
    );
  };

  // Helper to extract report date / period
  const extractPeriod = (job: ReconciliationJob): string => {
    const payload = job.payload || {};
    return (
      payload.report_date ||
      payload.reportDate ||
      payload.period_value ||
      (job.created_at
        ? new Date(job.created_at).toLocaleDateString("id-ID")
        : "-")
    );
  };

  const handleConfirmDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      setIsDeleting(true);
      await deleteJobMutation.mutateAsync(jobToDelete.id);
      if (selectedJob?.id === jobToDelete.id) {
        setSelectedJob(null);
      }
      setJobToDelete(null);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus activity rekonsiliasi");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedJobIds.length === items.length && items.length > 0) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(items.map((job) => job.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDeleteJob = async () => {
    if (selectedJobIds.length === 0) return;
    try {
      setIsBulkDeleting(true);
      await bulkDeleteJobsMutation.mutateAsync(selectedJobIds);
      setSelectedJobIds([]);
      setIsBulkDeleteModalOpen(false);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus activity rekonsiliasi terpilih");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Helper to resolve Source Badge
  const getSourceBadge = (job: ReconciliationJob) => {
    const src = (job.event_source_type || job.job_type || "").toUpperCase();
    const payloadSrc = (
      (job.payload?.final_source as string) || ""
    ).toUpperCase();

    if (src.includes("WA") || src.includes("WHATSAPP")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-md">
          <MessageSquare className="w-3.5 h-3.5" />
          WhatsApp
        </span>
      );
    }
    if (src.includes("EMAIL") || src.includes("PLN")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-md">
          <Mail className="w-3.5 h-3.5" />
          Email PLN
        </span>
      );
    }
    if (src.includes("SHEET") || src.includes("SPREADSHEET")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-md">
          <Table className="w-3.5 h-3.5" />
          Spreadsheet
        </span>
      );
    }
    if (src.includes("MANUAL") || payloadSrc.includes("MANUAL")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-md">
          <FileText className="w-3.5 h-3.5" />
          Input Manual
        </span>
      );
    }
    if (src.includes("BA") || payloadSrc.includes("BA")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold rounded-md">
          <UserCheck className="w-3.5 h-3.5" />
          Validasi BA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-md">
        <Activity className="w-3.5 h-3.5" />
        {src || "Sistem"}
      </span>
    );
  };

  // Helper to resolve Status Badge
  const getStatusBadge = (status: string) => {
    const st = status.toUpperCase();
    switch (st) {
      case "RUNNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full animate-pulse">
            <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            Sedang Diproses
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            Dalam Antrian
          </span>
        );
      case "RETRY_WAIT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
            <RotateCw className="w-3.5 h-3.5 text-amber-600" />
            Menunggu Retry
          </span>
        );
      case "DONE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Selesai
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            Gagal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Dashboard</span>
            <span className="text-gray-400">/</span>
            <span>Manajemen Data</span>
            <span className="text-gray-400">/</span>
            <span className="text-primary font-medium">Monitor Rekonsiliasi</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-secondary animate-pulse" />
            Monitor Proses Rekonsiliasi Real-Time
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau aktivitas pemrosesan & rekonsiliasi data dari WhatsApp, Email PLN, Spreadsheet, Manual, & Validasi BA secara *live*.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
            />
            <span>Live Auto-Refresh (3d)</span>
          </label>

          {canRead && (
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Sedang Diproses
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {summary.running}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <RotateCw className="w-5 h-5 animate-spin" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Dalam Antrian
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {summary.pending}
              </h3>
            </div>
            <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-400" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Menunggu Retry
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {summary.retryWait}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <RotateCw className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Selesai (Done)
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {summary.done}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                Gagal (Failed)
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {summary.failed}
              </h3>
            </div>
            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden flex flex-col">
        <CardHeader
          title="Daftar Aktivitas Pemrosesan Rekonsiliasi"
          description="Rincian status proses rekonsiliasi data dari semua sumber beserta detail Pembangkit dan Pemasok"
          action={
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Filter Sumber Data */}
              {canRead && (
                <>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md text-xs">
                    <Filter className="w-3 h-3 text-gray-400" />
                    <span className="font-semibold text-gray-600">Sumber:</span>
                    <select
                      value={sourceFilter}
                      onChange={(e) => {
                        setSourceFilter(e.target.value);
                        setPage(1);
                      }}
                      className="bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="all">Semua</option>
                      <option value="WA">WhatsApp</option>
                      <option value="EMAIL">Email PLN</option>
                      <option value="SPREADSHEET">Spreadsheet</option>
                      <option value="MANUAL">Manual</option>
                      <option value="BA">BA</option>
                    </select>
                  </div>

                  {/* Filter Status */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md text-xs">
                    <Filter className="w-3 h-3 text-gray-400" />
                    <span className="font-semibold text-gray-600">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="all">Semua</option>
                      <option value="RUNNING">Running</option>
                      <option value="PENDING">Pending</option>
                      <option value="RETRY_WAIT">Retry</option>
                      <option value="DONE">Done</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>

                  {/* Text Search Pembangkit */}
                  <div className="relative">
                    <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Pembangkit..."
                      value={siteSearch}
                      onChange={(e) => {
                        setSiteSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-6 pr-2 py-1 text-xs border border-gray-200 rounded-md text-gray-800 focus:outline-none focus:ring-1 focus:ring-secondary w-28"
                    />
                  </div>

                  {/* Text Search Pemasok */}
                  <div className="relative">
                    <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Pemasok..."
                      value={supplierSearch}
                      onChange={(e) => {
                        setSupplierSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-6 pr-2 py-1 text-xs border border-gray-200 rounded-md text-gray-800 focus:outline-none focus:ring-1 focus:ring-secondary w-28"
                    />
                  </div>
                </>
              )}

              {/* Bulk Delete Button */}
              {canDelete && selectedJobIds.length > 0 && (
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-all animate-fadeIn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus ({selectedJobIds.length})
                </button>
              )}
            </div>
          }
        />

        <div className="overflow-x-auto border-t border-gray-100 mt-2">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium text-xs">
              <tr>
                {canDelete && (
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedJobIds.length === items.length && items.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
                      title="Pilih Semua di Halaman Ini"
                    />
                  </th>
                )}
                <th className="px-4 py-3">Waktu dibuat</th>
                <th className="px-4 py-3">Sumber Data</th>
                <th className="px-4 py-3">Pembangkit (Site)</th>
                <th className="px-4 py-3">Pemasok (Supplier)</th>
                <th className="px-4 py-3">Periode Data</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Attempt</th>
                <th className="px-4 py-3">Pesan Error / Status Log</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={canDelete ? 10 : 9} className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-300" />
                    Memuat data monitor rekonsiliasi...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 10 : 9} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                      Tidak ada proses rekonsiliasi yang sesuai dengan filter.
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((job) => (
                  <tr
                    key={job.id}
                    className={`hover:bg-gray-50/60 transition-colors ${selectedJobIds.includes(job.id) ? "bg-red-50/30" : ""
                      }`}
                  >
                    {canDelete && (
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedJobIds.includes(job.id)}
                          onChange={() => handleToggleSelectRow(job.id)}
                          className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-gray-800">
                          {new Date(job.created_at).toLocaleDateString("id-ID")}
                        </span>
                        <span className="text-gray-400 font-mono">
                          {new Date(job.created_at).toLocaleTimeString("id-ID")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getSourceBadge(job)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {extractSiteName(job)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {extractSupplierName(job)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {extractPeriod(job)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-xs text-gray-700">
                      {job.attempt_count}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-xs text-red-600 font-mono" title={job.last_error || ""}>
                      {job.last_error ? job.last_error : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canRead && (
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-secondary bg-teal-50 hover:bg-teal-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setJobToDelete(job)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                            title="Hapus Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-t border-gray-200 gap-3 bg-white mt-auto">
            {/* Left: info + page size */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">
                Menampilkan{" "}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * limit + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(page * limit, pagination.total)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-gray-900">
                  {pagination.total}
                </span>{" "}
                proses
              </span>
              <div className="flex items-center gap-1.5">
                <label htmlFor="page-size-jobs" className="text-sm text-gray-500">
                  Baris:
                </label>
                <select
                  id="page-size-jobs"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all duration-200 cursor-pointer"
                >
                  {[10, 20, 50, 100].map((size) => (
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
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>

                {(() => {
                  const pages: (number | "...")[] = [];
                  const totalPages = pagination.totalPages;
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (page > 3) pages.push("...");
                    const start = Math.max(2, page - 1);
                    const end = Math.min(totalPages - 1, page + 1);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (page < totalPages - 2) pages.push("...");
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
                        className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${p === page
                            ? "bg-primary text-white shadow-sm"
                            : "text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        {p}
                      </button>
                    ),
                  );
                })()}

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modal Detail Payload & Error Log */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-secondary" />
                <h3 className="font-bold text-gray-900 text-lg">
                  Detail Job Rekonsiliasi
                </h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg text-xs">
                <div>
                  <span className="text-gray-500">ID Job:</span>
                  <p className="font-mono font-medium text-gray-800 break-all">
                    {selectedJob.id}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Tipe Job:</span>
                  <p className="font-medium text-gray-800">{selectedJob.job_type}</p>
                </div>
                <div>
                  <span className="text-gray-500">Dedup Key:</span>
                  <p className="font-mono text-gray-800 break-all">{selectedJob.dedup_key}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="mt-0.5">{getStatusBadge(selectedJob.status)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Attempt Count:</span>
                  <p className="font-semibold text-gray-800">{selectedJob.attempt_count}</p>
                </div>
                <div>
                  <span className="text-gray-500">Next Retry At:</span>
                  <p className="font-mono text-gray-800">
                    {selectedJob.next_retry_at
                      ? new Date(selectedJob.next_retry_at).toLocaleString("id-ID")
                      : "-"}
                  </p>
                </div>
              </div>

              {selectedJob.last_error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Error Trace / Failure Reason
                  </h4>
                  <pre className="text-xs text-red-700 font-mono whitespace-pre-wrap break-all bg-white/70 p-2.5 rounded border border-red-100">
                    {selectedJob.last_error}
                  </pre>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Payload Metadata (JSON)
                </h4>
                <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-60">
                  {selectedJob.payload
                    ? JSON.stringify(selectedJob.payload, null, 2)
                    : "{}"}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              {canDelete ? (
                <button
                  onClick={() => setJobToDelete(selectedJob)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Activity Ini
                </button>
              ) : <div />}
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-red-50/50">
              <div className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">
                  Hapus Activity Rekonsiliasi
                </h3>
              </div>
              <button
                onClick={() => setJobToDelete(null)}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-700">
                Apakah Anda yakin ingin menghapus activity rekonsiliasi ini dari antrean/monitor?
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1.5 font-mono text-gray-700">
                <div>
                  <span className="font-semibold text-gray-500">ID Job:</span> {jobToDelete.id}
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Pembangkit:</span> {extractSiteName(jobToDelete)}
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Status:</span> {jobToDelete.status}
                </div>
                {jobToDelete.last_error && (
                  <div className="text-red-600 font-sans mt-1">
                    <span className="font-semibold">Error:</span> {jobToDelete.last_error}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Tindakan ini akan menghapus data job dari database secara permanen.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setJobToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeleteJob}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Ya, Hapus Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-red-50/50">
              <div className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">
                  Konfirmasi Hapus Massal ({selectedJobIds.length} Job)
                </h3>
              </div>
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isBulkDeleting}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-700">
                Apakah Anda yakin ingin menghapus <span className="font-bold text-red-600">{selectedJobIds.length} activity rekonsiliasi</span> yang terpilih?
              </p>
              <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-xs text-red-700">
                Tindakan ini akan menghapus semua job terpilih secara permanen dari antrean dan monitor rekonsiliasi.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBulkDeleteJob}
                disabled={isBulkDeleting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Ya, Hapus {selectedJobIds.length} Activity
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

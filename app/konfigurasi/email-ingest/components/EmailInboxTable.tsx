"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Paperclip,
  Loader2,
  Eye,
  Download,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import {
  useGetEmailInbox,
  downloadEmailAttachment,
  previewEmailAttachment,
  useDeleteEmailInbox,
  useDeleteEmailInboxBulk,
  type EmailInboxRecord,
} from "@/hooks/service/config-api";
import { usePrivilege } from "@/hooks/usePrivilege";

export default function EmailInboxTable() {
  const { data: inbox = [], isLoading, isError, refetch } = useGetEmailInbox();
  const { hasPrivilege } = usePrivilege();
  const canDelete =
    hasPrivilege("email_ingest_gas", "DELETE") ||
    hasPrivilege("data_input_gas", "DELETE");

  const deleteSingleMutation = useDeleteEmailInbox();
  const deleteBulkMutation = useDeleteEmailInboxBulk();

  const [downloadingRef, setDownloadingRef] = useState<string | null>(null);
  const [previewingRef, setPreviewingRef] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailToDelete, setEmailToDelete] = useState<EmailInboxRecord | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [ruleFilter, setRuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleDownload = async (storageRef: string, filename: string) => {
    try {
      setDownloadingRef(storageRef);
      await downloadEmailAttachment(storageRef, filename);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengunduh file");
    } finally {
      setDownloadingRef(null);
    }
  };

  const handlePreview = async (storageRef: string, filename: string) => {
    try {
      setPreviewingRef(storageRef);
      await previewEmailAttachment(storageRef, filename);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memuat pratinjau file");
    } finally {
      setPreviewingRef(null);
    }
  };

  // Unique Rule Names for dropdown
  const uniqueRules = useMemo(() => {
    const rules = new Set<string>();
    inbox.forEach((item) => {
      if (item.source_name) rules.add(item.source_name);
    });
    return Array.from(rules);
  }, [inbox]);

  // Filtered Inbox Data
  const filteredInbox = useMemo(() => {
    return inbox.filter((email) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSubject = email.subject?.toLowerCase().includes(q);
        const matchSender = email.sender?.toLowerCase().includes(q);
        const matchAttachment = email.attachment_refs?.some((a) =>
          a.filename.toLowerCase().includes(q)
        );
        if (!matchSubject && !matchSender && !matchAttachment) return false;
      }

      if (ruleFilter !== "all") {
        if (ruleFilter === "tanpa_rule") {
          if (email.source_name) return false;
        } else if (email.source_name !== ruleFilter) {
          return false;
        }
      }

      if (statusFilter !== "all") {
        if (statusFilter === "processed" && !email.is_processed) return false;
        if (statusFilter === "pending" && email.is_processed) return false;
      }

      if (startDate) {
        const emailDate = new Date(email.received_at).toISOString().split("T")[0];
        if (emailDate < startDate) return false;
      }

      if (endDate) {
        const emailDate = new Date(email.received_at).toISOString().split("T")[0];
        if (emailDate > endDate) return false;
      }

      return true;
    });
  }, [inbox, searchQuery, ruleFilter, statusFilter, startDate, endDate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, ruleFilter, statusFilter, startDate, endDate, pageSize]);

  // Pagination Computations
  const totalItems = filteredInbox.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedInbox = useMemo(() => {
    return filteredInbox.slice(startIndex, startIndex + pageSize);
  }, [filteredInbox, startIndex, pageSize]);

  const activeFilterCount = [
    searchQuery,
    ruleFilter !== "all" ? ruleFilter : "",
    statusFilter !== "all" ? statusFilter : "",
    startDate || endDate,
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchQuery("");
    setRuleFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedInbox.length && paginatedInbox.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedInbox.map((item) => item.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmDeleteSingle = async () => {
    if (!emailToDelete) return;
    try {
      setIsDeleting(true);
      await deleteSingleMutation.mutateAsync(emailToDelete.id);
      setSelectedIds((prev) => prev.filter((id) => id !== emailToDelete.id));
      setEmailToDelete(null);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus email");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsDeleting(true);
      await deleteBulkMutation.mutateAsync(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus email terpilih");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-emerald-500" />
        <p>Memuat data email masuk...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Gagal memuat data email masuk. Silakan coba lagi.</p>
      </div>
    );
  }

  if (inbox.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-50/50 rounded-lg border border-slate-200 border-dashed">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Paperclip className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-medium text-slate-900">Belum ada email masuk</h3>
        <p className="mt-1 text-sm text-slate-500">
          Email yang berhasil di-fetch oleh worker akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fadeIn">
      {/* Table Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1.5">
          <Menu size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Data Email & Attachment
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Search filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Cari Subjek / Pengirim
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari subjek, pengirim, atau file..."
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Rule Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Nama Rule
              </label>
              <select
                value={ruleFilter}
                onChange={(e) => setRuleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
              >
                <option value="all">Semua Rule</option>
                <option value="tanpa_rule">Tanpa Rule</option>
                {uniqueRules.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Diproses Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Status Diproses
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
              >
                <option value="all">Semua Status</option>
                <option value="processed">Processed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Reset Filters */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                title="Reset semua filter"
              >
                <RotateCcw size={14} /> Reset Filter
              </button>
            </div>
          )}
        </div>
      )}

      <div className="p-4 md:p-6 space-y-3">

      {/* Top Toolbar for Bulk Actions */}
      {canDelete && selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-2.5 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
          <span className="text-xs font-semibold text-red-800">
            {selectedIds.length} email terpilih
          </span>
          <button
            onClick={() => setIsBulkDeleteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus ({selectedIds.length}) Email Terpilih
          </button>
        </div>
      )}

      {/* Main Table */}
      {filteredInbox.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Tidak ada data email yang cocok dengan filter yang dipilih.</p>
          <button
            onClick={handleResetFilters}
            className="mt-2 text-xs font-semibold text-secondary hover:underline cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {canDelete && (
                    <th className="px-3 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedInbox.length && paginatedInbox.length > 0}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
                        title="Pilih Semua Email Halaman Ini"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-xs font-bold text-gray-900 uppercase tracking-wider w-[180px]">Waktu Diterima</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-900 uppercase tracking-wider">Nama Rule</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-900 uppercase tracking-wider">Pengirim</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-900 uppercase tracking-wider min-w-[220px]">Subjek</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-900 uppercase tracking-wider text-center w-[130px]">Status Diproses</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-900 uppercase tracking-wider text-right w-[150px]">Attachment</th>
                  {canDelete && (
                    <th className="px-4 py-3 text-xs font-bold text-gray-900 uppercase tracking-wider text-center w-[90px]">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedInbox.map((email: EmailInboxRecord) => (
                  <tr
                    key={email.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedIds.includes(email.id) ? "bg-red-50/30" : ""
                    }`}
                  >
                    {canDelete && (
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(email.id)}
                          onChange={() => handleToggleSelectRow(email.id)}
                          className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium whitespace-nowrap">
                      {new Date(email.received_at)
                        .toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        .replace(/\./g, ":")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                        {email.source_name || "Tanpa Rule"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      <span className="truncate block max-w-[200px]" title={email.sender}>
                        {email.sender.replace(/<.*>/, "").trim() || email.sender}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {email.subject || "(Tanpa Subjek)"}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {email.is_processed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Processed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {email.attachment_refs && email.attachment_refs.length > 0 ? (
                        <div className="flex flex-col items-end gap-1.5">
                          {email.attachment_refs.map((att, idx) => {
                            const isDownloading = downloadingRef === att.storageRef;
                            const isPreviewing = previewingRef === att.storageRef;
                            return (
                              <div key={idx} className="flex items-center gap-1.5 justify-end w-full max-w-[280px]">
                                <span
                                  className="text-xs font-medium text-gray-800 truncate flex-grow text-left"
                                  title={att.filename}
                                >
                                  {att.filename}
                                </span>
                                <button
                                  onClick={() => handlePreview(att.storageRef, att.filename)}
                                  disabled={downloadingRef !== null || previewingRef !== null}
                                  className="p-1 rounded bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 transition-colors cursor-pointer"
                                  title="Pratinjau"
                                >
                                  {isPreviewing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-700" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDownload(att.storageRef, att.filename)}
                                  disabled={downloadingRef !== null || previewingRef !== null}
                                  className="p-1 rounded bg-green-50 text-green-800 border border-green-300 hover:bg-green-100 hover:text-green-900 disabled:opacity-50 transition-colors cursor-pointer"
                                  title="Unduh"
                                >
                                  {isDownloading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-green-800" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    {canDelete && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setEmailToDelete(email)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-200 cursor-pointer inline-flex items-center"
                          title="Hapus Email"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm gap-3">
            {/* Info & Page Size */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-gray-700">
                Menampilkan{" "}
                {totalItems > 0 ? (
                  <>
                    <span className="font-bold text-gray-900">{startIndex + 1}</span>-
                    <span className="font-bold text-gray-900">{endIndex}</span> dari{" "}
                    <span className="font-bold text-gray-900">{totalItems}</span>
                  </>
                ) : (
                  "0"
                )}{" "}
                email
              </span>
              <div className="flex items-center gap-1.5">
                <label htmlFor="inbox-page-size" className="text-xs font-semibold text-gray-600">
                  Baris per halaman:
                </label>
                <select
                  id="inbox-page-size"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {[5, 10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Page Navigation Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>

                {(() => {
                  const pages: (number | "...")[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (safeCurrentPage > 3) pages.push("...");
                    const start = Math.max(2, safeCurrentPage - 1);
                    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (safeCurrentPage < totalPages - 2) pages.push("...");
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
                        onClick={() => setCurrentPage(p as number)}
                        className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                          p === safeCurrentPage
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Single Delete Confirmation Modal */}
      {emailToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-red-50/50">
              <div className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">Hapus Email</h3>
              </div>
              <button
                onClick={() => setEmailToDelete(null)}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-700">
                Apakah Anda yakin ingin menghapus record email masuk ini?
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1 font-mono text-gray-700">
                <div>
                  <span className="font-semibold text-gray-500">Pengirim:</span> {emailToDelete.sender}
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Subjek:</span> {emailToDelete.subject || "(Tanpa Subjek)"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setEmailToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeleteSingle}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Ya, Hapus Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-red-50/50">
              <div className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">
                  Hapus ({selectedIds.length}) Email Terpilih
                </h3>
              </div>
              <button
                onClick={() => setIsBulkDeleteOpen(false)}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-700">
                Apakah Anda yakin ingin menghapus <span className="font-bold text-red-600">{selectedIds.length} email</span> yang terpilih?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setIsBulkDeleteOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeleteBulk}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Ya, Hapus {selectedIds.length} Email
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

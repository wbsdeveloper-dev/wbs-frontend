"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Mail,
  CheckCircle,
  Clock,
  Play,
  Download,
  ToggleLeft,
  ToggleRight,
  FileText,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import EmailTable from "./components/EmailTable";
import DetailDrawer from "./components/DetailDrawer";
import Card, { CardHeader } from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui";
import {
  useEmailSources,
  useCreateEmailSource,
  useUpdateEmailSource,
  useDeleteEmailSource,
  useTriggerEmailPoll,
  useTestEmailParse,
  type EmailSource,
  type CreateEmailSourcePayload,
  type UpdateEmailSourcePayload,
} from "@/hooks/service/config-api";

// Re-export for child components
export type { EmailSource };

export default function EmailIngestPage() {
  // API hooks
  const { data: emailSources = [], isLoading, isError } = useEmailSources();
  const createMutation = useCreateEmailSource();
  const updateMutation = useUpdateEmailSource();
  const deleteMutation = useDeleteEmailSource();
  const triggerPollMutation = useTriggerEmailPoll();
  const testParseMutation = useTestEmailParse();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailSource | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: "",
    emailAddress: "",
    cronSchedule: "0 8 * * *",
    subjectFilter: "",
    senderFilter: "",
    labelFilter: "INBOX",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Show notification helper
  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter emails
  const filteredEmails = useMemo(() => {
    return emailSources.filter((source) => {
      const matchesSearch =
        source.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && source.isEnabled) ||
        (statusFilter === "inactive" && !source.isEnabled);
      return matchesSearch && matchesStatus;
    });
  }, [emailSources, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = emailSources.length;
    const active = emailSources.filter((e) => e.isEnabled).length;
    return { total, active };
  }, [emailSources]);

  const handleRowClick = (source: EmailSource) => {
    setSelectedEmail(source);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedEmail(null);
  };

  const validateAddForm = () => {
    const errors: Record<string, string> = {};
    if (!addForm.emailAddress) {
      errors.emailAddress = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.emailAddress)) {
      errors.emailAddress = "Format email tidak valid";
    }
    if (!addForm.name) {
      errors.name = "Nama wajib diisi";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmail = () => {
    if (!validateAddForm()) return;

    const payload: CreateEmailSourcePayload = {
      name: addForm.name,
      emailAddress: addForm.emailAddress,
      cronSchedule: addForm.cronSchedule || undefined,
      subjectFilter: addForm.subjectFilter || undefined,
      senderFilter: addForm.senderFilter || undefined,
      labelFilter: addForm.labelFilter || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        showNotification("success", `Email source ${addForm.emailAddress} berhasil ditambahkan`);
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
          emailAddress: "",
          cronSchedule: "0 8 * * *",
          subjectFilter: "",
          senderFilter: "",
          labelFilter: "INBOX",
        });
        setFormErrors({});
      },
      onError: (err) => showNotification("error", err.message),
    });
  };

  const handleUpdateEmail = (source: EmailSource) => {
    const payload: UpdateEmailSourcePayload = {
      name: source.name,
      emailAddress: source.emailAddress,
      isEnabled: source.isEnabled,
      cronSchedule: source.cronSchedule || undefined,
      subjectFilter: source.subjectFilter || undefined,
      senderFilter: source.senderFilter || undefined,
      labelFilter: source.labelFilter || undefined,
    };

    updateMutation.mutate(
      { id: source.id, payload },
      {
        onSuccess: (updated) => {
          setSelectedEmail(updated);
          showNotification("success", "Email source berhasil diperbarui");
        },
        onError: (err) => showNotification("error", err.message),
      },
    );
  };

  const handleDeleteEmail = (id: string) => {
    const source = emailSources.find((e) => e.id === id);
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (source) {
          showNotification("success", `Email ${source.emailAddress} berhasil dihapus`);
        }
        if (selectedEmail?.id === id) {
          handleCloseDrawer();
        }
      },
      onError: (err) => showNotification("error", err.message),
    });
  };

  const handleBulkToggle = (enable: boolean) => {
    const count = selectedRows.length;
    // Update each selected row
    const promises = selectedRows.map((id) =>
      updateMutation.mutateAsync({ id, payload: { isEnabled: enable } }),
    );
    Promise.all(promises)
      .then(() => {
        setSelectedRows([]);
        showNotification(
          "success",
          `${count} email berhasil ${enable ? "diaktifkan" : "dinonaktifkan"}`,
        );
      })
      .catch((err) => showNotification("error", err.message));
  };

  const handleExportCSV = () => {
    const headers = ["email", "name", "provider", "status", "cron_schedule", "last_polled_at"];
    const rows = emailSources.map((e) => [
      e.emailAddress,
      e.name,
      e.provider,
      e.isEnabled ? "active" : "inactive",
      e.cronSchedule || "",
      e.lastPolledAt || "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email_ingest_list.csv";
    a.click();
    URL.revokeObjectURL(url);
    showNotification("success", "File CSV berhasil diexport");
  };

  const handleTriggerSync = () => {
    // Trigger poll for all enabled sources
    const enabledSources = emailSources.filter((s) => s.isEnabled);
    if (enabledSources.length === 0) {
      showNotification("info", "Tidak ada email source yang aktif");
      return;
    }

    showNotification("info", "Memulai polling untuk semua email source aktif...");
    const promises = enabledSources.map((s) => triggerPollMutation.mutateAsync(s.id));
    Promise.all(promises)
      .then(() => showNotification("success", `Polling berhasil di-trigger untuk ${enabledSources.length} source`))
      .catch((err) => showNotification("error", err.message));
  };

  const handleTestParse = (source: EmailSource) => {
    testParseMutation.mutate(source.id, {
      onSuccess: ({ jobId }) => {
        showNotification("success", `Test parse di-trigger (Job: ${jobId.slice(0, 8)}...)`);
      },
      onError: (err) => showNotification("error", err.message),
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slideIn ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : notification.type === "error"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          {notification.type === "success" && <CheckCircle size={18} />}
          {notification.type === "error" && <AlertCircle size={18} />}
          {notification.type === "info" && <Clock size={18} />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 md:mb-8 animate-fadeIn">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="text-gray-400">/</span>
          <span>Konfigurasi Sistem</span>
          <span className="text-gray-400">/</span>
          <span className="text-[#115d72] font-medium">Email Ingest</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Email Ingest</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Kelola alamat email untuk ingestion laporan PLN dan mapping ke site / template.
        </p>
      </div>

      {/* Action Bar */}
      <Card className="mb-6 animate-fadeIn" style={{ animationDelay: "100ms" }}>
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Left side - Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <Plus size={18} />
              Tambah Email
            </button>
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="text-sm text-gray-600 font-medium">
                  {selectedRows.length} dipilih
                </span>
                <button
                  onClick={() => handleBulkToggle(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-all duration-200"
                >
                  <ToggleRight size={16} />
                  Aktifkan
                </button>
                <button
                  onClick={() => handleBulkToggle(false)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-all duration-200"
                >
                  <ToggleLeft size={16} />
                  Nonaktifkan
                </button>
              </div>
            )}
          </div>

          {/* Right side - Search & Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari email atau nama..."
                className="w-full md:w-64 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer transition-all duration-200"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Email Table (2/3) */}
        <div className="lg:col-span-2 animate-fadeIn" style={{ animationDelay: "200ms" }}>
          {isLoading ? (
            <Card className="flex items-center justify-center py-16">
              <div className="text-center text-gray-500">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#14a2bb]" />
                <p className="text-sm">Memuat email sources...</p>
              </div>
            </Card>
          ) : isError ? (
            <Card className="flex items-center justify-center py-16">
              <div className="text-center text-red-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-3" />
                <p className="text-sm">Gagal memuat data email sources</p>
              </div>
            </Card>
          ) : (
            <EmailTable
              emails={filteredEmails}
              selectedRows={selectedRows}
              onSelectRows={setSelectedRows}
              onRowClick={handleRowClick}
              onDelete={handleDeleteEmail}
            />
          )}
        </div>

        {/* Right Column - System Health (1/3) */}
        <div className="space-y-4">
          {/* Status Card */}
          <Card className="animate-fadeIn" style={{ animationDelay: "300ms" }}>
            <CardHeader
              title="Status Email Ingest"
              description="Ringkasan status email"
            />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#115d72]/10 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#115d72]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">Total email source</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Aktif</span>
                <span className="text-sm font-semibold text-green-600">{stats.active}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Nonaktif</span>
                <span className="text-sm font-semibold text-gray-500">{stats.total - stats.active}</span>
              </div>
            </div>
            <button
              onClick={() => showNotification("info", "Membuka halaman logs...")}
              className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-[#115d72] bg-[#115d72]/10 rounded-lg hover:bg-[#115d72]/20 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Lihat Logs
            </button>
          </Card>

          {/* Auto-sync Schedule */}
          <Card className="animate-fadeIn" style={{ animationDelay: "400ms" }}>
            <CardHeader
              title="Auto-sync Schedule"
              description="Jadwal sinkronisasi otomatis"
            />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#14a2bb]/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#14a2bb]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {emailSources.length > 0 && emailSources[0].cronSchedule
                    ? `Cron: ${emailSources[0].cronSchedule}`
                    : "Belum dikonfigurasi"}
                </div>
                <div className="text-xs text-gray-500">Jadwal polling email</div>
              </div>
            </div>
            <div className="py-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Source aktif</span>
                <span className="text-sm font-medium text-gray-700">{stats.active} source</span>
              </div>
            </div>
            <button
              onClick={handleTriggerSync}
              disabled={triggerPollMutation.isPending}
              className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              {triggerPollMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              Trigger Now
            </button>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-fadeIn" style={{ animationDelay: "500ms" }}>
            <CardHeader
              title="Quick Actions"
              description="Aksi cepat"
            />
            <div className="space-y-2">
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center gap-2"
              >
                <Download size={16} />
                Export Email List CSV
              </button>
              <button
                onClick={() => {
                  const allIds = emailSources.map((e) => e.id);
                  setSelectedRows(allIds);
                  showNotification("info", `${allIds.length} email dipilih`);
                }}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Pilih Semua Email
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        email={selectedEmail}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onUpdate={handleUpdateEmail}
        onTestParse={handleTestParse}
        isTestParsePending={testParseMutation.isPending}
      />

      {/* Add Email Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormErrors({});
        }}
        title="Tambah Email Source"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent ${
                formErrors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Contoh: PLN Laporan Harian"
            />
            {formErrors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {formErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={addForm.emailAddress}
              onChange={(e) => setAddForm({ ...addForm, emailAddress: e.target.value })}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent ${
                formErrors.emailAddress ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="contoh@domain.com"
            />
            {formErrors.emailAddress && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {formErrors.emailAddress}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cron Schedule
              </label>
              <input
                type="text"
                value={addForm.cronSchedule}
                onChange={(e) => setAddForm({ ...addForm, cronSchedule: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent font-mono"
                placeholder="0 8 * * *"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Label Filter
              </label>
              <input
                type="text"
                value={addForm.labelFilter}
                onChange={(e) => setAddForm({ ...addForm, labelFilter: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
                placeholder="INBOX"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject Filter
            </label>
            <input
              type="text"
              value={addForm.subjectFilter}
              onChange={(e) => setAddForm({ ...addForm, subjectFilter: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
              placeholder="Contoh: Laporan Harian, Report Gas"
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated keywords untuk filter subject email
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sender Filter
            </label>
            <input
              type="text"
              value={addForm.senderFilter}
              onChange={(e) => setAddForm({ ...addForm, senderFilter: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
              placeholder="Contoh: noreply@pln.co.id"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setFormErrors({});
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Batal
            </button>
            <button
              onClick={handleAddEmail}
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Mail,
  CheckCircle,
  Clock,
  Download,
  ToggleLeft,
  ToggleRight,
  FileText,
  AlertCircle,
  X,
  Loader2,
  StopCircle,
  SkipForward,
  RefreshCw,
} from "lucide-react";
import EmailTable from "./components/EmailTable";
import DetailDrawer from "./components/DetailDrawer";
import Card, { CardHeader } from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui";
import CronScheduleSelector from "@/app/components/ui/CronScheduleSelector";
import {
  useEmailSources,
  useCreateEmailSource,
  useUpdateEmailSource,
  useDeleteEmailSource,
  // useTriggerEmailPoll,
  useTestEmailParse,
  useGetEmailOAuthStatus,
  useGetEmailOAuthUrl,
  useExchangeEmailOAuthToken,
  useDisconnectEmailOAuth,
  useEmailSourceJobs,
  useStopJob,
  useSkipJob,
  useRetryJob,
  useRecentEmailLogs,
  type EmailSource,
  type CreateEmailSourcePayload,
  type UpdateEmailSourcePayload,
  type JobQueueItem,
} from "@/hooks/service/config-api";
import { usePrivilege } from "@/hooks/usePrivilege";

// Re-export for child components
export type { EmailSource };

export default function EmailIngestPage() {
  const { hasPrivilege } = usePrivilege();
  const canCreate = hasPrivilege("email_ingest", "CREATE");
  const canUpdate = hasPrivilege("email_ingest", "UPDATE");

  // API hooks
  const { data: emailSources = [], isLoading, isError } = useEmailSources();
  const createMutation = useCreateEmailSource();
  const updateMutation = useUpdateEmailSource();
  const deleteMutation = useDeleteEmailSource();
  // const triggerPollMutation = useTriggerEmailPoll();
  const testParseMutation = useTestEmailParse();
  const getOAuthUrlMutation = useGetEmailOAuthUrl();
  const exchangeOAuthMutation = useExchangeEmailOAuthToken();
  const disconnectOAuthMutation = useDisconnectEmailOAuth();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailSource | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const { data: oauthStatus, isLoading: isOauthLoading } =
    useGetEmailOAuthStatus();

  // Job queue hooks (depends on selectedEmail)
  const { data: queueJobs = [], isLoading: isJobsLoading } = useEmailSourceJobs(
    selectedEmail?.id ?? null,
  );
  const stopJobMutation = useStopJob();
  const skipJobMutation = useSkipJob();
  const retryJobMutation = useRetryJob();

  // Recent logs for the Logs Modal
  const { data: recentLogs = [], isLoading: isLogsLoading } =
    useRecentEmailLogs();

  // Add form state
  const [addForm, setAddForm] = useState({
    name: "",
    cronSchedule: "0 8 * * *",
    subjectFilter: "",
    senderFilter: "",
    labelFilter: "INBOX",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Show notification helper
  const showNotification = (
    type: "success" | "error" | "info",
    message: string,
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter emails
  const filteredEmails = useMemo(() => {
    return emailSources.filter((source) => {
      const matchesSearch = source.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
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
      cronSchedule: addForm.cronSchedule || undefined,
      subjectFilter: addForm.subjectFilter || undefined,
      senderFilter: addForm.senderFilter || undefined,
      labelFilter: addForm.labelFilter || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        showNotification(
          "success",
          `Rule ${addForm.name} berhasil ditambahkan`,
        );
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
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
      isEnabled: source.isEnabled,
      cronSchedule: source.cronSchedule,
      subjectFilter: source.subjectFilter,
      senderFilter: source.senderFilter,
      labelFilter: source.labelFilter,
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
          showNotification("success", `Rule ${source.name} berhasil dihapus`);
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
    const headers = [
      "name",
      "provider",
      "status",
      "cron_schedule",
      "last_polled_at",
    ];
    const rows = emailSources.map((e) => [
      e.name,
      e.provider,
      e.isEnabled ? "active" : "inactive",
      e.cronSchedule || "",
      e.lastPolledAt || "",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email_ingest_list.csv";
    a.click();
    URL.revokeObjectURL(url);
    showNotification("success", "File CSV berhasil diexport");
  };

  // const handleTriggerSync = () => {
  //   // Trigger poll for all enabled sources
  //   const enabledSources = emailSources.filter((s) => s.isEnabled);
  //   if (enabledSources.length === 0) {
  //     showNotification("info", "Tidak ada email source yang aktif");
  //     return;
  //   }

  //   showNotification(
  //     "info",
  //     "Memulai polling untuk semua email source aktif...",
  //   );
  //   const promises = enabledSources.map((s) =>
  //     triggerPollMutation.mutateAsync(s.id),
  //   );
  //   Promise.all(promises)
  //     .then(() =>
  //       showNotification(
  //         "success",
  //         `Polling berhasil di-trigger untuk ${enabledSources.length} source`,
  //       ),
  //     )
  //     .catch((err) => showNotification("error", err.message));
  // };

  const handleTestParse = (source: EmailSource) => {
    testParseMutation.mutate(source.id, {
      onSuccess: ({ jobId }) => {
        showNotification(
          "success",
          `Test parse di-trigger (Job: ${jobId.slice(0, 8)}...)`,
        );
      },
      onError: (err) => showNotification("error", err.message),
    });
  };

  const handleConnectOAuthGlobal = () => {
    getOAuthUrlMutation.mutate(undefined, {
      onSuccess: (url) => {
        const width = 500;
        const height = 650;
        const left = Math.round(window.screen.width / 2 - width / 2);
        const top = Math.round(window.screen.height / 2 - height / 2);
        const popup = window.open(
          url,
          "WBS OAuth",
          `width=${width},height=${height},left=${left},top=${top}`,
        );

        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (
            event.data?.source === "wbs-oauth" &&
            event.data?.type === "oauth-success"
          ) {
            const code = event.data.code as string;
            window.removeEventListener("message", handleMessage);
            exchangeOAuthMutation.mutate(
              { code },
              {
                onSuccess: () => {
                  showNotification(
                    "success",
                    `Koneksi OAuth Global berhasil terhubung`,
                  );
                  if (popup && !popup.closed) popup.close();
                },
                onError: (err) => {
                  showNotification(
                    "error",
                    `Gagal menukar token: ${err.message}`,
                  );
                },
              },
            );
          }
        };
        window.addEventListener("message", handleMessage);
      },
      onError: (err) => {
        showNotification("error", `Gagal mengambil URL OAuth: ${err.message}`);
      },
    });
  };

  const handleDisconnectAuthGlobal = () => {
    setIsDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = () => {
    setIsDisconnectModalOpen(false);
    disconnectOAuthMutation.mutate(undefined, {
      onSuccess: () => {
        showNotification("success", `Autentikasi global telah dicabut.`);
      },
      onError: (err) => {
        showNotification("error", `Gagal mencabut autentikasi: ${err.message}`);
      },
    });
  };

  // Job queue handlers
  const handleStopJob = (jobId: string) => {
    stopJobMutation.mutate(jobId, {
      onSuccess: () => showNotification("success", "Job dihentikan"),
      onError: (err) => showNotification("error", err.message),
    });
  };

  const handleSkipJob = (jobId: string) => {
    skipJobMutation.mutate(jobId, {
      onSuccess: () => showNotification("success", "Job dilewati"),
      onError: (err) => showNotification("error", err.message),
    });
  };

  const handleRetryJob = (jobId: string) => {
    retryJobMutation.mutate(jobId, {
      onSuccess: () => showNotification("success", "Job dijadwalkan ulang"),
      onError: (err) => showNotification("error", err.message),
    });
  };

  const getJobStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Pending", className: "bg-blue-100 text-blue-700" },
      RUNNING: { label: "Running", className: "bg-yellow-100 text-yellow-700" },
      RETRY_WAIT: {
        label: "Retrying",
        className: "bg-orange-100 text-orange-700",
      },
      FAILED: { label: "Failed", className: "bg-red-100 text-red-700" },
      DONE: { label: "Done", className: "bg-green-100 text-green-700" },
    };
    const b = map[status] || {
      label: status,
      className: "bg-gray-100 text-gray-600",
    };
    return (
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.className}`}
      >
        {b.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-100 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slideIn ${
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
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-70"
          >
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Email Ingest
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Kelola satu akun email utama beserta berbagai rule filter ingestion
          untuk membaca laporan PLN.
        </p>
      </div>

      {/* Global Email Connection Card */}
      <Card className="mb-6 animate-fadeIn" style={{ animationDelay: "50ms" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-2 gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                oauthStatus?.connected
                  ? "bg-green-100"
                  : oauthStatus?.reason === "token_revoked"
                    ? "bg-amber-100"
                    : "bg-gray-100"
              }`}
            >
              <Mail
                className={`w-6 h-6 ${
                  oauthStatus?.connected
                    ? "text-green-600"
                    : oauthStatus?.reason === "token_revoked"
                      ? "text-amber-600"
                      : "text-gray-400"
                }`}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Koneksi Email Global
              </h2>
              <p className="text-sm text-gray-500">
                {isOauthLoading
                  ? "Mengecek status..."
                  : oauthStatus?.connected
                    ? `Terhubung: ${oauthStatus.emailAddress}`
                    : oauthStatus?.reason === "token_revoked"
                      ? `Token kedaluwarsa — perlu hubungkan ulang`
                      : "Belum ada email yang dihubungkan"}
              </p>
            </div>
          </div>
          <div>
            {!isOauthLoading &&
              canUpdate &&
              (oauthStatus?.connected ? (
                <button
                  onClick={handleDisconnectAuthGlobal}
                  disabled={disconnectOAuthMutation.isPending}
                  className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Putuskan Koneksi
                </button>
              ) : (
                <button
                  onClick={handleConnectOAuthGlobal}
                  disabled={getOAuthUrlMutation.isPending}
                  className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    oauthStatus?.reason === "token_revoked"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-[#115d72] hover:bg-[#0d4a5c]"
                  }`}
                >
                  {oauthStatus?.reason === "token_revoked"
                    ? "Hubungkan Ulang"
                    : "Hubungkan dengan Google"}
                </button>
              ))}
          </div>
        </div>
      </Card>

      {/* OAuth Reconnection Warning */}
      {!isOauthLoading &&
        oauthStatus &&
        !oauthStatus.connected &&
        oauthStatus.reason === "token_revoked" && (
          <div className="mb-6 animate-fadeIn p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                Koneksi email telah kedaluwarsa
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Token akses Google tidak valid. Silakan hubungkan ulang untuk
                melanjutkan polling email otomatis.
              </p>
            </div>
            {canUpdate && (
              <button
                onClick={handleConnectOAuthGlobal}
                disabled={getOAuthUrlMutation.isPending}
                className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
              >
                Hubungkan Ulang
              </button>
            )}
          </div>
        )}

      {/* Action Bar */}
      <Card className="mb-6 animate-fadeIn" style={{ animationDelay: "100ms" }}>
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Left side - Buttons */}
          <div className="flex flex-wrap gap-3">
            {canCreate && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
              >
                <Plus size={18} />
                Tambah Rule Ingestion
              </button>
            )}
            {canUpdate && selectedRows.length > 0 && (
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
        <div
          className="lg:col-span-2 animate-fadeIn"
          style={{ animationDelay: "200ms" }}
        >
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
                <div className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </div>
                <div className="text-xs text-gray-500">Total email source</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Aktif</span>
                <span className="text-sm font-semibold text-green-600">
                  {stats.active}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Nonaktif</span>
                <span className="text-sm font-semibold text-gray-500">
                  {stats.total - stats.active}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-[#115d72] bg-[#115d72]/10 rounded-lg hover:bg-[#115d72]/20 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Lihat Logs
            </button>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-fadeIn" style={{ animationDelay: "500ms" }}>
            <CardHeader title="Quick Actions" description="Aksi cepat" />
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

          {/* Job Queue Card */}
          {selectedEmail && (
            <Card
              className="animate-fadeIn"
              style={{ animationDelay: "600ms" }}
            >
              <CardHeader
                title="Antrian Job"
                description={`${selectedEmail.name}`}
              />
              {isJobsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#14a2bb]" />
                </div>
              ) : queueJobs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Tidak ada job dalam antrian
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {queueJobs.map((job: JobQueueItem) => (
                    <div
                      key={job.id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-gray-500">
                          {job.id.slice(0, 8)}...
                        </span>
                        {getJobStatusBadge(job.status)}
                      </div>
                      <div className="text-gray-600 mb-1">
                        {job.job_type} &middot; attempt {job.attempt_count}
                      </div>
                      {job.last_error && (
                        <p className="text-red-500 text-xs mb-2 line-clamp-2">
                          {job.last_error}
                        </p>
                      )}
                      {job.next_retry_at && (
                        <p className="text-gray-400 text-xs mb-2">
                          Next retry:{" "}
                          {new Date(job.next_retry_at).toLocaleTimeString()}
                        </p>
                      )}
                      <div className="flex gap-1.5">
                        {(job.status === "PENDING" ||
                          job.status === "RETRY_WAIT" ||
                          job.status === "RUNNING") && (
                          <button
                            onClick={() => handleStopJob(job.id)}
                            disabled={stopJobMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <StopCircle size={12} />
                            Stop
                          </button>
                        )}
                        {(job.status === "FAILED" ||
                          job.status === "RETRY_WAIT") && (
                          <>
                            <button
                              onClick={() => handleSkipJob(job.id)}
                              disabled={skipJobMutation.isPending}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                              <SkipForward size={12} />
                              Skip
                            </button>
                            <button
                              onClick={() => handleRetryJob(job.id)}
                              disabled={retryJobMutation.isPending}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw size={12} />
                              Retry
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
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
        isUpdatePending={updateMutation.isPending}
      />

      {/* Logs Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Sinkronisasi Email"
        maxWidth="max-w-3xl"
      >
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 font-mono text-sm shadow-inner flex flex-col min-h-[300px] max-h-[500px]">
          <div className="flex items-center gap-2 mb-4 text-gray-400 border-b border-gray-700 pb-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-xs">job-execution.log</span>
            <span className="ml-auto text-xs text-gray-500">
              {recentLogs.length} entries
            </span>
          </div>

          <div className="flex-1 space-y-2 text-gray-300 overflow-y-auto">
            {isLogsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#14a2bb]" />
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>Belum ada aktivitas job terekam.</p>
              </div>
            ) : (
              recentLogs.map((log: JobQueueItem) => {
                const ts = new Date(log.created_at)
                  .toISOString()
                  .replace("T", " ")
                  .substring(0, 19);
                const isError = log.status === "FAILED";
                const isDone = log.status === "DONE";
                const isRunning = log.status === "RUNNING";
                const isRetrying = log.status === "RETRY_WAIT";
                const level = isError
                  ? "ERROR"
                  : isDone
                    ? "OK"
                    : isRunning
                      ? "INFO"
                      : isRetrying
                        ? "WARN"
                        : "INFO";
                const levelColor = isError
                  ? "text-red-400"
                  : isDone
                    ? "text-green-400"
                    : isRetrying
                      ? "text-yellow-400"
                      : "text-[#14a2bb]";

                return (
                  <div key={log.id} className="flex gap-3 items-start group">
                    <span className="text-gray-500 shrink-0">[{ts}]</span>
                    <span className={`${levelColor} shrink-0 font-semibold`}>
                      [{level}]
                    </span>
                    <span className="text-gray-400 shrink-0">
                      [{log.job_type}]
                    </span>
                    <span className="flex-1">
                      {log.job_type === "EMAIL_POLL" ? (
                        <>Polling email source — </>
                      ) : (
                        <>Email ingest — </>
                      )}
                      {isError ? (
                        <span className="text-red-400">
                          FAILED: {log.last_error}
                        </span>
                      ) : isDone ? (
                        <span className="text-green-400">Completed</span>
                      ) : isRetrying ? (
                        <span className="text-yellow-400">
                          Retry #{log.attempt_count}
                          {log.next_retry_at &&
                            ` — next at ${new Date(log.next_retry_at).toLocaleTimeString()}`}
                        </span>
                      ) : isRunning ? (
                        <span className="text-blue-400">
                          Running (attempt {log.attempt_count})
                        </span>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </span>
                    {(isError || isRetrying) && (
                      <span className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRetryJob(log.id)}
                          disabled={retryJobMutation.isPending}
                          className="px-2 py-0.5 text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/40 transition-colors"
                          title="Jadwalkan ulang job"
                        >
                          <RefreshCw size={12} />
                        </button>
                        <button
                          onClick={() => handleSkipJob(log.id)}
                          disabled={skipJobMutation.isPending}
                          className="px-2 py-0.5 text-xs bg-gray-600/20 text-gray-400 border border-gray-500/30 rounded hover:bg-gray-600/40 transition-colors"
                          title="Lewati job"
                        >
                          <SkipForward size={12} />
                        </button>
                      </span>
                    )}
                  </div>
                );
              })
            )}

            {!isLogsLoading &&
              oauthStatus?.connected &&
              recentLogs.length > 0 && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800/50">
                  <span className="text-gray-500 shrink-0">
                    [
                    {new Date()
                      .toISOString()
                      .replace("T", " ")
                      .substring(0, 19)}
                    ]
                  </span>
                  <span className="text-green-400 shrink-0">[OAUTH]</span>
                  <span>
                    Connection to {oauthStatus.emailAddress} is healthy.
                  </span>
                </div>
              )}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setIsLogModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </Modal>

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        title="Putuskan Koneksi OAuth"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Apakah Anda yakin?
              </p>
              <p className="text-xs text-red-600 mt-1">
                Mencabut akses OAuth akan menghentikan semua polling email
                otomatis. Anda harus menghubungkan ulang akun Google untuk
                mengaktifkannya kembali.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsDisconnectModalOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmDisconnect}
              disabled={disconnectOAuthMutation.isPending}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
            >
              {disconnectOAuthMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Memutuskan...
                </span>
              ) : (
                "Ya, Putuskan"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Email Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormErrors({});
        }}
        title="Tambah Rule Ingestion Baru"
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

          <CronScheduleSelector
            value={addForm.cronSchedule}
            onChange={(v) => setAddForm({ ...addForm, cronSchedule: v })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject Filter
            </label>
            <input
              type="text"
              value={addForm.subjectFilter}
              onChange={(e) =>
                setAddForm({ ...addForm, subjectFilter: e.target.value })
              }
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
              onChange={(e) =>
                setAddForm({ ...addForm, senderFilter: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
              placeholder="Contoh: noreply@pln.co.id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Label Filter
            </label>
            <input
              type="text"
              value={addForm.labelFilter}
              onChange={(e) =>
                setAddForm({ ...addForm, labelFilter: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
              placeholder="INBOX"
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

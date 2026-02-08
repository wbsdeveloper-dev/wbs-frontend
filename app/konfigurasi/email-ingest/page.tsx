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
} from "lucide-react";
import EmailTable from "./components/EmailTable";
import DetailDrawer from "./components/DetailDrawer";
import Card, { CardHeader } from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui";

// Types
export interface EmailAddress {
  id: string;
  email: string;
  label: string;
  provider: "PLN" | "Internal" | "Other";
  siteMapping: string | null;
  appliedTemplate: string | null;
  lastSync: string | null;
  status: "active" | "inactive";
  errorCount: number;
  notes?: string;
}

// Mock data
const MOCK_EMAILS: EmailAddress[] = [
  {
    id: "1",
    email: "monitoring@pln-jakarta.co.id",
    label: "PLN Jakarta Monitoring",
    provider: "PLN",
    siteMapping: "PLN IP Jakarta",
    appliedTemplate: "Template Report Harian",
    lastSync: "2026-02-08 14:30:00",
    status: "active",
    errorCount: 0,
  },
  {
    id: "2",
    email: "laporan@pln-gresik.co.id",
    label: "PLN Gresik Daily Report",
    provider: "PLN",
    siteMapping: "PLN IP Gresik",
    appliedTemplate: "Template Gas Pipa",
    lastSync: "2026-02-08 12:15:00",
    status: "active",
    errorCount: 0,
  },
  {
    id: "3",
    email: "data.cilegon@internal.pln.com",
    label: "Internal Cilegon",
    provider: "Internal",
    siteMapping: "PLN IP Cilegon",
    appliedTemplate: null,
    lastSync: "2026-02-07 23:45:00",
    status: "active",
    errorCount: 2,
  },
  {
    id: "4",
    email: "report@supplier-gas.com",
    label: "Supplier Gas Report",
    provider: "Other",
    siteMapping: null,
    appliedTemplate: "Template External",
    lastSync: null,
    status: "inactive",
    errorCount: 0,
  },
  {
    id: "5",
    email: "monitoring@pln-surabaya.co.id",
    label: "PLN Surabaya Monitoring",
    provider: "PLN",
    siteMapping: "PLN IP Surabaya",
    appliedTemplate: "Template Report Harian",
    lastSync: "2026-02-08 08:00:00",
    status: "active",
    errorCount: 1,
  },
];

const MOCK_TEMPLATES = [
  "Template Report Harian",
  "Template Gas Pipa",
  "Template External",
  "Template BBM",
];

const MOCK_SITES = [
  "PLN IP Jakarta",
  "PLN IP Gresik",
  "PLN IP Cilegon",
  "PLN IP Surabaya",
  "PLN IP Semarang",
];

export default function EmailIngestPage() {
  const [emails, setEmails] = useState<EmailAddress[]>(MOCK_EMAILS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailAddress | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isTestParseOpen, setIsTestParseOpen] = useState(false);
  const [testParseEmail, setTestParseEmail] = useState<EmailAddress | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  
  // Add form state
  const [addForm, setAddForm] = useState({
    email: "",
    label: "",
    provider: "PLN" as "PLN" | "Internal" | "Other",
    siteMapping: "",
    appliedTemplate: "",
    status: "active" as "active" | "inactive",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Show notification helper
  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter emails
  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      const matchesSearch =
        email.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && email.status === "active") ||
        (statusFilter === "inactive" && email.status === "inactive");
      const matchesProvider =
        providerFilter === "all" || email.provider === providerFilter;
      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [emails, searchQuery, statusFilter, providerFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = emails.length;
    const active = emails.filter((e) => e.status === "active").length;
    const errorsLast7Days = emails.filter((e) => e.errorCount > 0).length;
    return { total, active, errorsLast7Days };
  }, [emails]);

  const handleRowClick = (email: EmailAddress) => {
    setSelectedEmail(email);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedEmail(null);
  };

  const validateAddForm = () => {
    const errors: Record<string, string> = {};
    if (!addForm.email) {
      errors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) {
      errors.email = "Format email tidak valid";
    } else if (emails.some((e) => e.email === addForm.email)) {
      errors.email = "Email sudah terdaftar";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmail = () => {
    if (!validateAddForm()) return;
    
    const newEmail: EmailAddress = {
      id: String(Date.now()),
      email: addForm.email,
      label: addForm.label,
      provider: addForm.provider,
      siteMapping: addForm.siteMapping || null,
      appliedTemplate: addForm.appliedTemplate || null,
      lastSync: null,
      status: addForm.status,
      errorCount: 0,
      notes: addForm.notes || undefined,
    };
    setEmails([...emails, newEmail]);
    setIsAddModalOpen(false);
    setAddForm({
      email: "",
      label: "",
      provider: "PLN",
      siteMapping: "",
      appliedTemplate: "",
      status: "active",
      notes: "",
    });
    setFormErrors({});
    showNotification("success", `Email ${newEmail.email} berhasil ditambahkan`);
  };

  const handleUpdateEmail = (updatedEmail: EmailAddress) => {
    setEmails(emails.map((e) => (e.id === updatedEmail.id ? updatedEmail : e)));
    setSelectedEmail(updatedEmail);
    showNotification("success", "Email berhasil diperbarui");
  };



  const handleDeleteEmail = (id: string) => {
    const email = emails.find((e) => e.id === id);
    setEmails(emails.filter((e) => e.id !== id));
    if (email) {
      showNotification("success", `Email ${email.email} berhasil dihapus`);
    }
  };

  const handleBulkToggle = (enable: boolean) => {
    const count = selectedRows.length;
    setEmails(
      emails.map((e) =>
        selectedRows.includes(e.id)
          ? { ...e, status: enable ? "active" : "inactive" }
          : e
      )
    );
    setSelectedRows([]);
    showNotification(
      "success",
      `${count} email berhasil ${enable ? "diaktifkan" : "dinonaktifkan"}`
    );
  };





  const handleExportCSV = () => {
    const headers = ["email", "label", "provider", "site_mapping", "template", "status"];
    const rows = emails.map((e) => [
      e.email,
      e.label,
      e.provider,
      e.siteMapping || "",
      e.appliedTemplate || "",
      e.status,
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
    showNotification("info", "Memulai sinkronisasi...");
    setTimeout(() => {
      showNotification("success", "Sinkronisasi berhasil dilakukan");
    }, 2000);
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
                placeholder="Cari email atau label..."
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
            <div className="relative">
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer transition-all duration-200"
              >
                <option value="all">Semua Provider</option>
                <option value="PLN">PLN</option>
                <option value="Internal">Internal</option>
                <option value="Other">Other</option>
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
          <EmailTable
            emails={filteredEmails}
            selectedRows={selectedRows}
            onSelectRows={setSelectedRows}
            onRowClick={handleRowClick}
            onDelete={handleDeleteEmail}
          />
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
                <div className="text-xs text-gray-500">Total alamat</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Aktif</span>
                <span className="text-sm font-semibold text-green-600">{stats.active}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Error (7 hari)</span>
                <span className={`text-sm font-semibold ${stats.errorsLast7Days > 0 ? "text-red-600" : "text-gray-900"}`}>
                  {stats.errorsLast7Days}
                </span>
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
                <div className="text-sm font-semibold text-gray-900">08 Feb 2026, 15:00</div>
                <div className="text-xs text-gray-500">Sinkronisasi selanjutnya</div>
              </div>
            </div>
            <div className="py-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Frekuensi</span>
                <span className="text-sm font-medium text-gray-700">Setiap 30 menit</span>
              </div>
            </div>
            <button
              onClick={handleTriggerSync}
              className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md active:scale-95"
            >
              <Play size={16} />
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
                  const allIds = emails.map((e) => e.id);
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
        templates={MOCK_TEMPLATES}
        sites={MOCK_SITES}
      />

      {/* Add Email Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormErrors({});
        }}
        title="Tambah Alamat Email"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent ${
                formErrors.email ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="contoh@domain.com"
            />
            {formErrors.email && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {formErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Label / Keterangan
            </label>
            <input
              type="text"
              value={addForm.label}
              onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
              placeholder="Deskripsi singkat email"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Provider
              </label>
              <div className="relative">
                <select
                  value={addForm.provider}
                  onChange={(e) => setAddForm({ ...addForm, provider: e.target.value as "PLN" | "Internal" | "Other" })}
                  className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10"
                >
                  <option value="PLN">PLN</option>
                  <option value="Internal">Internal</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Site Mapping
              </label>
              <div className="relative">
                <select
                  value={addForm.siteMapping}
                  onChange={(e) => setAddForm({ ...addForm, siteMapping: e.target.value })}
                  className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10"
                >
                  <option value="">Pilih Site</option>
                  {MOCK_SITES.map((site) => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Template Parsing
            </label>
            <div className="relative">
              <select
                value={addForm.appliedTemplate}
                onChange={(e) => setAddForm({ ...addForm, appliedTemplate: e.target.value })}
                className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10"
              >
                <option value="">Pilih Template</option>
                {MOCK_TEMPLATES.map((template) => (
                  <option key={template} value={template}>{template}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addForm.status === "active"}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.checked ? "active" : "inactive" })}
                className="w-4 h-4 text-[#115d72] border-gray-300 rounded focus:ring-[#14a2bb]"
              />
              <span className="text-sm text-gray-700">Aktifkan email</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes (Opsional)
            </label>
            <textarea
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent resize-none"
              placeholder="Catatan tambahan..."
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
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      {/* Test Parse Modal */}
      <Modal
        isOpen={isTestParseOpen}
        onClose={() => {
          setIsTestParseOpen(false);
          setTestParseEmail(null);
        }}
        title={`Test Parse - ${testParseEmail?.email || ""}`}
        maxWidth="max-w-lg"
      >
        {testParseEmail && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Hasil parsing terakhir:</p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">site_name</span>
                  <span className="font-mono text-gray-900 bg-white px-2 py-0.5 rounded">{testParseEmail.siteMapping || "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">metric_type</span>
                  <span className="font-mono text-gray-900 bg-white px-2 py-0.5 rounded">gas_consumption</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">value</span>
                  <span className="font-mono text-gray-900 bg-white px-2 py-0.5 rounded">1250.5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">period</span>
                  <span className="font-mono text-gray-900 bg-white px-2 py-0.5 rounded">2026-02-08</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsTestParseOpen(false);
                  setTestParseEmail(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  showNotification("info", "Menjalankan test parse...");
                  setTimeout(() => {
                    showNotification("success", "Test parse berhasil");
                    setIsTestParseOpen(false);
                    setTestParseEmail(null);
                  }, 1500);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
              >
                Run Test Parse
              </button>
            </div>
          </div>
        )}
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

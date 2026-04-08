"use client";

import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  FileSpreadsheet,
  Clock,
  AlertCircle,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Card from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui";
import {
  useSpreadsheetSources,
  useCreateSpreadsheetSource,
  useUpdateSpreadsheetSource,
  useDeleteSpreadsheetSource,
  type SpreadsheetSource,
  type CreateSpreadsheetSourcePayload,
  type UpdateSpreadsheetSourcePayload,
} from "@/hooks/service/config-api";

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function buildSheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

interface SourceFormData {
  name: string;
  spreadsheetUrl: string;
  sheetName: string;
  cronSchedule: string;
  dataStartRow: number;
}

const EMPTY_FORM: SourceFormData = {
  name: "",
  spreadsheetUrl: "",
  sheetName: "",
  cronSchedule: "0 11,23 * * *",
  dataStartRow: 1,
};

export default function SpreadsheetSourcePage() {
  const { data: sources = [], isLoading, isError } = useSpreadsheetSources();
  const createMutation = useCreateSpreadsheetSource();
  const updateMutation = useUpdateSpreadsheetSource();
  const deleteMutation = useDeleteSpreadsheetSource();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<SpreadsheetSource | null>(null);
  const [formData, setFormData] = useState<SourceFormData>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const openCreateModal = () => {
    setEditingSource(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (source: SpreadsheetSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      spreadsheetUrl: buildSheetUrl(source.spreadsheetId),
      sheetName: source.sheetName,
      cronSchedule: source.cronSchedule || "",
      dataStartRow: source.dataStartRow || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.spreadsheetUrl.trim() || !formData.sheetName.trim()) {
      showNotification("error", "Nama, Spreadsheet URL, dan Sheet Name wajib diisi");
      return;
    }

    const spreadsheetId = extractSpreadsheetId(formData.spreadsheetUrl);
    if (!spreadsheetId) {
      showNotification("error", "URL Google Sheets tidak valid. Pastikan format: https://docs.google.com/spreadsheets/d/...");
      return;
    }

    if (editingSource) {
      // Update
      const payload: UpdateSpreadsheetSourcePayload = {
        name: formData.name,
        spreadsheetId,
        sheetName: formData.sheetName,
        cronSchedule: formData.cronSchedule || undefined,
        dataStartRow: formData.dataStartRow,
      };
      updateMutation.mutate(
        { id: editingSource.id, payload },
        {
          onSuccess: () => {
            showNotification("success", "Spreadsheet source berhasil diperbarui");
            setIsModalOpen(false);
          },
          onError: (err) => showNotification("error", err.message),
        },
      );
    } else {
      // Create
      const payload: CreateSpreadsheetSourcePayload = {
        name: formData.name,
        spreadsheetId,
        sheetName: formData.sheetName,
        cronSchedule: formData.cronSchedule || undefined,
        dataStartRow: formData.dataStartRow,
      };
      createMutation.mutate(payload, {
        onSuccess: () => {
          showNotification("success", "Spreadsheet source berhasil dibuat");
          setIsModalOpen(false);
        },
        onError: (err) => showNotification("error", err.message),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        showNotification("success", "Spreadsheet source berhasil dihapus");
        setDeleteConfirmId(null);
      },
      onError: (err) => {
        showNotification("error", err.message);
        setDeleteConfirmId(null);
      },
    });
  };

  const handleToggleEnabled = (source: SpreadsheetSource) => {
    updateMutation.mutate(
      { id: source.id, payload: { isEnabled: !source.isEnabled } },
      {
        onSuccess: () => {
          showNotification(
            "success",
            `Source "${source.name}" ${!source.isEnabled ? "diaktifkan" : "dinonaktifkan"}`,
          );
        },
        onError: (err) => showNotification("error", err.message),
      },
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slideIn ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
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
          <span className="text-[#115d72] font-medium">Spreadsheet Source</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Spreadsheet Source</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Kelola sumber data Google Sheets untuk ingestion otomatis.
        </p>
      </div>

      {/* Action Bar */}
      <Card className="mb-6 animate-fadeIn" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {sources.length} sumber data terdaftar
          </p>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <Plus size={18} />
            Tambah Source
          </button>
        </div>
      </Card>

      {/* Sources List */}
      <div className="space-y-4 animate-fadeIn" style={{ animationDelay: "200ms" }}>
        {isLoading ? (
          <Card className="flex items-center justify-center py-16">
            <div className="text-center text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#14a2bb]" />
              <p className="text-sm">Memuat spreadsheet sources...</p>
            </div>
          </Card>
        ) : isError ? (
          <Card className="flex items-center justify-center py-16">
            <div className="text-center text-red-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-3" />
              <p className="text-sm">Gagal memuat data</p>
            </div>
          </Card>
        ) : sources.length === 0 ? (
          <Card className="flex items-center justify-center py-16">
            <div className="text-center text-gray-500">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Belum ada spreadsheet source</p>
              <p className="text-xs mt-1">Klik &quot;Tambah Source&quot; untuk membuat yang baru</p>
            </div>
          </Card>
        ) : (
          sources.map((source) => (
            <Card key={source.id} className="hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <FileSpreadsheet size={20} className="text-[#14a2bb] shrink-0" />
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {source.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        source.isEnabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          source.isEnabled ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {source.isEnabled ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Spreadsheet ID</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <code className="text-xs text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded font-mono truncate max-w-[180px]">
                          {source.spreadsheetId}
                        </code>
                        <a
                          href={buildSheetUrl(source.spreadsheetId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#14a2bb] hover:text-[#115d72]"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Sheet</span>
                      <p className="text-gray-700 font-medium mt-0.5">{source.sheetName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Cron Schedule</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={12} className="text-gray-400" />
                        <code className="text-xs text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded font-mono">
                          {source.cronSchedule || "—"}
                        </code>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Data Start Row</span>
                      <p className="text-gray-700 font-medium mt-0.5">Row {source.dataStartRow || 1}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleEnabled(source)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={source.isEnabled ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {source.isEnabled ? (
                      <ToggleRight size={20} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={20} className="text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(source)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={16} className="text-gray-500" />
                  </button>
                  {deleteConfirmId === source.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                        title="Konfirmasi hapus"
                      >
                        <Check size={16} className="text-red-600" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Batal"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(source.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSource ? "Edit Spreadsheet Source" : "Tambah Spreadsheet Source"}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
              placeholder="Contoh: SERAPAN GAS 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Google Sheets URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.spreadsheetUrl}
              onChange={(e) => setFormData({ ...formData, spreadsheetUrl: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            />
            {formData.spreadsheetUrl && (
              <p className="text-xs text-gray-500 mt-1">
                ID:{" "}
                <code className="bg-gray-50 px-1 rounded">
                  {extractSpreadsheetId(formData.spreadsheetUrl) || "tidak valid"}
                </code>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sheet Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sheetName}
                onChange={(e) => setFormData({ ...formData, sheetName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
                placeholder='Contoh: 4 (bulan April)'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Data Start Row
              </label>
              <input
                type="number"
                min="1"
                value={formData.dataStartRow}
                onChange={(e) =>
                  setFormData({ ...formData, dataStartRow: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cron Schedule
            </label>
            <input
              type="text"
              value={formData.cronSchedule}
              onChange={(e) => setFormData({ ...formData, cronSchedule: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent font-mono"
              placeholder="0 11,23 * * *"
            />
            <p className="text-xs text-gray-500 mt-1">
              Contoh: <code className="bg-gray-50 px-1 rounded">0 11,23 * * *</code> = setiap hari jam 11:00 dan 23:00
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Menyimpan...
                </span>
              ) : editingSource ? (
                "Simpan Perubahan"
              ) : (
                "Buat"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

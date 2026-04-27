"use client";

import React, { useState } from "react";
import { KeyRound, Plus, Trash2, Copy, Check, AlertTriangle, Loader2 } from "lucide-react";
import Card, { CardHeader } from "@/app/components/ui/Card";
import Modal from "@/app/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useApiKeys,
  useGenerateApiKey,
  useRevokeApiKey,
} from "@/hooks/use-api-keys";
import type { GeneratedApiKey } from "@/hooks/service/api-keys";
import { usePrivilege } from "@/hooks/usePrivilege";

export default function ApiKeyManagerPage() {
  const { hasPrivilege } = usePrivilege();
  const canCreate = hasPrivilege("api_keys", "CREATE");
  const canDelete = hasPrivilege("api_keys", "DELETE");

  const { data: apiKeys, isLoading } = useApiKeys();
  const generateApiKey = useGenerateApiKey();
  const revokeApiKey = useRevokeApiKey();

  // Selected item specifically for the revoke dialog
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);

  // Generate Modal state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [generateError, setGenerateError] = useState("");

  // Result Modal State (shows raw API key upon successful generation)
  const [newlyGeneratedKey, setNewlyGeneratedKey] =
    useState<GeneratedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  // Handlers
  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateError("");

    if (!newServiceName.trim()) {
      setGenerateError("Nama service wajib diisi.");
      return;
    }

    generateApiKey.mutate(newServiceName.trim(), {
      onSuccess: (data) => {
        setIsGenerateModalOpen(false);
        setNewServiceName("");
        setNewlyGeneratedKey(data);
      },
      onError: (err: Error) => {
        setGenerateError(err?.message || "Gagal membuat API Key");
      },
    });
  };

  const handleCopySecret = async () => {
    if (newlyGeneratedKey?.apiKey) {
      const textToCopy = newlyGeneratedKey.apiKey;

      // Try modern clipboard API first (only works on HTTPS/localhost)
      if (navigator?.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for HTTP environments
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;

        // Hide it from view
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);
        textArea.select();

        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback copy failed", err);
        } finally {
          document.body.removeChild(textArea);
        }
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeResultModal = () => {
    setNewlyGeneratedKey(null);
    setCopied(false);
  };

  const handleRevokeConfirm = () => {
    if (revokeTargetId) {
      revokeApiKey.mutate(revokeTargetId, {
        onSuccess: () => {
          setRevokeTargetId(null);
        },
      });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 animate-fadeIn">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="text-gray-400">/</span>
          <span>Konfigurasi Sistem</span>
          <span className="text-gray-400">/</span>
          <span className="text-[#115d72] font-medium flex items-center gap-1">
            <KeyRound className="w-4 h-4" /> API Keys
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          API Key Manager
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Kelola API Key untuk worker, bot, dan service internal lainnya agar
          dapat mengakses API Platform.
        </p>
      </div>

      <Card className="mb-6 animate-fadeIn" style={{ animationDelay: "100ms" }}>
        <CardHeader
          title="Daftar Service API Key"
          description="Kunci API yang pernah dibuat. (Nilai hash disembunyikan untuk keamanan)."
          action={
            canCreate ? (
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Buat API Key
              </button>
            ) : null
          }
        />

        <div className="overflow-x-auto border-t border-gray-100 mt-2">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-3">Nama Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dibuat Pada</th>
                <th className="px-4 py-3">Terakhir Digunakan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : !apiKeys || apiKeys.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Belum ada API Key yang dikonfigurasi.
                  </td>
                </tr>
              ) : (
                apiKeys.map((keyItem) => (
                  <tr
                    key={keyItem.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {keyItem.serviceName}
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5 max-w-[150px] truncate">
                        {keyItem.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-md border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(keyItem.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {keyItem.lastUsedAt
                        ? new Date(keyItem.lastUsedAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete && (
                        <button
                          onClick={() => setRevokeTargetId(keyItem.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          title="Revoke API Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generate API Key Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => {
          if (!generateApiKey.isPending) setIsGenerateModalOpen(false);
        }}
        title="Buat API Key Baru"
      >
        <p className="text-gray-600 text-sm mb-4">
          Masukkan nama service yang akan menggunakan API Key ini (tanpa spasi, contoh: wa-bot-primary).
        </p>
        <form onSubmit={handleGenerateSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name
            </label>
            <input
              type="text"
              autoFocus
              value={newServiceName}
              onChange={(e) =>
                setNewServiceName(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                )
              }
              placeholder="e.g. data-worker-1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all bg-white"
              disabled={generateApiKey.isPending}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Hanya huruf kecil, angka, dan dash yang diijinkan.
            </p>
          </div>

          {generateError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{generateError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={generateApiKey.isPending}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={generateApiKey.isPending || !newServiceName}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
            >
              {generateApiKey.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Generate Key
            </button>
          </div>
        </form>
      </Modal>

      {/* Newly Generated Key (Result Modal) */}
      <Modal
        isOpen={!!newlyGeneratedKey}
        onClose={() => {
          /* Prevent closing by clicking outside because secret must be explicitly acknowledged */
        }}
        title="Penting: Simpan API Key Anda"
      >
        <p className="text-gray-600 text-sm mb-4">
          Ini adalah satu-satunya kesempatan Anda melihat Secret Key ini. Kami tidak menyimpannya dalam bentuk mentah.
        </p>
        <div className="mt-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 space-y-1">
              <p className="font-semibold">Copy key ini sekarang juga!</p>
              <p>
                Setelah Anda menutup layar ini, Anda <strong>tidak akan bisa</strong> melihat key ini lagi. Pastikan Anda menyimpannya ke `.env` file service tujuan.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret API Key
            </label>
            <div className="relative group">
              <input
                type="text"
                readOnly
                value={newlyGeneratedKey?.apiKey || ""}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-mono text-sm tracking-widest outline-none pr-12"
              />
              <button
                type="button"
                onClick={handleCopySecret}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-white border border-gray-200 text-gray-600 hover:text-[#14a2bb] hover:border-[#14a2bb] shadow-sm transition-all"
                title="Copy API Key"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={closeResultModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
            >
              Saya Sudah Menyimpannya
            </button>
          </div>
        </div>
      </Modal>

      {/* Revoke Confirmation */}
      <ConfirmModal
        open={!!revokeTargetId}
        onCancel={() => !revokeApiKey.isPending && setRevokeTargetId(null)}
        title="Revoke API Key?"
        description="Service yang menggunakan kunci ini akan kehilangan akses ke Platform API seketika. Aksi ini tidak bisa dibatalkan."
        confirmLabel="Ya, Revoke"
        cancelLabel="Batal"
        loading={revokeApiKey.isPending}
        onConfirm={handleRevokeConfirm}
        variant="danger"
      />
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

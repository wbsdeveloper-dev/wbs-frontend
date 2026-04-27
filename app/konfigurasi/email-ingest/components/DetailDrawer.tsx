"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  TestTube,
  Loader2,
  Filter,
  Info,
  Settings,
} from "lucide-react";
import type { EmailSource } from "../page";
import CronScheduleSelector from "@/app/components/ui/CronScheduleSelector";

interface DetailDrawerProps {
  email: EmailSource | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (email: EmailSource) => void;
  onTestParse: (email: EmailSource) => void;
  isTestParsePending?: boolean;
  isUpdatePending?: boolean;
}

export default function DetailDrawer({
  email,
  isOpen,
  onClose,
  onUpdate,
  onTestParse,
  isTestParsePending,
  isUpdatePending,
}: DetailDrawerProps) {
  const [formData, setFormData] = useState<EmailSource | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (email) {
      setFormData({ ...email });
    }
  }, [email]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !email || !formData) return null;

  const handleSave = () => {
    if (formData) {
      onUpdate(formData);
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 overflow-hidden flex flex-col transform transition-transform duration-300 ease-out ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Detail Rule Ingestion
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Edit aturan filter dan jadwal sinkronisasi
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-[#115d72]/10 rounded-md">
                  <Info className="w-4 h-4 text-[#115d72]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Informasi Umum</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Rule
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                  placeholder="Contoh: Invoice Telkomsel"
                />
              </div>

              <CronScheduleSelector
                value={formData.cronSchedule || ""}
                onChange={(v) =>
                  setFormData({ ...formData, cronSchedule: v || null })
                }
              />

              <div className="pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#14a2bb] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#115d72]"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Sistem Aktif ({formData.isEnabled ? 'Ya' : 'Tidak'})
                  </span>
                </label>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-[#14a2bb]/10 rounded-md">
                  <Filter className="w-4 h-4 text-[#14a2bb]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Email Filter Criteria</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject Filter
                </label>
                <input
                  type="text"
                  value={formData.subjectFilter || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectFilter: e.target.value || null })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                  placeholder="e.g. Laporan Harian, Invoice"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sender Filter
                </label>
                <input
                  type="text"
                  value={formData.senderFilter || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, senderFilter: e.target.value || null })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                  placeholder="e.g. noreply@pln.co.id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Label Filter
                </label>
                <input
                  type="text"
                  value={formData.labelFilter || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, labelFilter: e.target.value || null })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                  placeholder="e.g. INBOX, CATEGORY_PROMOTIONS"
                />
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-100 rounded-md">
                    <Settings className="w-4 h-4 text-gray-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Advanced</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Source ID</div>
                  <div className="font-mono text-xs text-gray-900 break-all">{formData.id}</div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Last History ID</div>
                  <div className="font-mono text-xs text-gray-900">{formData.lastHistoryId || "—"}</div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Updated At</div>
                  <div className="text-sm text-gray-900">{formatDate(formData.updatedAt)}</div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Last Polled At</div>
                  <div className="text-sm text-gray-900">{formatDate(formData.lastPolledAt)}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => onTestParse(email)}
                  disabled={isTestParsePending}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isTestParsePending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <TestTube size={16} />
                  )}
                  {isTestParsePending ? "Running Test..." : "Run Test Parse (Dry Run)"}
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdatePending}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[#115d72] hover:bg-[#0d4a5c] rounded-lg transition-colors ring-2 ring-transparent ring-offset-2 hover:ring-[#115d72]/30 focus:outline-none disabled:opacity-50"
          >
            {isUpdatePending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isUpdatePending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  TestTube,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RotateCcw,
  ChevronDown,
  Loader2,
  Mail,
  Filter,
} from "lucide-react";
import type { EmailSource } from "../page";

interface DetailDrawerProps {
  email: EmailSource | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (email: EmailSource) => void;
  onTestParse: (email: EmailSource) => void;
  isTestParsePending?: boolean;
}

type TabType = "info" | "filters" | "advanced";

export default function DetailDrawer({
  email,
  isOpen,
  onClose,
  onUpdate,
  onTestParse,
  isTestParsePending,
}: DetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("info");
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

  const tabs: { id: TabType; label: string }[] = [
    { id: "info", label: "Info" },
    { id: "filters", label: "Email Filters" },
    { id: "advanced", label: "Advanced" },
  ];

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
        className={`fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-hidden flex flex-col transform transition-transform duration-300 ease-out ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-linear-to-r from-[#115d72]/5 to-transparent">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Detail Email Source
            </h2>
            <p className="text-sm text-gray-500 truncate max-w-[300px]">
              {email.emailAddress}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:rotate-90"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-all duration-200 relative ${
                activeTab === tab.id
                  ? "text-[#115d72]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#115d72] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, emailAddress: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cron Schedule
                </label>
                <input
                  type="text"
                  value={formData.cronSchedule || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, cronSchedule: e.target.value || null })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200 font-mono"
                  placeholder="0 8 * * *"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contoh: <code className="bg-gray-50 px-1 rounded">0 8 * * *</code> = setiap hari jam 08:00
                </p>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Status
                  </span>
                  <p className="text-xs text-gray-500">
                    {formData.isEnabled
                      ? "Email aktif menerima ingestion"
                      : "Email tidak aktif"}
                  </p>
                </div>
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
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#14a2bb] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#115d72]"></div>
                </label>
              </div>

              {/* Read-only info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Provider</span>
                  <span className="text-gray-700 font-medium">{email.provider}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Polled</span>
                  <span className="text-gray-700 font-medium">{formatDate(email.lastPolledAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-700 font-medium">{formatDate(email.createdAt)}</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-[0.98]"
              >
                <Save size={18} />
                Simpan Perubahan
              </button>
            </div>
          )}

          {/* Filters Tab */}
          {activeTab === "filters" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 mb-2">
                <Filter size={16} className="text-[#115d72]" />
                <span className="text-sm font-medium text-gray-700">Email Filtering Rules</span>
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                  placeholder="Laporan Harian, Report Gas"
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
                  value={formData.senderFilter || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, senderFilter: e.target.value || null })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                  placeholder="noreply@pln.co.id"
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                  placeholder="INBOX"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Gmail label untuk filter, e.g. INBOX, CATEGORY_UPDATES
                </p>
              </div>

              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-[0.98]"
              >
                <Save size={18} />
                Simpan Filter
              </button>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === "advanced" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Test Parse
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Trigger test parse untuk email ini. Akan membuat job EMAIL_INGEST dalam mode dry-run.
                </p>
                <button
                  onClick={() => onTestParse(email)}
                  disabled={isTestParsePending}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#115d72] text-white rounded-lg text-sm font-medium hover:bg-[#0d4a5c] transition-all duration-200 disabled:opacity-50"
                >
                  {isTestParsePending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <TestTube size={16} />
                  )}
                  {isTestParsePending ? "Running..." : "Run Test Parse"}
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Source ID
                </h4>
                <code className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 font-mono block break-all">
                  {email.id}
                </code>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  History ID
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  Gmail history ID terakhir yang dipolling
                </p>
                <code className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 font-mono block">
                  {email.lastHistoryId || "—"}
                </code>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Timestamps
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-700">{formatDate(email.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Updated</span>
                    <span className="text-gray-700">{formatDate(email.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Last Polled</span>
                    <span className="text-gray-700">{formatDate(email.lastPolledAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}

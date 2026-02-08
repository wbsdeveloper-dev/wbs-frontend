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
  Webhook,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { EmailAddress } from "../page";

interface DetailDrawerProps {
  email: EmailAddress | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (email: EmailAddress) => void;
  templates: string[];
  sites: string[];
}

type TabType = "info" | "parsing" | "history" | "advanced";

// Mock history data
const MOCK_HISTORY = [
  { time: "2026-02-08 14:30:00", status: "success", brief: "Parsed 12 records successfully" },
  { time: "2026-02-08 12:00:00", status: "success", brief: "Parsed 8 records successfully" },
  { time: "2026-02-08 09:30:00", status: "warning", brief: "Parsed with 2 warnings" },
  { time: "2026-02-07 23:45:00", status: "error", brief: "Failed: Missing required field 'site_name'" },
  { time: "2026-02-07 21:00:00", status: "success", brief: "Parsed 15 records successfully" },
];

// Mock parsed fields
const MOCK_PARSED_FIELDS = [
  { field: "site_name", value: "PLN IP Jakarta", status: "success" },
  { field: "metric_type", value: "gas_consumption", status: "success" },
  { field: "value", value: "1250.5", status: "success" },
  { field: "period", value: "2026-02-08", status: "success" },
  { field: "unit", value: "MMBTU", status: "warning", message: "Assumed from context" },
];

export default function DetailDrawer({
  email,
  isOpen,
  onClose,
  onUpdate,
  templates,
  sites,
}: DetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [formData, setFormData] = useState<EmailAddress | null>(null);
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

  const tabs: { id: TabType; label: string }[] = [
    { id: "info", label: "Info" },
    { id: "parsing", label: "Parsing Preview" },
    { id: "history", label: "History / Logs" },
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
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#115d72]/5 to-transparent">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Detail Email</h2>
            <p className="text-sm text-gray-500 truncate max-w-[300px]">
              {email.email}
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
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Label / Keterangan
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Provider
                </label>
                <div className="relative">
                  <select
                    value={formData.provider}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        provider: e.target.value as "PLN" | "Internal" | "Other",
                      })
                    }
                    className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10 transition-all duration-200"
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
                    value={formData.siteMapping || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        siteMapping: e.target.value || null,
                      })
                    }
                    className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10 transition-all duration-200"
                  >
                    <option value="">-- Pilih Site --</option>
                    {sites.map((site) => (
                      <option key={site} value={site}>
                        {site}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Applied Template
                </label>
                <div className="relative">
                  <select
                    value={formData.appliedTemplate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appliedTemplate: e.target.value || null,
                      })
                    }
                    className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10 transition-all duration-200"
                  >
                    <option value="">-- Pilih Template --</option>
                    {templates.map((template) => (
                      <option key={template} value={template}>
                        {template}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <p className="text-xs text-gray-500">
                    {formData.status === "active" ? "Email aktif menerima ingestion" : "Email tidak aktif"}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === "active"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.checked ? "active" : "inactive",
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#14a2bb] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#115d72]"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent resize-none transition-all duration-200"
                  placeholder="Catatan tambahan..."
                />
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

          {/* Parsing Preview Tab */}
          {activeTab === "parsing" && (
            <div className="space-y-4 animate-fadeIn">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-[0.98]">
                <TestTube size={18} />
                Test Parse
              </button>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Hasil Parsing Terakhir
                </h4>
                <div className="space-y-2">
                  {MOCK_PARSED_FIELDS.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start gap-2">
                        {item.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            {item.field}
                          </span>
                          {item.message && (
                            <p className="text-xs text-yellow-600">{item.message}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">1 Warning</p>
                    <p className="text-xs text-yellow-700">
                      Field &apos;unit&apos; was assumed from context. Please verify.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-3 animate-fadeIn">
              <p className="text-sm text-gray-500 mb-4">
                10 event ingestion terakhir
              </p>
              {MOCK_HISTORY.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="mt-0.5">
                    {item.status === "success" && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {item.status === "warning" && (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    {item.status === "error" && (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{item.brief}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === "advanced" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Raw Email Reference
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Link ke email asli yang terakhir diproses
                </p>
                <button className="flex items-center gap-2 text-sm text-[#115d72] hover:text-[#0d4a5c] font-medium transition-colors duration-200">
                  <ExternalLink size={16} />
                  Lihat Email Asli
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Retry Controls
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Requeue email untuk di-parse ulang
                </p>
                <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200">
                  <RotateCcw size={16} />
                  Requeue for Processing
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Webhook Test
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Test webhook endpoint untuk email ini
                </p>
                <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200">
                  <Webhook size={16} />
                  Send Test Webhook
                </button>
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

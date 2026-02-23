"use client";

import { useState } from "react";
import { X, MessageSquare } from "lucide-react";
import {
  useDropdowns,
  useCreateMapping,
  useMappings,
  type CreateMappingPayload,
} from "@/hooks/service/site-api";

interface SiteMappingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SiteMappingModal({
  open,
  onClose,
  onSuccess,
}: SiteMappingModalProps) {
  const { data: dropdowns, isLoading: isLoadingDropdowns } = useDropdowns();
  const { data: existingMappings, isLoading: isLoadingMappings } =
    useMappings("WA");
  const createMappingMutation = useCreateMapping({
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
    },
  });

  const [formData, setFormData] = useState<CreateMappingPayload>({
    source_type: "WA",
    source_name: "",
    normalized_site_id: "",
    mapping_method: "MANUAL",
  });

  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      source_type: "WA",
      source_name: "",
      normalized_site_id: "",
      mapping_method: "MANUAL",
    });
    setSelectedSite(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.source_name.trim()) {
      newErrors.source_name = "Nama sumber (WhatsApp) wajib diisi";
    }
    if (!selectedSite) {
      newErrors.normalized_site_id = "Site tujuan wajib dipilih";
    }

    // Check for duplicate mappings
    const duplicate = existingMappings?.find(
      (m) =>
        m.source_name.toLowerCase() === formData.source_name.toLowerCase() &&
        m.source_type === formData.source_type,
    );
    if (duplicate) {
      newErrors.source_name = `Mapping untuk "${formData.source_name}" sudah ada`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload: CreateMappingPayload = {
      source_type: formData.source_type,
      source_name: formData.source_name,
      normalized_site_id: selectedSite!,
      mapping_method: formData.mapping_method,
    };

    createMappingMutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#115d72]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Mapping Pesan WhatsApp
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Info Box */}
        <div className="px-6 py-4 bg-[#f0f9ff] border-b border-[#bae6fd]">
          <p className="text-sm text-[#0c4a6e]">
            Hubungkan nama sumber dari pesan WhatsApp ke site yang sesuai dalam
            sistem. Mapping ini akan digunakan untuk otomatisasi pemrosesan
            data.
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Source Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Sumber
            </label>
            <select
              value={formData.source_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  source_type: e.target.value as "WA" | "EMAIL",
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white transition-all duration-200"
            >
              <option value="WA">WhatsApp</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>

          {/* Source Name (WhatsApp Group/Sender Name) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Sumber (WhatsApp)
            </label>
            <input
              type="text"
              value={formData.source_name}
              onChange={(e) => {
                setFormData({ ...formData, source_name: e.target.value });
                setErrors({ ...errors, source_name: "" });
              }}
              placeholder="Masukkan nama grup atau pengirim WhatsApp"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200 ${
                errors.source_name
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.source_name ? (
              <p className="text-xs text-red-600 mt-1">{errors.source_name}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Contoh: MKG Power, Suralaya Update, dll.
              </p>
            )}
          </div>

          {/* Site Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Tujuan
            </label>
            <select
              value={selectedSite || ""}
              onChange={(e) => {
                setSelectedSite(e.target.value || null);
                setErrors({ ...errors, normalized_site_id: "" });
              }}
              disabled={isLoadingDropdowns}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white transition-all duration-200 ${
                errors.normalized_site_id
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            >
              <option value="">Cari site untuk dihubungkan...</option>
              {dropdowns?.plants.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            {errors.normalized_site_id && (
              <p className="text-xs text-red-600 mt-1">
                {errors.normalized_site_id}
              </p>
            )}
          </div>

          {/* Mapping Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Mapping
            </label>
            <select
              value={formData.mapping_method}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mapping_method: e.target.value as "MANUAL" | "AUTO",
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white transition-all duration-200"
            >
              <option value="MANUAL">Manual</option>
              <option value="AUTO">Otomatis</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMappingMutation.isPending}
            className="px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {createMappingMutation.isPending
              ? "Menyimpan..."
              : "Simpan Mapping"}
          </button>
        </div>
      </div>
    </div>
  );
}

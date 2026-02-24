"use client";

import { useState, useEffect } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import {
  useDropdowns,
  useRelation,
  useCreateRelation,
  useUpdateRelation,
  type CreateRelationPayload,
  type SiteRelation,
} from "@/hooks/service/site-api";

interface AddRelationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingId?: string | null;
}

export function AddRelationModal({
  open,
  onClose,
  onSuccess,
  editingId,
}: AddRelationModalProps) {
  const { data: dropdowns, isLoading: isLoadingDropdowns } = useDropdowns();
  const createRelationMutation = useCreateRelation({
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
    },
  });

  const updateRelationMutation = useUpdateRelation({
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
    },
  });

  const [formData, setFormData] = useState<CreateRelationPayload>({
    source_site_id: "",
    target_site_id: "",
    relation_type: "",
    commodity: "",
    priority: 1,
  });

  const [selectedSourceSite, setSelectedSourceSite] = useState<string | null>(
    null,
  );
  const [selectedTargetSite, setSelectedTargetSite] = useState<string | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load relation data for editing
  const { data: editingRelation } = useRelation(editingId || "");

  // Populate form when editing
  useEffect(() => {
    if (editingId && editingRelation) {
      setFormData({
        source_site_id: editingRelation.source_site_id,
        target_site_id: editingRelation.target_site_id,
        relation_type: editingRelation.relation_type,
        commodity: editingRelation.commodity,
        priority: editingRelation.priority,
      });
      setSelectedSourceSite(editingRelation.source_site_id);
      setSelectedTargetSite(editingRelation.target_site_id);
    }
  }, [editingId, editingRelation]);

  const resetForm = () => {
    setFormData({
      source_site_id: "",
      target_site_id: "",
      relation_type: "",
      commodity: "",
      priority: 1,
    });
    setSelectedSourceSite(null);
    setSelectedTargetSite(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedSourceSite) {
      newErrors.source_site_id = "Site sumber wajib dipilih";
    }
    if (!selectedTargetSite) {
      newErrors.target_site_id = "Site tujuan wajib dipilih";
    }
    if (selectedSourceSite === selectedTargetSite) {
      newErrors.target_site_id =
        "Site tujuan tidak boleh sama dengan site sumber";
    }
    if (!formData.commodity.trim()) {
      newErrors.commodity = "Komoditas wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload: CreateRelationPayload = {
      source_site_id: selectedSourceSite!,
      target_site_id: selectedTargetSite!,
      relation_type: "PEMASOK - PEMBANGKIT",
      commodity: formData.commodity,
      priority: formData.priority,
    };

    if (editingId) {
      updateRelationMutation.mutate({ id: editingId, payload });
    } else {
      createRelationMutation.mutate(payload);
    }
  };

  const commodities = ["Gas"];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-[#115d72]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Relasi" : "Tambah Relasi Pemasok - Pembangkit"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Source Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Sumber
            </label>
            <select
              value={selectedSourceSite || ""}
              onChange={(e) => {
                setSelectedSourceSite(e.target.value || null);
                setErrors({ ...errors, source_site_id: "" });
              }}
              disabled={isLoadingDropdowns}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white transition-all duration-200"
            >
              <option value="">Cari site sumber...</option>
              {dropdowns?.suppliers.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            {errors.source_site_id && (
              <p className="text-xs text-red-600 mt-1">
                {errors.source_site_id}
              </p>
            )}
          </div>

          {/* Target Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Tujuan
            </label>
            <select
              value={selectedTargetSite || ""}
              onChange={(e) => {
                setSelectedTargetSite(e.target.value || null);
                setErrors({ ...errors, target_site_id: "" });
              }}
              disabled={isLoadingDropdowns}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white transition-all duration-200"
            >
              <option value="">Cari site tujuan...</option>
              {dropdowns?.plants.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            {errors.target_site_id && (
              <p className="text-xs text-red-600 mt-1">
                {errors.target_site_id}
              </p>
            )}
          </div>

          {/* Commodity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Komoditas
            </label>
            <select
              value={formData.commodity}
              onChange={(e) => {
                setFormData({ ...formData, commodity: e.target.value });
                setErrors({ ...errors, commodity: "" });
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white transition-all duration-200"
            >
              <option value="">Pilih komoditas...</option>
              {commodities.map((commodity) => (
                <option key={commodity} value={commodity}>
                  {commodity}
                </option>
              ))}
            </select>
            {errors.commodity && (
              <p className="text-xs text-red-600 mt-1">{errors.commodity}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioritas
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value ? parseInt(e.target.value) : 1,
                })
              }
              min={1}
              max={100}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Semakin tinggi angka, semakin prioritas
            </p>
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
            disabled={
              createRelationMutation.isPending ||
              updateRelationMutation.isPending
            }
            className="px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {createRelationMutation.isPending ||
            updateRelationMutation.isPending
              ? "Menyimpan..."
              : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

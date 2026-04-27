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

  const [formData, setFormData] = useState<Omit<CreateRelationPayload, "target_site_ids" | "source_site_ids">>({
    relation_type: "",
    commodity: "",
    priority: 1,
  });

  const [selectedSourceSites, setSelectedSourceSites] = useState<string[]>([]);
  const [selectedTargetSites, setSelectedTargetSites] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load relation data for editing
  const { data: editingRelation } = useRelation(editingId || "");

  // Populate form when editing
  useEffect(() => {
    if (editingId && editingRelation) {
      setFormData({
        relation_type: editingRelation.relation_type,
        commodity: editingRelation.commodity,
        priority: editingRelation.priority,
      });
      setSelectedSourceSites([editingRelation.source_site_id]);
      setSelectedTargetSites([editingRelation.target_site_id]);
    }
  }, [editingId, editingRelation]);

  const resetForm = () => {
    setFormData({
      relation_type: "",
      commodity: "",
      priority: 1,
    });
    setSelectedSourceSites([]);
    setSelectedTargetSites([]);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (selectedSourceSites.length === 0) {
      newErrors.source_site_ids = "Site sumber wajib dipilih";
    }
    if (selectedTargetSites.length === 0) {
      newErrors.target_site_ids = "Site tujuan wajib dipilih";
    }
    if (selectedTargetSites.some((targetId) => selectedSourceSites.includes(targetId))) {
      newErrors.target_site_ids =
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
      source_site_ids: selectedSourceSites,
      target_site_ids: selectedTargetSites,
      relation_type: "PEMASOK - PEMBANGKIT",
      commodity: formData.commodity,
      priority: formData.priority,
    };

    if (editingId) {
      updateRelationMutation.mutate({ 
        id: editingId, 
        payload: {
          source_site_id: selectedSourceSites[0],
          target_site_id: selectedTargetSites[0],
          relation_type: "PEMASOK - PEMBANGKIT",
          commodity: formData.commodity,
          priority: formData.priority,
        }
      });
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
              Site Sumber {editingId ? "" : "(Bisa pilih lebih dari satu)"}
            </label>
            <div className="w-full max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white p-2 space-y-1">
              {dropdowns?.suppliers.map((site) => (
                <label
                  key={site.id}
                  className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    selectedSourceSites.includes(site.id)
                      ? "bg-[#14a2bb]/10 text-[#115d72]"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <input
                    type={editingId ? "radio" : "checkbox"}
                    name="source_site"
                    value={site.id}
                    checked={selectedSourceSites.includes(site.id)}
                    onChange={(e) => {
                      if (editingId) {
                        setSelectedSourceSites([site.id]);
                      } else {
                        if (e.target.checked) {
                          setSelectedSourceSites((prev) => [...prev, site.id]);
                        } else {
                          setSelectedSourceSites((prev) =>
                            prev.filter((id) => id !== site.id),
                          );
                        }
                      }
                      setErrors({ ...errors, source_site_ids: "" });
                    }}
                    disabled={isLoadingDropdowns}
                    className="mr-3 w-4 h-4 text-[#14a2bb] focus:ring-[#14a2bb] border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm">{site.name}</span>
                </label>
              ))}
              {dropdowns?.suppliers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  Tidak ada site sumber
                </p>
              )}
            </div>
            {errors.source_site_ids && (
              <p className="text-xs text-red-600 mt-1">
                {errors.source_site_ids}
              </p>
            )}
          </div>

          {/* Target Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Tujuan {editingId ? "" : "(Bisa pilih lebih dari satu)"}
            </label>
            <div className="w-full max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white p-2 space-y-1">
              {dropdowns?.plants.map((site) => (
                <label
                  key={site.id}
                  className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
                    selectedTargetSites.includes(site.id)
                      ? "bg-[#14a2bb]/10 text-[#115d72]"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <input
                    type={editingId ? "radio" : "checkbox"}
                    name="target_site"
                    value={site.id}
                    checked={selectedTargetSites.includes(site.id)}
                    onChange={(e) => {
                      if (editingId) {
                        setSelectedTargetSites([site.id]);
                      } else {
                        if (e.target.checked) {
                          setSelectedTargetSites((prev) => [...prev, site.id]);
                        } else {
                          setSelectedTargetSites((prev) =>
                            prev.filter((id) => id !== site.id),
                          );
                        }
                      }
                      setErrors({ ...errors, target_site_ids: "" });
                    }}
                    disabled={isLoadingDropdowns}
                    className="mr-3 w-4 h-4 text-[#14a2bb] focus:ring-[#14a2bb] border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm">{site.name}</span>
                </label>
              ))}
              {dropdowns?.plants.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  Tidak ada site tujuan
                </p>
              )}
            </div>
            {errors.target_site_ids && (
              <p className="text-xs text-red-600 mt-1">
                {errors.target_site_ids}
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

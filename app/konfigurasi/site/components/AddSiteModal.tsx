"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Search } from "lucide-react";
import {
  useDropdowns,
  useSites,
  useCreateSite,
  useUpdateSite,
  type CreateSitePayload,
  type Site,
} from "@/hooks/service/site-api";

interface AddSiteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingId?: string | null;
}

export function AddSiteModal({
  open,
  onClose,
  onSuccess,
  editingId,
}: AddSiteModalProps) {
  const { data: dropdowns, isLoading: isLoadingDropdowns } = useDropdowns();
  const createSiteMutation = useCreateSite({
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
    },
  });

  const updateSiteMutation = useUpdateSite({
    onSuccess: () => {
      onSuccess();
      onClose();
      resetForm();
    },
  });

  const [formData, setFormData] = useState<CreateSitePayload>({
    name: "",
    site_type: "PEMBANGKIT",
    region: "",
    capacity: undefined,
  });

  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [plantSearch, setPlantSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: "",
      site_type: "PEMBANGKIT",
      region: "",
      capacity: undefined,
    });
    setSelectedPlant(null);
    setSelectedSupplier(null);
    setPlantSearch("");
    setSupplierSearch("");
    setErrors({});
  };

  // Load site data for editing
  const { data: sites } = useSites();
  const editingSite = sites?.find((s) => s.id === editingId);

  // Populate form when editing
  useEffect(() => {
    if (editingId && editingSite) {
      setFormData({
        name: editingSite.name,
        site_type: editingSite.site_type,
        region: editingSite.region,
        capacity: editingSite.capacity ?? undefined,
      });
      setSelectedPlant(editingSite.pembangkit_id || null);
      setSelectedSupplier(editingSite.pemasok_id || null);
    }
  }, [editingId, editingSite]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama site wajib diisi";
    }
    if (!formData.region.trim() && formData.site_type != "TRANSPORTIR") {
      newErrors.region = "Region wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload: CreateSitePayload = {
      name: formData.name,
      site_type: formData.site_type,
      region: formData.region,
      capacity: formData.capacity,
    };

    // Include lat, long, and conversion_factor from editing site if available
    if (editingSite) {
      payload.lat = editingSite.lat;
      payload.long = editingSite.long;
      payload.conversion_factor = editingSite.conversion_factor;
    }

    // Use appropriate mutation
    if (editingId) {
      updateSiteMutation.mutate({ id: editingId, payload });
    } else {
      createSiteMutation.mutate(payload);
    }
  };

  const handleSiteTypeChange = (
    siteType: "PEMBANGKIT" | "PEMASOK" | "TRANSPORTIR",
  ) => {
    setFormData({ ...formData, site_type: siteType });
    setSelectedPlant(null);
    setSelectedSupplier(null);
    setPlantSearch("");
    setSupplierSearch("");
    setErrors({ ...errors, pembangkit_id: "", pemasok_id: "" });
  };

  // Filter plants based on search
  const filteredPlants =
    dropdowns?.plants.filter((plant) =>
      plant.name.toLowerCase().includes(plantSearch.toLowerCase()),
    ) || [];

  // Filter suppliers based on search
  const filteredSuppliers =
    dropdowns?.suppliers.filter((supplier) =>
      supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()),
    ) || [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#115d72]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Site" : "Tambah Site Baru"}
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
          {/* Site Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis
            </label>
            <select
              value={formData.site_type}
              onChange={(e) =>
                handleSiteTypeChange(e.target.value as "PEMBANGKIT" | "PEMASOK")
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white transition-all duration-200"
            >
              <option value="PEMBANGKIT">Pembangkit</option>
              <option value="PEMASOK">Pemasok</option>
              <option value="TRANSPORTIR">Transportir</option>
            </select>
          </div>

          {/* Site Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Masukkan nama site"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200 ${
                errors.name
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Region */}

          {formData.site_type != "TRANSPORTIR" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                placeholder="Masukkan region"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200 ${
                  errors.region
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.region && (
                <p className="text-xs text-red-600 mt-1">{errors.region}</p>
              )}
            </div>
          )}

          {formData.site_type != "TRANSPORTIR" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapasitas (MW)
              </label>
              <input
                type="number"
                value={formData.capacity ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: Number(e.target.value) })
                }
                placeholder="Masukkan kapasitas"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200 ${
                  errors.capacity
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.capacity && (
                <p className="text-xs text-red-600 mt-1">{errors.capacity}</p>
              )}
            </div>
          )}

          {/* Latitude */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="number"
              value={formData.lat || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lat: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              step="any"
              placeholder="-6.123456"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Longitude */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="number"
              value={formData.long || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  long: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              step="any"
              placeholder="106.123456"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Conversion Factor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faktor Konversi
            </label>
            <input
              type="number"
              value={formData.conversion_factor || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conversion_factor: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              step="any"
              placeholder="1000"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Opsional: Faktor konversi untuk satuan
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
              createSiteMutation.isPending || updateSiteMutation.isPending
            }
            className="px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {createSiteMutation.isPending || updateSiteMutation.isPending
              ? "Menyimpan..."
              : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

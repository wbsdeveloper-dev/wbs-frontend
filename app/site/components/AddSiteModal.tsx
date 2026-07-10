"use client";

import { useState, useEffect, useCallback } from "react";
import { X, MapPin, Search } from "lucide-react";
import {
  useDropdowns,
  useSites,
  useCreateSite,
  useUpdateSite,
  type CreateSitePayload,
  type Site,
} from "@/hooks/service/site-api";
import { Autocomplete, TextField } from "@mui/material";
import { useKertasKerjaMaster } from "@/hooks/service/kertas-kerja-api";

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
  const { data: dropdowns, isLoading: isLoadingDropdowns } = useDropdowns({ enabled: open });
  const { data: regions = [], isLoading: isLoadingRegions } = useKertasKerjaMaster("master_region", "GAS PIPA,LNG", { enabled: open });

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
    capacity_mw: undefined,
    lat: undefined,
    long: undefined,
    conversion_factor: undefined,
    owner: "",
    commodity: "",
  });

  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [plantSearch, setPlantSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      site_type: "PEMBANGKIT",
      region: "",
      capacity: undefined,
      capacity_mw: undefined,
      lat: undefined,
      long: undefined,
      conversion_factor: undefined,
      owner: "",
      commodity: "",
    });
    setSelectedPlant(null);
    setSelectedSupplier(null);
    setPlantSearch("");
    setSupplierSearch("");
    setErrors({});
  }, []);

  // Load site data for editing
  const { data: sites } = useSites();
  const editingSite = sites?.find((s) => s.id === editingId);

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (editingId && editingSite) {
        setFormData({
          name: editingSite.name,
          site_type: editingSite.site_type,
          region: editingSite.region,
          capacity: editingSite.capacity ?? undefined,
          capacity_mw: editingSite.capacity_mw ?? undefined,
          lat: editingSite.lat,
          long: editingSite.long,
          conversion_factor: editingSite.conversion_factor,
          owner: editingSite.owner ?? "",
          commodity: editingSite.commodity ?? "",
        });
        setSelectedPlant(editingSite.pembangkit_id || null);
        setSelectedSupplier(editingSite.pemasok_id || null);
      } else if (!editingId) {
        resetForm();
      }
    }
  }, [open, editingId, editingSite, resetForm]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama site wajib diisi";
    } else {
      const isDuplicate = sites?.some(
        (site) =>
          site.id !== editingId &&
          site.name.toLowerCase() === formData.name.trim().toLowerCase() &&
          site.commodity === formData.commodity,
      );
      if (isDuplicate) {
        newErrors.name = "Nama site sudah terdaftar, silakan gunakan nama lain";
      }
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
      capacity: formData.capacity ?? null,
      capacity_mw: formData.capacity_mw ?? null,
      lat: formData.lat ?? null,
      long: formData.long ?? null,
      conversion_factor: formData.conversion_factor,
      owner: formData.owner || undefined,
      commodity: formData.commodity || undefined,
    };

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
    setFormData({
      ...formData,
      site_type: siteType,
      conversion_factor:
        siteType === "PEMASOK" ? formData.conversion_factor : undefined,
    });
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
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
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0"
        >
          {/* Site Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis
            </label>
            <Autocomplete
              options={[
                { value: "PEMBANGKIT", label: "Pembangkit" },
                { value: "PEMASOK", label: "Pemasok" },
                { value: "TRANSPORTIR", label: "Transportir" }
              ]}
              getOptionLabel={(option) => option.label}
              value={[
                { value: "PEMBANGKIT", label: "Pembangkit" },
                { value: "PEMASOK", label: "Pemasok" },
                { value: "TRANSPORTIR", label: "Transportir" }
              ].find((opt) => opt.value === formData.site_type) || null}
              onChange={(event, newValue) => {
                if (newValue) {
                  handleSiteTypeChange(newValue.value as "PEMBANGKIT" | "PEMASOK");
                }
              }}
              isOptionEqualToValue={(option, value) => option.value === value?.value}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Pilih jenis"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      padding: '4px 14px',
                      borderRadius: '0.5rem',
                      '& fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#0ea5e9',
                      },
                    }
                  }}
                />
              )}
            />
          </div>

          {/* Kepemilikan */}
          {formData.site_type == "PEMBANGKIT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kepemilikan
              </label>
              <Autocomplete
                options={["PLN", "PLN IP", "PLN NP"]}
                value={formData.owner || null}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, owner: newValue || "" });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Pilih kepemilikan"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '4px 14px',
                        borderRadius: '0.5rem',
                        '& fieldset': {
                          borderColor: '#d1d5db',
                        },
                        '&:hover fieldset': {
                          borderColor: '#d1d5db',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#0ea5e9',
                        },
                      }
                    }}
                  />
                )}
              />
            </div>
          )}

          {/* Komoditas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Komoditas
            </label>
            <Autocomplete
              options={["GAS PIPA", "LNG", "BBM"]}
              value={formData.commodity || null}
              onChange={(event, newValue) => {
                setFormData({ ...formData, commodity: newValue || "" });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Pilih Komoditas"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      padding: '4px 14px',
                      borderRadius: '0.5rem',
                      '& fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#0ea5e9',
                      },
                    }
                  }}
                />
              )}
            />
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
              className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 ${errors.name
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
              <Autocomplete
                options={regions}
                getOptionLabel={(option) => option.name}
                value={
                  regions.find((r) => r.name === formData.region) || null
                }
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    region: newValue ? newValue.name : "",
                  });
                }}
                isOptionEqualToValue={(option, value) => option.name === value?.name}
                loading={isLoadingRegions}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Pilih region"
                    error={!!errors.region}
                    helperText={errors.region}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '4px 14px',
                        borderRadius: '0.5rem',
                        '& fieldset': {
                          borderColor: errors.region ? '#ef4444' : '#d1d5db',
                        },
                        '&:hover fieldset': {
                          borderColor: errors.region ? '#ef4444' : '#d1d5db',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: errors.region ? '#ef4444' : '#0ea5e9', // using typical focus ring color for gas
                        },
                      },
                      '& .MuiFormHelperText-root': {
                        marginLeft: 0,
                        marginRight: 0,
                        marginTop: '4px',
                        fontSize: '0.75rem',
                        color: '#dc2626',
                      }
                    }}
                  />
                )}
              />
            </div>
          )}

          {/* Kapasitas (kL) */}
          {(formData.site_type === "PEMBANGKIT" || formData.site_type === "PEMASOK") && formData.commodity === "BBM" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapasitas (kL)
              </label>
              <input
                type="number"
                value={formData.capacity ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="Masukkan kapasitas (kL)"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 ${errors.capacity
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                  }`}
              />
              {errors.capacity && (
                <p className="text-xs text-red-600 mt-1">{errors.capacity}</p>
              )}
            </div>
          )}

          {/* Kapasitas MW */}
          {(formData.site_type === "PEMBANGKIT" || formData.site_type === "PEMASOK") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapasitas (MW)
              </label>
              <input
                type="number"
                step="any"
                value={formData.capacity_mw ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity_mw: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="Masukkan kapasitas (MW)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
              />
            </div>
          )}

          {/* Latitude */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="text"
              value={formData.lat ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lat: e.target.value || undefined,
                })
              }
              placeholder="-6.123456"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Longitude */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="text"
              value={formData.long ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  long: e.target.value || undefined,
                })
              }
              placeholder="106.123456"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Conversion Factor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faktor Konversi
            </label>
            <input
              type="number"
              value={formData.conversion_factor ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conversion_factor: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              disabled={formData.site_type !== "PEMASOK"}
              step="any"
              placeholder="1000"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all duration-200 ${formData.site_type !== "PEMASOK"
                  ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                }`}
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
            className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
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

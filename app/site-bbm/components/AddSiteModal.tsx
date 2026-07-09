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
import { useKertasKerjaMaster } from "@/hooks/service/kertas-kerja-api";
import { Autocomplete, TextField } from "@mui/material";

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
  const { data: jenisKits = [] } = useKertasKerjaMaster("master_jenis_kit", undefined, { enabled: open });
  const { data: upks = [] } = useKertasKerjaMaster("master_unit_pelaksana", undefined, { enabled: open });
  const { data: regions = [] } = useKertasKerjaMaster("master_region", undefined, { enabled: open });
  const { data: units = [] } = useKertasKerjaMaster("master_unit", undefined, { enabled: open });
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
    lat: undefined,
    long: undefined,
    conversion_factor: undefined,
    owner: "",
    commodity: "BBM",
    kit_id: "",
    upk_id: "",
    unit_id: "",
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
      lat: undefined,
      long: undefined,
      conversion_factor: undefined,
      owner: "",
      commodity: "BBM",
      kit_id: "",
      upk_id: "",
      unit_id: "",
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
          lat: editingSite.lat,
          long: editingSite.long,
          conversion_factor: editingSite.conversion_factor,
          owner: editingSite.owner ?? "",
          commodity: editingSite.commodity ?? "",
          kit_id: editingSite.kit_id ?? "",
          upk_id: editingSite.upk_id ?? "",
          unit_id: editingSite.unit_id ?? "",
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
      lat: formData.lat ?? null,
      long: formData.long ?? null,
      conversion_factor: formData.conversion_factor,
      owner: formData.owner || undefined,
      commodity: formData.commodity || undefined,
      kit_id: formData.kit_id || undefined,
      upk_id: formData.upk_id || undefined,
      unit_id: formData.unit_id || undefined,
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
          {/* Komoditas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Komoditas
            </label>
            <input
              type="text"
              value="BBM"
              readOnly
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
            />
          </div>
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent bg-white transition-all duration-200"
            >
              <option value="PEMBANGKIT">Pembangkit</option>
              <option value="PEMASOK">TBBM</option>
            </select>
          </div>

          {/* Kepemilikan */}
          {formData.site_type == "PEMBANGKIT" && (
            <div>
              <label className="blocks text-sm font-medium text-gray-700 mb-2">
                Kepemilikan
              </label>
              <select
                value={formData.owner ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, owner: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent bg-white transition-all duration-200"
              >
                <option value="">Pilih kepemilikan</option>
                <option value="PLN">PLN</option>
                <option value="PLN IP">PLN IP</option>
                <option value="PLN NP">PLN NP</option>
              </select>
            </div>
          )}

          {/* Jenis Site (Jenis Kit) */}
          {formData.site_type == "PEMBANGKIT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kit
              </label>
              <Autocomplete
                options={jenisKits}
                getOptionLabel={(option: any) => option.name}
                value={jenisKits.find((j: any) => j.id === formData.kit_id) || null}
                onChange={(_event, newValue: any) => {
                  setFormData({
                    ...formData,
                    kit_id: newValue ? newValue.id : "",
                  });
                }}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderOption={(props, option: any) => {
                  const { key, ...otherProps } = props as any;
                  return (
                    <li key={option.id} {...otherProps}>
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Pilih jenis kit"
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "0.5rem", // matches rounded-lg
                        backgroundColor: "white",
                      },
                    }}
                  />
                )}
                className="w-full"
              />
            </div>
          )}

          {/* Unit Pelaksana */}
          {formData.site_type == "PEMBANGKIT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Pelaksana
              </label>
              <Autocomplete
                options={upks}
                getOptionLabel={(option: any) => option.name}
                value={upks.find((j: any) => j.id === formData.upk_id) || null}
                onChange={(_event, newValue: any) => {
                  setFormData({
                    ...formData,
                    upk_id: newValue ? newValue.id : "",
                  });
                }}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderOption={(props, option: any) => {
                  const { key, ...otherProps } = props as any;
                  return (
                    <li key={option.id} {...otherProps}>
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Pilih unit pelaksana"
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "0.5rem",
                        backgroundColor: "white",
                      },
                    }}
                  />
                )}
                className="w-full"
              />
            </div>
          )}

          {/* Unit */}
          {formData.site_type == "PEMBANGKIT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <Autocomplete
                options={units}
                getOptionLabel={(option: any) => option.name}
                value={units.find((j: any) => j.id === formData.unit_id) || null}
                onChange={(_event, newValue: any) => {
                  setFormData({
                    ...formData,
                    unit_id: newValue ? newValue.id : "",
                  });
                }}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderOption={(props, option: any) => {
                  const { key, ...otherProps } = props as any;
                  return (
                    <li key={option.id} {...otherProps}>
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Pilih unit"
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "0.5rem",
                        backgroundColor: "white",
                      },
                    }}
                  />
                )}
                className="w-full"
              />
            </div>
          )}

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
                options={regions.map((r: any) => r.name)}
                value={formData.region}
                onChange={(_event, newValue: string | null) => {
                  setFormData({
                    ...formData,
                    region: newValue || "",
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Pilih region"
                    variant="outlined"
                    size="small"
                    error={!!errors.region}
                    helperText={errors.region}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "0.5rem",
                        backgroundColor: "white",
                      },
                    }}
                  />
                )}
                className="w-full"
              />
            </div>
          )}

          {formData.site_type != "TRANSPORTIR" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kapasitas (KL)
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
                placeholder="Masukkan kapasitas"
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
            className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:brightness-90 transition-all duration-200 hover:shadow-md active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
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

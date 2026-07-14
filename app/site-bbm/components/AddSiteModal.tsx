"use client";

import { useState, useEffect, useCallback } from "react";
import { X, MapPin, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  useDropdowns,
  useSites,
  useCreateSite,
  useUpdateSite,
  useSiteHistory,
  type CreateSitePayload,
  type Site,
} from "@/hooks/service/site-api";
import { useKertasKerjaMaster } from "@/hooks/service/kertas-kerja-api";
import { Autocomplete, TextField, Collapse } from "@mui/material";

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
  const { data: dropdowns } = useDropdowns({ enabled: open });
  const { data: jenisKits = [] } = useKertasKerjaMaster("master_jenis_kit", undefined, { enabled: open });
  const { data: upks = [] } = useKertasKerjaMaster("master_unit_pelaksana", undefined, { enabled: open });
  const { data: regions = [] } = useKertasKerjaMaster("master_region", undefined, { enabled: open });
  const { data: units = [] } = useKertasKerjaMaster("master_unit", undefined, { enabled: open });
  
  const createSiteMutation = useCreateSite({ onSuccess: () => {} });
  const updateSiteMutation = useUpdateSite({ onSuccess: () => {} });

  const [formData, setFormData] = useState<{
    name: string;
    site_type: "PEMBANGKIT" | "PEMASOK" | "TRANSPORTIR";
    region: string;
    commodity: string;
    kit_id: string;
    upk_id: string;
    unit_id: string;
  }>({
    name: "",
    site_type: "PEMBANGKIT",
    region: "",
    commodity: "BBM",
    kit_id: "",
    upk_id: "",
    unit_id: "",
  });

  const [versions, setVersions] = useState<Array<{
    id?: string;
    capacity?: number;
    capacity_mw?: number;
    owner?: string;
    lat?: string;
    long?: string;
    valid_from?: string;
    valid_to?: string;
    notes?: string;
    isExpanded: boolean;
  }>>([
    { isExpanded: true }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: historyData } = useSiteHistory(editingId || "", formData.site_type === "PEMBANGKIT" ? "PEMBANGKIT" : "PEMASOK", {
    enabled: !!editingId && (formData.site_type === "PEMBANGKIT" || formData.site_type === "PEMASOK") && open
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      site_type: "PEMBANGKIT",
      region: "",
      commodity: "BBM",
      kit_id: "",
      upk_id: "",
      unit_id: "",
    });
    setVersions([{ isExpanded: true }]);
    setErrors({});
  }, []);

  const { data: sites } = useSites();
  const editingSite = sites?.find((s) => s.id === editingId);

  useEffect(() => {
    if (open) {
      if (editingId && editingSite) {
        setFormData({
          name: editingSite.name,
          site_type: editingSite.site_type,
          region: editingSite.region,
          commodity: editingSite.commodity ?? "",
          kit_id: editingSite.kit_id ?? "",
          upk_id: editingSite.upk_id ?? "",
          unit_id: editingSite.unit_id ?? "",
        });
        if (editingSite.site_type === "TRANSPORTIR") {
          setVersions([{
            capacity: editingSite.capacity,
            capacity_mw: editingSite.capacity_mw,
            owner: editingSite.owner,
            lat: editingSite.lat,
            long: editingSite.long,
            isExpanded: true
          }]);
        }
      } else if (!editingId) {
        resetForm();
      }
    }
  }, [open, editingId, editingSite, resetForm]);

  useEffect(() => {
    if (historyData && historyData.length > 0 && formData.site_type !== "TRANSPORTIR") {
      const formattedVersions = historyData.map((h, idx) => ({
        id: h.id,
        capacity: h.capacity ?? undefined,
        capacity_mw: h.capacity_mw ?? undefined,
        owner: h.owner || "",
        lat: h.lat || "",
        long: h.long || "",
        valid_from: h.valid_from ? h.valid_from.split('T')[0] : "",
        valid_to: h.valid_to ? h.valid_to.split('T')[0] : "",
        notes: h.notes || "",
        isExpanded: idx === 0
      }));
      setVersions(formattedVersions);
    }
  }, [historyData, formData.site_type]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama site wajib diisi";
    }

    if (!formData.region.trim() && formData.site_type !== "TRANSPORTIR") {
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

    // Take the first version's fields to use as top-level payload 
    // (for backward compatibility and TRANSPORTIR).
    const topVersion = versions[0];
    
    const payload: CreateSitePayload = {
      name: formData.name,
      site_type: formData.site_type,
      region: formData.region,
      commodity: formData.commodity || undefined,
      kit_id: formData.kit_id || undefined,
      upk_id: formData.upk_id || undefined,
      unit_id: formData.unit_id || undefined,
      capacity: topVersion?.capacity ?? null,
      capacity_mw: topVersion?.capacity_mw ?? null,
      owner: topVersion?.owner || undefined,
      lat: topVersion?.lat ?? null,
      long: topVersion?.long ?? null,
    };

    if (formData.site_type !== "TRANSPORTIR") {
      payload.versions = versions.map(v => ({
        id: v.id,
        name: formData.name,
        capacity: v.capacity ?? null,
        capacity_mw: v.capacity_mw ?? null,
        owner: v.owner || null,
        lat: v.lat || null,
        long: v.long || null,
        valid_from: v.valid_from || null,
        valid_to: v.valid_to || null,
        notes: v.notes || null,
      }));
    }

    try {
      if (editingId) {
        await updateSiteMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createSiteMutation.mutateAsync(payload);
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to save site", error);
    }
  };

  const handleSiteTypeChange = (
    siteType: "PEMBANGKIT" | "PEMASOK" | "TRANSPORTIR",
  ) => {
    setFormData({ ...formData, site_type: siteType });
    setErrors({});
  };

  const updateVersion = (index: number, field: string, value: any) => {
    const newVersions = [...versions];
    newVersions[index] = { ...newVersions[index], [field]: value };
    setVersions(newVersions);
  };

  const addVersion = () => {
    setVersions([{ isExpanded: true }, ...versions.map(v => ({ ...v, isExpanded: false }))]);
  };

  const removeVersion = (index: number) => {
    if (versions.length > 1) {
      setVersions(versions.filter((_, i) => i !== index));
    }
  };

  const toggleVersion = (index: number) => {
    const newVersions = [...versions];
    newVersions[index].isExpanded = !newVersions[index].isExpanded;
    setVersions(newVersions);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Site" : "Tambah Site Baru"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0 bg-gray-50">
          {/* Top Level Config */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2 mb-3">Informasi Umum</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Site</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama site"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 ${errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300"}`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Komoditas</label>
                <input type="text" value="BBM" readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis</label>
                <select
                  value={formData.site_type}
                  onChange={(e) => handleSiteTypeChange(e.target.value as "PEMBANGKIT" | "PEMASOK")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent bg-white transition-all duration-200"
                >
                  <option value="PEMBANGKIT">Pembangkit</option>
                  <option value="PEMASOK">TBBM</option>
                </select>
              </div>
            </div>

            {formData.site_type !== "TRANSPORTIR" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <Autocomplete
                    options={regions.map((r: any) => r.name)}
                    value={formData.region}
                    onChange={(_event, newValue: string | null) => setFormData({ ...formData, region: newValue || "" })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Pilih region"
                        variant="outlined"
                        size="small"
                        error={!!errors.region}
                        helperText={errors.region}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem", backgroundColor: "white" } }}
                      />
                    )}
                    className="w-full"
                  />
                </div>
                {formData.site_type === "PEMBANGKIT" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kit</label>
                    <Autocomplete
                      options={jenisKits}
                      getOptionLabel={(option: any) => option.name}
                      value={jenisKits.find((j: any) => j.id === formData.kit_id) || null}
                      onChange={(_event, newValue: any) => setFormData({ ...formData, kit_id: newValue ? newValue.id : "" })}
                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Pilih jenis kit" variant="outlined" size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem", backgroundColor: "white" } }} />
                      )}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}

            {formData.site_type === "PEMBANGKIT" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Pelaksana</label>
                  <Autocomplete
                    options={upks}
                    getOptionLabel={(option: any) => option.name}
                    value={upks.find((j: any) => j.id === formData.upk_id) || null}
                    onChange={(_event, newValue: any) => setFormData({ ...formData, upk_id: newValue ? newValue.id : "" })}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Pilih unit pelaksana" variant="outlined" size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem", backgroundColor: "white" } }} />
                    )}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <Autocomplete
                    options={units}
                    getOptionLabel={(option: any) => option.name}
                    value={units.find((j: any) => j.id === formData.unit_id) || null}
                    onChange={(_event, newValue: any) => setFormData({ ...formData, unit_id: newValue ? newValue.id : "" })}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Pilih unit" variant="outlined" size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "0.5rem", backgroundColor: "white" } }} />
                    )}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Versions / Detail Site */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Detail & Masa Berlaku (History)</h3>
              {formData.site_type !== "TRANSPORTIR" && (
                <button
                  type="button"
                  onClick={addVersion}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus size={16} />
                  Tambah Versi
                </button>
              )}
            </div>

            {versions.map((version, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200">
                <div 
                  className={`flex items-center justify-between p-4 ${version.isExpanded ? 'border-b border-gray-100 bg-gray-50/50' : 'hover:bg-gray-50 cursor-pointer'}`}
                  onClick={() => !version.isExpanded && toggleVersion(idx)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {versions.length - idx}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Versi {versions.length - idx}</p>
                      {formData.site_type !== "TRANSPORTIR" && (
                        <p className="text-xs text-gray-500">
                          {version.valid_from || "Awal"} - {version.valid_to || "Akhir"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {versions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeVersion(idx); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus versi ini"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleVersion(idx); }}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {version.isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                <Collapse in={version.isExpanded}>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Kepemilikan */}
                      {formData.site_type === "PEMBANGKIT" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Kepemilikan</label>
                          <select
                            value={version.owner ?? ""}
                            onChange={(e) => updateVersion(idx, "owner", e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent bg-white transition-all duration-200"
                          >
                            <option value="">Pilih kepemilikan</option>
                            <option value="PLN">PLN</option>
                            <option value="PLN IP">PLN IP</option>
                            <option value="PLN NP">PLN NP</option>
                          </select>
                        </div>
                      )}

                      {/* Capacity */}
                      {formData.site_type !== "TRANSPORTIR" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Kapasitas (KL)</label>
                          <input
                            type="number"
                            value={version.capacity ?? ""}
                            onChange={(e) => updateVersion(idx, "capacity", e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Masukkan kapasitas (KL)"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      )}

                      {/* Capacity MW */}
                      {formData.site_type === "PEMBANGKIT" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Kapasitas (MW)</label>
                          <input
                            type="number"
                            step="any"
                            value={version.capacity_mw ?? ""}
                            onChange={(e) => updateVersion(idx, "capacity_mw", e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Masukkan kapasitas (MW)"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                        <input
                          type="text"
                          value={version.lat ?? ""}
                          onChange={(e) => updateVersion(idx, "lat", e.target.value || undefined)}
                          placeholder="-6.123456"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                        <input
                          type="text"
                          value={version.long ?? ""}
                          onChange={(e) => updateVersion(idx, "long", e.target.value || undefined)}
                          placeholder="106.123456"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Masa Berlaku */}
                    {formData.site_type !== "TRANSPORTIR" && (
                      <div className="mt-4 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                            <input
                              type="date"
                              value={version.valid_from || ""}
                              onChange={(e) => updateVersion(idx, "valid_from", e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Valid To</label>
                            <input
                              type="date"
                              value={version.valid_to || ""}
                              onChange={(e) => updateVersion(idx, "valid_to", e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                          <textarea
                            value={version.notes || ""}
                            onChange={(e) => updateVersion(idx, "notes", e.target.value)}
                            placeholder="Opsional: Tambahkan catatan masa berlaku"
                            rows={2}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Collapse>
              </div>
            ))}
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={createSiteMutation.isPending || updateSiteMutation.isPending}
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(createSiteMutation.isPending || updateSiteMutation.isPending) ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

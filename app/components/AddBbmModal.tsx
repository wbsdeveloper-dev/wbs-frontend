import React, { useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { Autocomplete, TextField } from "@mui/material";
import { useCreateBbmMonthly } from "@/hooks/service/bbm-api";
import { useSites } from "@/hooks/service/site-api";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

export default function AddBbmModal({ setOpenModal, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    monthDate: "",
    siteId: "",
    supplierId: "",
    product: "B40",
    moda: "Truck",
    unit: "KILOLITER",
    nomination: "",
    realization: "",
    usage: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRecord = useCreateBbmMonthly();

  const { data: tbbmData } = useSites({ type: "PEMASOK", commodity: "BBM" });
  const { data: pembangkitData } = useSites({
    type: "PEMBANGKIT",
    commodity: "BBM",
  });

  const handleSave = async () => {
    try {
      setError(null);
      const payload: any = {
        monthDate: formData.monthDate,
        siteId: formData.siteId,
        supplierId: formData.supplierId,
        product: formData.product,
        moda: formData.moda,
        unit: formData.unit,
      };

      if (formData.nomination !== "")
        payload.nomination = Number(formData.nomination);
      if (formData.realization !== "")
        payload.realization = Number(formData.realization);
      if (formData.usage !== "") payload.usage = Number(formData.usage);

      await createRecord.mutateAsync(payload);

      setShowSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        setOpenModal(false);
      }, 1500);
    } catch (err: any) {
      console.error("Failed to insert record:", err);
      setError(err?.message || "Gagal menambahkan data.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpenModal(false)}
      />
      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Tambah Data Tunggal BBM
          </h3>
          <button
            onClick={() => setOpenModal(false)}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {showSuccess && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
            <CheckCircle2 size={18} />
            Data berhasil disimpan
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Informasi Dasar */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TBBM (Pemasok) <span className="text-red-500">*</span>
            </label>
            <Autocomplete
              options={tbbmData || []}
              getOptionLabel={(option) => option.name}
              value={
                tbbmData?.find((p) => p.id === formData.supplierId) || null
              }
              onChange={(event, newValue) => {
                setFormData({
                  ...formData,
                  supplierId: newValue ? newValue.id : "",
                });
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option) => {
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
                  placeholder="Pilih TBBM"
                  variant="outlined"
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "0.75rem",
                      backgroundColor: "white",
                    },
                  }}
                />
              )}
              className="w-full"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pembangkit <span className="text-red-500">*</span>
            </label>
            <Autocomplete
              options={pembangkitData || []}
              getOptionLabel={(option) => option.name}
              value={
                pembangkitData?.find((p) => p.id === formData.siteId) || null
              }
              onChange={(event, newValue) => {
                setFormData({
                  ...formData,
                  siteId: newValue ? newValue.id : "",
                });
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option) => {
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
                  placeholder="Pilih Pembangkit"
                  variant="outlined"
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "0.75rem",
                      backgroundColor: "white",
                    },
                  }}
                />
              )}
              className="w-full"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bulan <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              value={formData.monthDate}
              onChange={(e) =>
                setFormData({ ...formData, monthDate: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produk <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.product}
              onChange={(e) =>
                setFormData({ ...formData, product: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
            >
              <option value="B40">B40</option>
              <option value="B35">B35</option>
              <option value="HSD">HSD</option>
              <option value="MFO">MFO</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
            >
              <option value="KILOLITER">KILO LITER</option>
              <option value="LITER">LITER</option>
            </select>
          </div>
        </div>

        {/* Grup Data Metrik */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grup 1: Realisasi & Moda */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Realisasi Pengiriman
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moda <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.moda}
                onChange={(e) =>
                  setFormData({ ...formData, moda: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
              >
                <option value="Truck">Truck</option>
                <option value="Pipa">Pipa</option>
                <option value="Kapal">Kapal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Realisasi
              </label>
              <input
                type="number"
                value={formData.realization}
                onChange={(e) =>
                  setFormData({ ...formData, realization: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
              />
            </div>
          </div>

          {/* Grup 2: Nominasi & Pemakaian */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Rencana & Pemakaian
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nominasi (Rencana)
              </label>
              <input
                type="number"
                value={formData.nomination}
                onChange={(e) =>
                  setFormData({ ...formData, nomination: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pemakaian
              </label>
              <input
                type="number"
                value={formData.usage}
                onChange={(e) =>
                  setFormData({ ...formData, usage: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setOpenModal(false)}
            className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={
              createRecord.isPending ||
              !formData.monthDate ||
              !formData.siteId ||
              !formData.supplierId
            }
            className="px-4 py-2 font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {createRecord.isPending ? "Menyimpan..." : "Simpan Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

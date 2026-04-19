import { X } from "lucide-react";
import { useState } from "react";
import { useCreateReconciliationRecord } from "@/hooks/service/monitoring-api";
import { useFilters } from "@/hooks/service/dashboard-api";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

export default function AddReconciliationModal({
  setOpenModal,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState({
    reportDate: "",
    siteId: "",
    siteName: "",
    supplierName: "",
    metricType: "ENERGY_BBTUD",
    periodType: "day",
    periodValue: "",
    waValue: "",
    plnValue: "",
    sheetValue: "",
    finalValue: "",
    finalSource: "",
    resolution: "",
  });

  const createRecord = useCreateReconciliationRecord();
  const { data: filtersData } = useFilters();

  const handleSave = async () => {
    try {
      await createRecord.mutateAsync({
        reportDate: formData.reportDate || undefined,
        siteId: formData.siteId || undefined,
        siteName: formData.siteName || undefined,
        supplierName: formData.supplierName || undefined,
        metricType: formData.metricType,
        periodType: formData.periodType,
        periodValue: formData.periodValue,
        waValue: formData.waValue ? Number(formData.waValue) : null,
        plnValue: formData.plnValue ? Number(formData.plnValue) : null,
        sheetValue: formData.sheetValue ? Number(formData.sheetValue) : null,
        finalValue: formData.finalValue ? Number(formData.finalValue) : null,
        finalSource: formData.finalSource || null,
        resolution: formData.resolution || null,
      });

      if (onSuccess) onSuccess();
      setOpenModal(false);
    } catch (err) {
      console.error("Failed to insert record:", err);
      alert("Gagal menambahkan data.");
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
          <h3 className="text-xl font-bold text-gray-900">Tambah Data Tunggal</h3>
          <button
            onClick={() => setOpenModal(false)}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Site (Pembangkit) <span className="text-red-500">*</span></label>
            <select
              value={formData.siteId}
              onChange={(e) => {
                const selected = filtersData?.pembangkit?.find(p => p.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  siteId: e.target.value, 
                  siteName: selected ? selected.name : "" 
                });
              }}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all bg-white"
            >
              <option value="">Pilih Site</option>
              {filtersData?.pembangkit?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (Pemasok) <span className="text-red-500">*</span></label>
            <select
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all bg-white"
            >
              <option value="">Pilih Supplier</option>
              {filtersData?.pemasok?.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Metric Type <span className="text-red-500">*</span></label>
            <select
              value={formData.metricType}
              onChange={(e) => setFormData({ ...formData, metricType: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all bg-white"
            >
              <option value="ENERGY_BBTUD">ENERGY_BBTUD</option>
              <option value="FLOWRATE_MMSCFD">FLOWRATE_MMSCFD</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Period Type <span className="text-red-500">*</span></label>
            <select
              value={formData.periodType}
              onChange={(e) => setFormData({ ...formData, periodType: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all bg-white"
            >
              <option value="day">Daily</option>
              <option value="hour">Hourly</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Period Value <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.periodValue}
              onChange={(e) => setFormData({ ...formData, periodValue: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
              placeholder="Contoh: April 2026 / 15-05-2026"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kegiatan <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formData.reportDate}
              onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">WA Value</label>
            <input
              type="number"
              value={formData.waValue}
              onChange={(e) => setFormData({ ...formData, waValue: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">PLN Value</label>
            <input
              type="number"
              value={formData.plnValue}
              onChange={(e) => setFormData({ ...formData, plnValue: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sheet Value</label>
            <input
              type="number"
              value={formData.sheetValue}
              onChange={(e) => setFormData({ ...formData, sheetValue: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Final Value</label>
            <input
              type="number"
              value={formData.finalValue}
              onChange={(e) => setFormData({ ...formData, finalValue: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
            <textarea
              value={formData.resolution}
              onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all resize-none"
              rows={2}
            />
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
            disabled={createRecord.isPending || !formData.periodValue || !formData.reportDate}
            className="px-4 py-2 font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {createRecord.isPending ? "Menyimpan..." : "Simpan Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

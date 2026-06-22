"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  useBbmMonthlyById,
  useUpdateBbmMonthly,
  type CreateBbmPayload,
} from "@/hooks/service/bbm-api";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function EditBbmRecordPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;

  const { data: record, isLoading, isError } = useBbmMonthlyById(recordId);
  const updateMutation = useUpdateBbmMonthly();

  // Form state
  const [form, setForm] = useState<Partial<CreateBbmPayload>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Populate form when record loads
  useEffect(() => {
    if (record) {
      setForm({
        nomination: record.nomination,
        realization: record.realization,
        usage: record.usage,
        product: record.product,
        moda: record.moda,
        unit: record.unit,
      });
    }
  }, [record]);

  const handleChange = (
    field: keyof CreateBbmPayload,
    value: string | number | null | undefined,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (
    field: keyof CreateBbmPayload,
    raw: string,
  ) => {
    const value = raw === "" ? undefined : Number(raw);
    handleChange(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({ id: recordId, payload: form });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      // error is available via updateMutation.error
    }
  };

  // ---------- Loading state ----------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="animate-spin text-secondary" size={36} />
      </div>
    );
  }

  // ---------- Error state ----------
  if (isError || !record) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto mb-3 text-red-500" size={36} />
          <p className="text-red-700 font-medium">Gagal memuat data BBM.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <span>Dashboard</span>
        <span className="text-gray-400">/</span>
        <span>Manajemen Data BBM</span>
        <span className="text-gray-400">/</span>
        <span className="text-primary font-medium">Edit Data</span>
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Edit Data BBM
          </h1>
          {/* <p className="text-gray-500 mt-1 text-sm">ID: {record.id}</p> */}
        </div>
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium animate-fadeIn">
          <CheckCircle2 size={18} />
          Data berhasil diperbarui
        </div>
      )}

      {/* Error toast */}
      {updateMutation.isError && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle size={18} />
          {updateMutation.error?.message || "Gagal memperbarui data"}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Read-only info card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Informasi Data
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReadOnlyField label="Bulan Laporan" value={record.reportDate} />
            <ReadOnlyField label="TBBM (Pemasok)" value={record.tbbm} />
            <ReadOnlyField label="Pembangkit" value={record.pembangkit} />
          </div>
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Produk & Unit (if we want to mimic AddBbmModal, they are in a grid) */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produk <span className="text-red-500">*</span>
              </label>
              <select
                value={form.product ?? "B40"}
                onChange={(e) => handleChange("product", e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              >
                <option value="B40">B40</option>
                <option value="B35">B35</option>
                <option value="HSD">HSD</option>
                <option value="MFO">MFO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={form.unit ?? "KILOLITER"}
                onChange={(e) => handleChange("unit", e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              >
                <option value="KILOLITER">KILO LITER</option>
                <option value="LITER">LITER</option>
              </select>
            </div>
          </div>

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
                value={form.moda ?? "Truck"}
                onChange={(e) => handleChange("moda", e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              >
                <option value="Truck">Truck</option>
                <option value="Pipa">Pipa</option>
                <option value="Kapal">Kapal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Penerimaan
              </label>
              <input
                type="number"
                step="any"
                value={form.realization ?? ""}
                onChange={(e) => handleNumberChange("realization", e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                placeholder="Masukkan penerimaan"
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
                step="any"
                value={form.nomination ?? ""}
                onChange={(e) => handleNumberChange("nomination", e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                placeholder="Masukkan nominasi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pemakaian
              </label>
              <input
                type="number"
                step="any"
                value={form.usage ?? ""}
                onChange={(e) => handleNumberChange("usage", e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                placeholder="Masukkan pemakaian"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Simpan Perubahan
          </button>
        </div>
      </form>

      {/* Animations */}
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
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable form field components
// ---------------------------------------------------------------------------

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <p className="text-sm text-gray-900 font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
        {value ?? "-"}
      </p>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (raw: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type="number"
        step="any"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
        placeholder={`Masukkan ${label.toLowerCase()}`}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
        placeholder={`Masukkan ${label.toLowerCase()}`}
      />
    </div>
  );
}

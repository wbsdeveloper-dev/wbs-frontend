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
  useNotification,
  useUpdateNotification,
  type UpdateNotificationPayload,
} from "@/hooks/service/notification-api";
import { useCreateEvent } from "@/hooks/service/dashboard-api";

// ---------------------------------------------------------------------------
// Status options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "DI_BAWAH_TOP", label: "Di Bawah TOP" },
  { value: "DATA_HILANG", label: "Data Hilang" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "NEED_REVIEW", label: "Need Review" },
];

const READ_OPTIONS = [
  { value: "false", label: "Belum Dibaca (Unread)" },
  { value: "true", label: "Sudah Dibaca (Read)" },
];

// ---------------------------------------------------------------------------
// Status badge (consistent with table)
// ---------------------------------------------------------------------------

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; dot: string; label?: string }> = {
    DI_BAWAH_TOP: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Di Bawah TOP" },
    DATA_HILANG: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Data Hilang" },
    RESOLVED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Resolved" },
    NEED_REVIEW: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Need Review" },
  };
  const c = config[status] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
    dot: "bg-gray-500",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label || status}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function EditNotificationPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;

  const { data: record, isLoading, isError } = useNotification(recordId);
  const updateMutation = useUpdateNotification();
  const createEventMutation = useCreateEvent();

  // Form state
  const [form, setForm] = useState<UpdateNotificationPayload>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Populate form when record loads
  useEffect(() => {
    if (record) {
      setForm({
        finalValue: record.finalValue,
        status: record.status,
        notes: record.notes,
        isRead: record.isRead,
      });
    }
  }, [record]);

  const handleChange = (
    field: keyof UpdateNotificationPayload,
    value: string | number | boolean | null,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (
    field: keyof UpdateNotificationPayload,
    raw: string,
  ) => {
    const value = raw === "" ? null : Number(raw);
    handleChange(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({ id: recordId, payload: form });

      const currentStatus = form.status || record?.status;
      if (currentStatus === "DI_BAWAH_TOP" && form.notes?.trim()) {
        try {
          await createEventMutation.mutateAsync({
            siteId: record?.siteId || undefined,
            siteName: record?.siteName || record?.supplierName || "Unknown",
            occurredAt: record?.reportDate ? new Date(record.reportDate).toISOString() : new Date().toISOString(),
            title: `Catatan Notifikasi - Di Bawah TOP`,
            description: form.notes.trim(),
            severity: "INFO",
          });
        } catch (err) {
          console.error("Gagal menyimpan catatan kejadian:", err);
        }
      }

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
          <p className="text-red-700 font-medium">Gagal memuat data notifikasi.</p>
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
        <span>Notifikasi</span>
        <span className="text-gray-400">/</span>
        <span className="text-primary font-medium">Edit Notifikasi</span>
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Edit Data Notifikasi
            </h1>
            <p className="text-gray-500 mt-1 text-sm">ID: {record.id}</p>
          </div>
        </div>
        <StatusBadge status={record.status} />
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium animate-fadeIn">
          <CheckCircle2 size={18} />
          Data notifikasi berhasil diperbarui
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
              Informasi Record Notifikasi
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReadOnlyField label="Tanggal Laporan" value={record.reportDate} />
            <ReadOnlyField label="Nama Pemasok" value={record.supplierName} />
            <ReadOnlyField label="Nama Pembangkit" value={record.siteName} />
            <ReadOnlyField label="Jenis Metrik" value={record.metricType} />
            <ReadOnlyField
              label="Dibuat Pada"
              value={new Date(record.createdAt).toLocaleString("id-ID")}
            />
            <ReadOnlyField
              label="Update Terakhir"
              value={new Date(record.updatedAt).toLocaleString("id-ID")}
            />
          </div>
        </div>

        {/* Editable fields card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Data Nilai & Status
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <NumberField
              label="Nilai Final"
              value={form.finalValue}
              onChange={(v) => handleNumberChange("finalValue", v)}
            />
            <div className="p-6">
              <RadioGroupField
                label=""
                value={form.isRead ?? false}
                onChange={(v) => handleChange("isRead", v)}
              />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField
                label="Catatan (Notes)"
                value={form.notes ?? ""}
                onChange={(v) => handleChange("notes", v === "" ? null : v)}
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

function TextAreaField({
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 resize-none"
        placeholder={`Masukkan ${label.toLowerCase()}`}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RadioGroupField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="flex items-center gap-6 pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!value}
            onChange={() => onChange(false)}
            className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-secondary cursor-pointer"
          />
          <span className="text-sm text-gray-800 font-medium">Belum dibaca</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={value}
            onChange={() => onChange(true)}
            className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-secondary cursor-pointer"
          />
          <span className="text-sm text-gray-800 font-medium">Sudah dibaca</span>
        </label>
      </div>
    </div>
  );
}

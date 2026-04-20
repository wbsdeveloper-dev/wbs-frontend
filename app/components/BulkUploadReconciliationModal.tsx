import { X, Upload, Download } from "lucide-react";
import { useState, useRef } from "react";
import {
  useBulkUploadReconciliationRecords,
  downloadReconciliationTemplate,
} from "@/hooks/service/monitoring-api";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

export default function BulkUploadReconciliationModal({
  setOpenModal,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkUpload = useBulkUploadReconciliationRecords();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      await downloadReconciliationTemplate();
    } catch (err) {
      console.error("Failed to download template:", err);
      alert("Gagal mengunduh template.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const result = await bulkUpload.mutateAsync(file);
      alert(
        `Upload berhasil! ${result.insertedCount} data ditambahkan/diperbarui.`,
      );
      if (onSuccess) onSuccess();
      setOpenModal(false);
    } catch (err) {
      console.error("Failed to upload bulk records:", err);
      alert("Gagal mengunggah data bulk.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpenModal(false)}
      />
      <div className="relative bg-white w-full max-w-md rounded-xl shadow-lg p-6 z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Multi Input Data</h3>
          <button
            onClick={() => setOpenModal(false)}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 flex justify-center">
          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#115d72] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <Download size={18} />
            {isDownloading ? "Mengunduh..." : "Download Template Excel"}
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih File Excel (.xlsx)
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {file ? (
                <span className="font-semibold text-gray-900">{file.name}</span>
              ) : (
                "Klik untuk memilih atau drag and drop file di sini"
              )}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setOpenModal(false)}
            className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleUpload}
            disabled={bulkUpload.isPending || !file}
            className="px-4 py-2 font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {bulkUpload.isPending ? "Mengunggah..." : "Upload File"}
          </button>
        </div>
      </div>
    </div>
  );
}

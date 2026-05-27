import React, { useState, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useFilters } from "@/hooks/service/dashboard-api";
import { useExtractOcrPage } from "@/hooks/service/monitoring-api";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

export default function InputBAValidasiModal({
  setOpenModal,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    siteId: "",
    supplierName: "",
    reportDate: "",
    jenisBa: "Tunggal",
    halamanData: "",
    kolomYangDiambil: "",
    prompt: "",
  });

  const [showPrompt, setShowPrompt] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: filtersData } = useFilters();
  const extractOcr = useExtractOcrPage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("File harus berupa PDF");
        return;
      }
      setFile(selectedFile);
      setError(null);
      // Create object URL for preview
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError("Silakan unggah file PDF terlebih dahulu");
      return;
    }
    
    // Create the formData payload
    const formDataToSubmit = new FormData();
    formDataToSubmit.append("file", file);
    formDataToSubmit.append("siteId", formData.siteId);
    formDataToSubmit.append("supplierName", formData.supplierName);
    formDataToSubmit.append("reportDate", formData.reportDate);
    formDataToSubmit.append("jenisBa", formData.jenisBa);
    formDataToSubmit.append("halamanData", formData.halamanData);
    formDataToSubmit.append("kolomYangDiambil", formData.kolomYangDiambil);
    formDataToSubmit.append("prompt", formData.prompt);

    // Log the payload to console and show an alert
    const payloadLog = {
      file: file.name,
      ...formData
    };
    console.log("Payload to be sent:", payloadLog);
    alert("Payload yang akan dikirim:\n\n" + JSON.stringify(payloadLog, null, 2));

    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await extractOcr.mutateAsync(formDataToSubmit);
      console.log("OCR Response:", response);
      setShowSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        setOpenModal(false);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }, 1500);
    } catch (err: any) {
      console.error("Gagal memproses PDF:", err);
      setError(err?.message || "Gagal memproses PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setOpenModal(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-xl shadow-lg flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900">
            Input BA & Validasi
          </h3>
          <button
            onClick={handleClose}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {showSuccess && (
            <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
              <CheckCircle2 size={18} />
              PDF berhasil diproses
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[500px]">
            {/* Left side: PDF Preview */}
            <div className="w-full lg:w-3/5 h-[400px] lg:h-full flex flex-col border border-gray-300 rounded-lg overflow-hidden relative bg-gray-50">
              {!previewUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div 
                    className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <button className="px-6 py-2.5 bg-[#115d72] text-white font-medium rounded-lg hover:bg-[#0d4a5c] transition-colors flex items-center gap-2">
                      <Upload size={18} />
                      Unggah PDF
                    </button>
                    <p className="mt-3 text-sm text-gray-500">
                      Klik untuk memilih file PDF
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 relative w-full h-full">
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    className="w-full h-full"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <p className="text-gray-600 mb-4">Browser Anda tidak mendukung preview PDF secara langsung.</p>
                      <a href={previewUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg">
                        Buka PDF di Tab Baru
                      </a>
                    </div>
                  </object>
                  {/* Button to change file */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur shadow-sm border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors z-10"
                  >
                    Ganti PDF
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
            </div>

            {/* Right side: Form Elements */}
            <div className="w-full lg:w-2/5 flex flex-col">
              <div className="space-y-5 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pembangkit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
                  >
                    <option value="">Pilih Pembangkit</option>
                    {filtersData?.pembangkit?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pemasok <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
                  >
                    <option value="">Pilih Pemasok</option>
                    {filtersData?.pemasok?.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Kegiatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis BA
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="jenisBa"
                        value="Tunggal"
                        checked={formData.jenisBa === "Tunggal"}
                        onChange={(e) => setFormData({ ...formData, jenisBa: e.target.value })}
                        className="w-4 h-4 text-[#115d72] focus:ring-[#14a2bb]"
                      />
                      <span className="text-sm text-gray-700">Tunggal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="jenisBa"
                        value="Multi Stream"
                        checked={formData.jenisBa === "Multi Stream"}
                        onChange={(e) => setFormData({ ...formData, jenisBa: e.target.value })}
                        className="w-4 h-4 text-[#115d72] focus:ring-[#14a2bb]"
                      />
                      <span className="text-sm text-gray-700">Multi Stream</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Halaman Data
                  </label>
                  <input
                    type="text"
                    value={formData.halamanData}
                    onChange={(e) => setFormData({ ...formData, halamanData: e.target.value })}
                    placeholder="Contoh: 1, 3, 5-7 (Kosongkan untuk seluruh halaman)"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Masukkan nomor halaman spesifik yang ingin diproses dari PDF ini.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kolom yang Diambil
                  </label>
                  <input
                    type="text"
                    value={formData.kolomYangDiambil}
                    onChange={(e) => setFormData({ ...formData, kolomYangDiambil: e.target.value })}
                    placeholder="Contoh: Tanggal, Volume, Harga (Pisahkan dengan koma)"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowPrompt(!showPrompt)}
                    className="text-[#115d72] hover:text-[#0d4a5c] text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    {showPrompt ? "Sembunyikan Prompt" : "+ Tambah Prompt Khusus"}
                  </button>
                  
                  {showPrompt && (
                    <div className="mt-3 animate-fade-in">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prompt AI
                      </label>
                      <textarea
                        value={formData.prompt}
                        onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                        placeholder="Masukkan instruksi khusus untuk pemrosesan AI..."
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all resize-y min-h-[100px]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end flex-shrink-0">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing || !file || !formData.siteId || !formData.supplierName || !formData.reportDate}
                  className="px-6 py-2.5 font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full md:w-auto"
                >
                  {isProcessing ? "Memproses..." : "Proses PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

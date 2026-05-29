import React, { useState, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useFilters } from "@/hooks/service/dashboard-api";
import { useExtractOcrPage, useBatchCreateOcrReconciliationRecords } from "@/hooks/service/monitoring-api";
import { Autocomplete, TextField } from "@mui/material";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

interface ExtractedRecord {
  tanggalKegiatan: string;
  volume: string;
  flowrate: string;
}

export default function InputBAValidasiModal({
  setOpenModal,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    siteId: "",
    supplierId: "",
    reportDate: "",
    jenisBa: "Tunggal",
    halamanData: "",
    kolomYangDiambil: "",
    prompt: "",
    convertToMmscf: false,
    convertToBbtu: false,
  });

  const [showPrompt, setShowPrompt] = useState(false);
  const [extractedRecords, setExtractedRecords] = useState<ExtractedRecord[] | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: filtersData } = useFilters();
  const extractOcr = useExtractOcrPage();
  const batchCreate = useBatchCreateOcrReconciliationRecords();

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
    formDataToSubmit.append("supplierId", formData.supplierId);
    formDataToSubmit.append("reportDate", formData.reportDate);
    formDataToSubmit.append("jenisBa", formData.jenisBa);
    formDataToSubmit.append("halamanData", formData.halamanData);
    formDataToSubmit.append("kolomYangDiambil", formData.kolomYangDiambil);
    formDataToSubmit.append("convertToMmscf", String(formData.convertToMmscf));
    formDataToSubmit.append("convertToBbtu", String(formData.convertToBbtu));
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
      
      // Map response to extracted records
      const records = response?.data?.records || [];
      const mapped: ExtractedRecord[] = records.map((r: any) => ({
        tanggalKegiatan: r?.report_date || "",
        volume: r?.ENERGY_BBTUD !== undefined ? String(r.ENERGY_BBTUD) : "",
        flowrate: r?.FLOWRATE_MMSCFD !== undefined ? String(r.FLOWRATE_MMSCFD) : ""
      }));
      
      setExtractedRecords(mapped.length > 0 ? mapped : [{ tanggalKegiatan: "", volume: "", flowrate: "" }]);
      
    } catch (err: any) {
      console.error("Gagal memproses PDF:", err);
      setError(err?.message || "Gagal memproses PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimpanData = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const payload = extractedRecords?.map((rec) => ({
        report_date: rec.tanggalKegiatan,
        FLOWRATE_MMSCFD: Number(rec.flowrate) || 0,
        ENERGY_BBTUD: Number(rec.volume) || 0,
        site_id: formData.siteId,
        supplier_id: formData.supplierId,
        NEED_CONVERT_TO_MMSCF: formData.convertToMmscf,
        NEED_CONVERT_TO_BBTU: formData.convertToBbtu,
      })) || [];

      // Log the payload to console and show an alert as requested
      console.log("Simpan data payload:", payload);
      
      const response = await batchCreate.mutateAsync(payload);
      console.log("Batch create response:", response);
      alert("Simpan Data berhasil! Data yang dikirim:\n\n" + JSON.stringify(payload, null, 2));
      
      setShowSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        setOpenModal(false);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }, 1500);
    } catch (err: any) {
      console.error("Gagal menyimpan data:", err);
      setError(err?.message || "Gagal menyimpan data.");
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
            <div className="w-full lg:w-2/5 flex flex-col h-full max-h-[70vh]">
              {!extractedRecords ? (
                <>
                  <div className="space-y-5 flex-1 overflow-y-auto pr-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TBBM <span className="text-red-500">*</span>
                      </label>
                      <Autocomplete
                        options={filtersData?.pemasok || []}
                        getOptionLabel={(option) => option.name}
                        value={filtersData?.pemasok?.find(p => p.id === formData.supplierId) || null}
                        onChange={(event, newValue) => {
                          setFormData({ ...formData, supplierId: newValue ? newValue.id : "" });
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
                              }
                            }}
                          />
                        )}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pembangkit <span className="text-red-500">*</span>
                      </label>
                      <Autocomplete
                        options={filtersData?.pembangkit || []}
                        getOptionLabel={(option) => option.name}
                        value={filtersData?.pembangkit?.find(p => p.id === formData.siteId) || null}
                        onChange={(event, newValue) => {
                          setFormData({ ...formData, siteId: newValue ? newValue.id : "" });
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
                              }
                            }}
                          />
                        )}
                        className="w-full"
                      />
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opsi Konversi
                      </label>
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.convertToMmscf}
                            onChange={(e) => setFormData({ ...formData, convertToMmscf: e.target.checked })}
                            className="w-4 h-4 text-[#115d72] rounded focus:ring-[#14a2bb]"
                          />
                          <span className="text-sm text-gray-700">Need convert to MMSCF</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.convertToBbtu}
                            onChange={(e) => setFormData({ ...formData, convertToBbtu: e.target.checked })}
                            className="w-4 h-4 text-[#115d72] rounded focus:ring-[#14a2bb]"
                          />
                          <span className="text-sm text-gray-700">Need convert to BBTU</span>
                        </label>
                      </div>
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

                  <div className="mt-6 flex justify-end flex-shrink-0 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleProcess}
                      disabled={isProcessing || !file || !formData.siteId || !formData.supplierId || !formData.reportDate}
                      className="px-6 py-2.5 font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full md:w-auto"
                    >
                      {isProcessing ? "Memproses..." : "Proses PDF"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4 flex-1 flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-2 flex-shrink-0">
                      <h4 className="font-bold text-gray-900 text-lg">Review Data Extracted</h4>
                      <button 
                        onClick={() => setExtractedRecords(null)} 
                        className="text-sm text-[#115d72] hover:underline"
                      >
                        Kembali ke Form
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2">
                      <div className="grid grid-cols-3 gap-3 mb-2 px-1 sticky top-0 bg-white z-10 pb-2 border-b border-gray-100">
                        <div className="text-sm font-semibold text-gray-700 text-center">Tanggal Kegiatan</div>
                        <div className="text-sm font-semibold text-gray-700 text-center">FLOWRATE</div>
                        <div className="text-sm font-semibold text-gray-700 text-center">VOLUME</div>
                      </div>
                      
                      <div className="space-y-2">
                        {extractedRecords.map((rec, index) => (
                          <div key={index} className="grid grid-cols-3 gap-3">
                            <input 
                              type="text" 
                              value={rec.tanggalKegiatan}
                              onChange={(e) => {
                                const newRecs = [...extractedRecords];
                                newRecs[index].tanggalKegiatan = e.target.value;
                                setExtractedRecords(newRecs);
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb]"
                            />
                            <input 
                              type="text" 
                              value={rec.flowrate}
                              onChange={(e) => {
                                const newRecs = [...extractedRecords];
                                newRecs[index].flowrate = e.target.value;
                                setExtractedRecords(newRecs);
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] text-right"
                            />
                            <input 
                              type="text" 
                              value={rec.volume}
                              onChange={(e) => {
                                const newRecs = [...extractedRecords];
                                newRecs[index].volume = e.target.value;
                                setExtractedRecords(newRecs);
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] text-right"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm font-bold text-gray-700 flex items-center justify-center">Total</div>
                        <input 
                          type="text"
                          readOnly
                          value={extractedRecords.reduce((sum, r) => sum + (parseFloat(r.flowrate) || 0), 0).toFixed(4)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 text-right"
                        />
                        <input 
                          type="text"
                          readOnly
                          value={extractedRecords.reduce((sum, r) => sum + (parseFloat(r.volume) || 0), 0).toFixed(4)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 text-right"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end flex-shrink-0 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSimpanData}
                      disabled={isProcessing}
                      className="px-6 py-2.5 font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full md:w-auto"
                    >
                      {isProcessing ? "Menyimpan..." : "Simpan Data"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

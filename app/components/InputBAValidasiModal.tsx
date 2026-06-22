import React, { useState, useRef, useEffect } from "react";
import { X, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useFilters } from "@/hooks/service/dashboard-api";
import {
  useExtractOcrPage,
  useExtractOcrMultiPage,
  useBatchCreateOcrReconciliationRecords,
} from "@/hooks/service/monitoring-api";
import { Autocomplete, TextField } from "@mui/material";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

interface ExtractedRecord {
  tanggalKegiatan: string;
  volume: string;
  flowrate: string;
  stream1Volume?: string;
  stream1Flowrate?: string;
  stream2Volume?: string;
  stream2Flowrate?: string;
  siteId?: string;
  siteName?: string;
}

const DEFAULT_PROMPT_SINGLE = `Ekstrak data dari teks dokumen berikut.
Kembalikan data dalam format JSON array of objects.
Setiap object mewakili baris data dan harus memiliki key:
- "report_date" (format YYYY-MM-DD)
- "FLOWRATE_MMSCFD" (nilai numerik PERSIS seperti tertulis di dokumen pada kolom volume/flowrate)
- "ENERGY_BBTUD" (nilai numerik PERSIS seperti tertulis di dokumen pada kolom energy/BTU)

PENTING: Gunakan nilai angka PERSIS seperti yang tertulis di dokumen. JANGAN lakukan konversi satuan apapun.
Contoh: jika dokumen menampilkan 577.7809, kembalikan 577.7809 bukan 0.5777809.
Pastikan angka desimal menggunakan titik (bukan koma) dan hilangkan pemisah ribuan.
Jika ada kolom tertentu yang diminta, fokus pada nilai tersebut.
Teks:
{text}`;

const DEFAULT_PROMPT_MULTI = `Ekstrak data aliran (stream) dari teks dokumen berikut.
Kembalikan data dalam format JSON array of objects.
Setiap object mewakili baris data dan harus memiliki key:
- "report_date" (format YYYY-MM-DD)
- "FLOWRATE_MMSCFD" (nilai numerik PERSIS seperti tertulis di dokumen pada kolom volume/flowrate)
- "ENERGY_BBTUD" (nilai numerik PERSIS seperti tertulis di dokumen pada kolom energy/BTU)

PENTING: Gunakan nilai angka PERSIS seperti yang tertulis di dokumen. JANGAN lakukan konversi satuan apapun.
Contoh: jika dokumen menampilkan 577.7809, kembalikan 577.7809 bukan 0.5777809.
Data ini adalah salah satu dari beberapa stream yang akan digabungkan nanti berdasarkan report_date.
Pastikan angka desimal menggunakan titik (bukan koma) dan hilangkan pemisah ribuan.
Teks:
{text}`;

export const getMultiPembangkitPrompt = (
  siteIds: string[],
  kolomYangDiambil: string[],
  pembangkitList: any[]
) => {
  const dynamicSection = siteIds
    .map((siteId, index) => {
      if (!siteId) return "";
      const site = pembangkitList?.find((p: any) => p.id === siteId);
      const siteName = site ? site.name : `Site ${index + 1}`;
      const safeSiteName = siteName.toUpperCase().replace(/[^A-Z0-9]/g, "_");

      const kolomInput = kolomYangDiambil[index] || "";
      const kolomParts = kolomInput.split(",").map((s) => s.trim());
      const kolomVol = kolomParts[0] || `VOLUME ${siteName} (MMSCF)`;
      const kolomEnergy = kolomParts[1] || `ENERGY ${siteName} (MMBTU)`;

      return `Site ${index + 1} (site_id: ${siteId}):
  - "VOLUME_${safeSiteName}"  → ambil dari kolom "${kolomVol}"  (null jika kosong atau –)
  - "ENERGY_${safeSiteName}"  → ambil dari kolom "${kolomEnergy}"  (null jika kosong atau –)`;
    })
    .filter(Boolean)
    .join("\n\n");

  const defaultSection = `Site 1 (site_id: [pilih pembangkit 1]):
  - "VOLUME_SITE1"  → ambil dari kolom "VOLUME (MMSCF)"  (null jika kosong atau –)
  - "ENERGY_SITE1"  → ambil dari kolom "ENERGY (MMBTU)"  (null jika kosong atau –)`;

  return `Kamu adalah parser data tabel gas. Tugasmu adalah mengekstrak data dari hasil OCR tabel laporan pengukuran gas.

STRUKTUR TABEL:
Tabel memiliki kolom: NO, TANGGAL, lalu beberapa pasang kolom VOLUME dan ENERGY 

INSTRUKSI EKSTRAKSI:
Dari setiap baris data (bukan baris TOTAL), ekstrak nilai berikut secara terpisah per site:

${dynamicSection || defaultSection}

FORMAT OUTPUT:
Kembalikan HANYA JSON berikut, tanpa teks lain, tanpa markdown, tanpa penjelasan:

Kembalikan data dalam format JSON array of objects.
Setiap object mewakili baris data dan harus memiliki key:
- "report_date" (format YYYY-MM-DD)
- "FLOWRATE_MMSCFD" (nilai numerik PERSIS seperti tertulis di dokumen pada kolom volume/flowrate)
- "ENERGY_BBTUD" (nilai numerik PERSIS seperti tertulis di dokumen pada kolom energy/BTU)


ATURAN PENTING:
1. "report_date" selalu format YYYY-MM-DD
2. Angka PERSIS seperti di dokumen, jangan konversi satuan apapun
3. Desimal pakai titik, hilangkan pemisah ribuan (contoh: 13,844.09053 → 13844.09053)
4. Jika sel kosong, strip (–), atau tidak terbaca → null
5. Baris TOTAL di akhir tabel JANGAN ikut diekstrak
6. Urutan baris sesuai tanggal dari atas ke bawah
7. Setiap site harus memiliki jumlah baris yang sama persis

TEKS OCR:
{text}`;
};

export default function InputBAValidasiModal({
  setOpenModal,
  onSuccess,
}: Props) {
  const [files, setFiles] = useState<(File | null)[]>([null, null]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([
    null,
    null,
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    siteId: "",
    siteIds: ["", ""],
    supplierId: "",
    reportDate: "",
    jenisBa: "Tunggal",
    halamanData: ["", ""],
    kolomYangDiambil: ["", ""],
    prompt: DEFAULT_PROMPT_SINGLE,
    convertToMmscf: false,
    convertToBbtu: false,
  });

  const [showPrompt, setShowPrompt] = useState(false);
  const [extractedRecords, setExtractedRecords] = useState<
    ExtractedRecord[] | null
  >(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kolomSuggestions, setKolomSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("kolomSuggestions");
    if (saved) {
      try {
        setKolomSuggestions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved kolomSuggestions", e);
      }
    }
  }, []);

  const { data: filtersData } = useFilters();

  // Dynamically update prompt for Multi Pembangkit when configurations change
  useEffect(() => {
    if (formData.jenisBa === "Multi Pembangkit") {
      const newPrompt = getMultiPembangkitPrompt(
        formData.siteIds,
        formData.kolomYangDiambil,
        filtersData?.pembangkit || []
      );
      
      // We check if the prompt starts with the known signature to only overwrite if it's the auto-generated one
      // or if it's completely default. This prevents overwriting manual prompt edits if they drastically changed it.
      // But actually, it's safer to just set it so it's fully dynamic as requested.
      setFormData((prev) => {
        if (prev.prompt !== newPrompt) {
          return { ...prev, prompt: newPrompt };
        }
        return prev;
      });
    }
  }, [formData.jenisBa, formData.siteIds, formData.kolomYangDiambil, filtersData?.pembangkit]);

  const extractOcr = useExtractOcrPage();
  const extractOcrMultiPage = useExtractOcrMultiPage();
  const batchCreate = useBatchCreateOcrReconciliationRecords();

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number = 0,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("File harus berupa PDF");
        return;
      }

      const newFiles = [...files];
      newFiles[index] = selectedFile;
      setFiles(newFiles);

      setError(null);
      // Create object URL for preview
      const url = URL.createObjectURL(selectedFile);
      const newUrls = [...previewUrls];
      newUrls[index] = url;
      setPreviewUrls(newUrls);
      setActiveFileIndex(index);
    }
  };

  const handleProcess = async () => {
    const isMultiStream = formData.jenisBa === "Multi Stream";
    const filesToUpload = isMultiStream
      ? files.filter(Boolean)
      : [files[0]].filter(Boolean);

    if (
      filesToUpload.length === 0 ||
      (!isMultiStream && !files[0]) ||
      (isMultiStream && filesToUpload.length < 2)
    ) {
      setError(
        `Silakan unggah ${isMultiStream ? "kedua" : "file"} PDF terlebih dahulu`,
      );
      return;
    }

    // Create the formData payload
    const formDataToSubmit = new FormData();
    filesToUpload.forEach((f) => {
      if (f) formDataToSubmit.append("files", f);
    });

    formDataToSubmit.append("siteId", formData.siteId);
    formDataToSubmit.append("supplierId", formData.supplierId);
    formDataToSubmit.append("reportDate", formData.reportDate);
    formDataToSubmit.append("jenisBa", formData.jenisBa);

    if (isMultiStream) {
      formDataToSubmit.append("halamanData", formData.halamanData[0] || "");
      formDataToSubmit.append("halamanData", formData.halamanData[1] || "");
      formDataToSubmit.append(
        "kolomYangDiambil",
        formData.kolomYangDiambil[0] || "",
      );
      formDataToSubmit.append(
        "kolomYangDiambil",
        formData.kolomYangDiambil[1] || "",
      );
    } else {
      formDataToSubmit.append("halamanData", formData.halamanData[0] || "");
      formDataToSubmit.append(
        "kolomYangDiambil",
        formData.kolomYangDiambil[0] || "",
      );
    }

    formDataToSubmit.append("convertToMmscf", String(formData.convertToMmscf));
    formDataToSubmit.append("convertToBbtu", String(formData.convertToBbtu));
    formDataToSubmit.append("prompt", formData.prompt);

    // Save new kolom suggestions to localStorage
    const newSuggestions = [...kolomSuggestions];
    let changed = false;
    formData.kolomYangDiambil.forEach((k) => {
      const val = k.trim();
      if (val && !newSuggestions.includes(val)) {
        newSuggestions.push(val);
        changed = true;
      }
    });
    if (changed) {
      setKolomSuggestions(newSuggestions);
      localStorage.setItem("kolomSuggestions", JSON.stringify(newSuggestions));
    }

    setIsProcessing(true);
    setError(null);
    try {
      let response;
      let mappedRecords: ExtractedRecord[] = [];

      if (formData.jenisBa === "Multi Pembangkit") {
        const singleFormData = new FormData();
        singleFormData.append("file", files[0]!);
        singleFormData.append("supplierId", formData.supplierId);
        singleFormData.append("reportDate", formData.reportDate);
        singleFormData.append("jenisBa", formData.jenisBa);
        singleFormData.append(
          "convertToMmscf",
          String(formData.convertToMmscf),
        );
        singleFormData.append("convertToBbtu", String(formData.convertToBbtu));
        singleFormData.append("prompt", formData.prompt);

        const multiConfig = formData.siteIds
          .map((id, index) => ({
            site_id: id,
            halaman_data: formData.halamanData[index] || "",
            kolom_yang_diambil: formData.kolomYangDiambil[index] || "",
          }))
          .filter((c) => c.site_id);

        singleFormData.append(
          "multiPembangkitConfig",
          JSON.stringify(multiConfig),
        );

        console.log("[DEBUG] Payload Multi Pembangkit:");
        singleFormData.forEach((value, key) => {
          console.log(`  ${key}:`, value);
        });

        const res = await extractOcr.mutateAsync(singleFormData);
        const results = res?.data?.results || [];

        let extracted: ExtractedRecord[] = [];
        results.forEach((result: any) => {
          const sId = result.site_id || "";
          const sName =
            result.site_name ||
            filtersData?.pembangkit?.find((p) => p.id === sId)?.name ||
            "";

          if (result.records && Array.isArray(result.records)) {
            const siteRecords = result.records.map((r: any) => ({
              tanggalKegiatan: r?.report_date || "",
              volume:
                r?.ENERGY_BBTUD != null ? String(r.ENERGY_BBTUD) : "0",
              flowrate:
                r?.FLOWRATE_MMSCFD != null
                  ? String(r.FLOWRATE_MMSCFD)
                  : "0",
              siteId: sId,
              siteName: sName,
            }));
            extracted = [...extracted, ...siteRecords];
          }
        });
        mappedRecords = extracted;
      } else if (isMultiStream) {
        console.log("[DEBUG] Payload Multi Stream:");
        formDataToSubmit.forEach((value, key) => {
          console.log(`  ${key}:`, value);
        });

        response = await extractOcrMultiPage.mutateAsync(formDataToSubmit);
      } else {
        // use single page api but append "file" instead of "files" since the single api expects "file"
        const singleFormData = new FormData();
        singleFormData.append("file", files[0]!);
        singleFormData.append("siteId", formData.siteId);
        singleFormData.append("supplierId", formData.supplierId);
        singleFormData.append("reportDate", formData.reportDate);
        singleFormData.append("jenisBa", formData.jenisBa);
        singleFormData.append("halamanData", formData.halamanData[0] || "");
        singleFormData.append(
          "kolomYangDiambil",
          formData.kolomYangDiambil[0] || "",
        );
        singleFormData.append(
          "convertToMmscf",
          String(formData.convertToMmscf),
        );
        singleFormData.append("convertToBbtu", String(formData.convertToBbtu));
        singleFormData.append("prompt", formData.prompt);

        console.log("[DEBUG] Payload Tunggal:");
        singleFormData.forEach((value, key) => {
          console.log(`  ${key}:`, value);
        });

        response = await extractOcr.mutateAsync(singleFormData);
      }

      if (formData.jenisBa !== "Multi Pembangkit") {
        const records = response?.data?.records || [];
        const mapped: ExtractedRecord[] = records.map((r: any) => {
          if (isMultiStream) {
            return {
              tanggalKegiatan: r?.report_date || "",
              volume:
                r?.TOTAL_ENERGY_BBTUD != null
                  ? String(r.TOTAL_ENERGY_BBTUD)
                  : "0",
              flowrate:
                r?.TOTAL_FLOWRATE_MMSCFD != null
                  ? String(r.TOTAL_FLOWRATE_MMSCFD)
                  : "0",
              stream1Volume:
                r?.ENERGY_BBTUD_stream_1 != null
                  ? String(r.ENERGY_BBTUD_stream_1)
                  : "0",
              stream1Flowrate:
                r?.FLOWRATE_MMSCFD_stream_1 != null
                  ? String(r.FLOWRATE_MMSCFD_stream_1)
                  : "0",
              stream2Volume:
                r?.ENERGY_BBTUD_stream_2 != null
                  ? String(r.ENERGY_BBTUD_stream_2)
                  : "0",
              stream2Flowrate:
                r?.FLOWRATE_MMSCFD_stream_2 != null
                  ? String(r.FLOWRATE_MMSCFD_stream_2)
                  : "0",
            };
          } else {
            return {
              tanggalKegiatan: r?.report_date || "",
              volume:
                r?.ENERGY_BBTUD != null ? String(r.ENERGY_BBTUD) : "0",
              flowrate:
                r?.FLOWRATE_MMSCFD != null
                  ? String(r.FLOWRATE_MMSCFD)
                  : "0",
            };
          }
        });
        mappedRecords = mapped;
      }

      setExtractedRecords(
        mappedRecords.length > 0
          ? mappedRecords
          : [{ tanggalKegiatan: "", volume: "0", flowrate: "0" }],
      );
      if (formData.jenisBa === "Multi Pembangkit" && mappedRecords.length > 0) {
        setActiveTabId(mappedRecords[0].siteId || null);
      }
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
      const recordsPayload =
        extractedRecords?.map((rec) => ({
          report_date: rec.tanggalKegiatan,
          FLOWRATE_MMSCFD: Number(rec.flowrate) || 0,
          ENERGY_BBTUD: Number(rec.volume) || 0,
          site_id: rec.siteId || formData.siteId,
          supplier_id: formData.supplierId,
          NEED_CONVERT_TO_MMSCF: formData.convertToMmscf,
          NEED_CONVERT_TO_BBTU: formData.convertToBbtu,
        })) || [];

      const submitData = new FormData();
      submitData.append("records", JSON.stringify(recordsPayload));
      submitData.append("convertToMMSCF", String(formData.convertToMmscf));
      submitData.append("convertToBBTU", String(formData.convertToBbtu));

      files.forEach((f) => {
        if (f) submitData.append("files", f);
      });

      const response = await batchCreate.mutateAsync(submitData);

      setShowSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        setOpenModal(false);
        previewUrls.forEach((url) => {
          if (url) URL.revokeObjectURL(url);
        });
      }, 1500);
    } catch (err: any) {
      console.error("Gagal menyimpan data:", err);
      setError(err?.message || "Gagal menyimpan data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    previewUrls.forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    setOpenModal(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white w-[98vw] max-w-[1600px] h-[90vh] rounded-xl shadow-lg flex flex-col z-10 overflow-hidden">
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
        <div className="flex-1 overflow-auto p-4 md:p-6 relative">
          {isProcessing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
              <div className="w-12 h-12 border-4 border-secondary/30 border-t-[#14a2bb] rounded-full animate-spin"></div>
              <p className="mt-4 text-primary font-semibold text-lg">
                {extractedRecords
                  ? "Menyimpan Data..."
                  : "Memproses dokumen PDF..."}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Mohon tunggu sebentar.
              </p>
            </div>
          )}
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
            <div className="w-full lg:w-3/5 h-[400px] lg:h-full flex flex-col gap-4 relative">
              {(formData.jenisBa === "Multi Stream" ? [0, 1] : [0]).map(
                (index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col border border-gray-300 rounded-lg overflow-hidden relative bg-gray-50 min-h-[300px]"
                  >
                    {/* Label for stream */}
                    {formData.jenisBa === "Multi Stream" && (
                      <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 font-semibold text-gray-700 text-sm">
                        Stream {index + 1}
                      </div>
                    )}
                    {!previewUrls[index] ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <div
                          className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => {
                            setActiveFileIndex(index);
                            fileInputRef.current?.click();
                          }}
                        >
                          <button className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-[#0d4a5c] transition-colors flex items-center gap-2">
                            <Upload size={18} />
                            Unggah PDF{" "}
                            {formData.jenisBa === "Multi Stream" &&
                              `Stream ${index + 1}`}
                          </button>
                          <p className="mt-3 text-sm text-gray-500">
                            Klik untuk memilih file PDF
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 relative w-full h-full">
                        <object
                          data={previewUrls[index]!}
                          type="application/pdf"
                          className="w-full h-full"
                        >
                          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                            <p className="text-gray-600 mb-4">
                              Browser Anda tidak mendukung preview PDF secara
                              langsung.
                            </p>
                            <a
                              href={previewUrls[index]!}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg"
                            >
                              Buka PDF di Tab Baru
                            </a>
                          </div>
                        </object>
                        {/* Button to change file */}
                        <button
                          onClick={() => {
                            setActiveFileIndex(index);
                            fileInputRef.current?.click();
                          }}
                          className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur shadow-sm border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors z-10"
                        >
                          Ganti PDF
                        </button>
                      </div>
                    )}
                  </div>
                ),
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e, activeFileIndex)}
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
                            onChange={(e) => {
                              const multiPembangkitPrompt = getMultiPembangkitPrompt(
                                formData.siteIds,
                                formData.kolomYangDiambil,
                                filtersData?.pembangkit || []
                              );
                              const newPrompt =
                                formData.prompt === DEFAULT_PROMPT_MULTI ||
                                formData.prompt === multiPembangkitPrompt ||
                                formData.prompt === ""
                                  ? DEFAULT_PROMPT_SINGLE
                                  : formData.prompt;
                              setFormData({
                                ...formData,
                                jenisBa: e.target.value,
                                prompt: newPrompt,
                              });
                            }}
                            className="w-4 h-4 text-primary focus:ring-secondary"
                          />
                          <span className="text-sm text-gray-700">Tunggal</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="jenisBa"
                            value="Multi Stream"
                            checked={formData.jenisBa === "Multi Stream"}
                            onChange={(e) => {
                              const multiPembangkitPrompt = getMultiPembangkitPrompt(
                                formData.siteIds,
                                formData.kolomYangDiambil,
                                filtersData?.pembangkit || []
                              );
                              const newPrompt =
                                formData.prompt === DEFAULT_PROMPT_SINGLE ||
                                formData.prompt === multiPembangkitPrompt ||
                                formData.prompt === ""
                                  ? DEFAULT_PROMPT_MULTI
                                  : formData.prompt;
                              setFormData({
                                ...formData,
                                jenisBa: e.target.value,
                                prompt: newPrompt,
                              });
                            }}
                            className="w-4 h-4 text-primary focus:ring-secondary"
                          />
                          <span className="text-sm text-gray-700">
                            Multi Stream
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="jenisBa"
                            value="Multi Pembangkit"
                            checked={formData.jenisBa === "Multi Pembangkit"}
                            onChange={(e) => {
                              const multiPembangkitPrompt = getMultiPembangkitPrompt(
                                formData.siteIds,
                                formData.kolomYangDiambil,
                                filtersData?.pembangkit || []
                              );
                              const newPrompt =
                                formData.prompt === DEFAULT_PROMPT_MULTI ||
                                formData.prompt === DEFAULT_PROMPT_SINGLE ||
                                formData.prompt === ""
                                  ? multiPembangkitPrompt
                                  : formData.prompt;
                              setFormData({
                                ...formData,
                                jenisBa: e.target.value,
                                prompt: newPrompt,
                              });
                            }}
                            className="w-4 h-4 text-primary focus:ring-secondary"
                          />
                          <span className="text-sm text-gray-700">
                            Multi Pembangkit
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TBBM <span className="text-red-500">*</span>
                      </label>
                      <Autocomplete
                        options={(filtersData?.pemasok || []).filter(
                          (p) =>
                            p.commodity?.toUpperCase() === "LNG" ||
                            p.commodity?.toUpperCase() === "GAS PIPA",
                        )}
                        getOptionLabel={(option) => option.name}
                        value={
                          filtersData?.pemasok?.find(
                            (p) => p.id === formData.supplierId,
                          ) || null
                        }
                        onChange={(event, newValue) => {
                          setFormData({
                            ...formData,
                            supplierId: newValue ? newValue.id : "",
                          });
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

                    {formData.jenisBa !== "Multi Pembangkit" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pembangkit <span className="text-red-500">*</span>
                        </label>
                        <Autocomplete
                          options={(filtersData?.pembangkit || []).filter(
                            (p) =>
                              p.commodity?.toUpperCase() === "LNG" ||
                              p.commodity?.toUpperCase() === "GAS PIPA",
                          )}
                          getOptionLabel={(option) => option.name}
                          value={
                            filtersData?.pembangkit?.find(
                              (p) => p.id === formData.siteId,
                            ) || null
                          }
                          onChange={(event, newValue) => {
                            setFormData({
                              ...formData,
                              siteId: newValue ? newValue.id : "",
                            });
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
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Kegiatan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="month"
                        value={formData.reportDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reportDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                      />
                    </div>

                    {(formData.jenisBa === "Multi Pembangkit"
                      ? Array.from(
                          { length: Math.max(2, formData.siteIds.length) },
                          (_, i) => i,
                        )
                      : formData.jenisBa === "Multi Stream"
                        ? [0, 1]
                        : [0]
                    ).map((index) => (
                      <div
                        key={index}
                        className="space-y-5 p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4"
                      >
                        {formData.jenisBa === "Multi Stream" && (
                          <div className="font-semibold text-gray-700 text-sm">
                            Konfigurasi Stream {index + 1}
                          </div>
                        )}
                        {formData.jenisBa === "Multi Pembangkit" && (
                          <div className="flex justify-between items-center">
                            <div className="font-semibold text-gray-700 text-sm">
                              Konfigurasi Pembangkit {index + 1}
                            </div>
                            {formData.siteIds.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newSiteIds = [...formData.siteIds];
                                  const newHalamanData = [
                                    ...formData.halamanData,
                                  ];
                                  const newKolom = [
                                    ...formData.kolomYangDiambil,
                                  ];

                                  newSiteIds.splice(index, 1);
                                  newHalamanData.splice(index, 1);
                                  newKolom.splice(index, 1);

                                  setFormData({
                                    ...formData,
                                    siteIds: newSiteIds,
                                    halamanData: newHalamanData,
                                    kolomYangDiambil: newKolom,
                                  });
                                }}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        )}

                        {formData.jenisBa === "Multi Pembangkit" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pembangkit <span className="text-red-500">*</span>
                            </label>
                            <Autocomplete
                              options={(filtersData?.pembangkit || []).filter(
                                (p) =>
                                  p.commodity?.toUpperCase() === "LNG" ||
                                  p.commodity?.toUpperCase() === "GAS PIPA",
                              )}
                              getOptionLabel={(option) => option.name}
                              value={
                                filtersData?.pembangkit?.find(
                                  (p) => p.id === formData.siteIds[index],
                                ) || null
                              }
                              onChange={(event, newValue) => {
                                const newSiteIds = [...formData.siteIds];
                                newSiteIds[index] = newValue ? newValue.id : "";
                                setFormData({
                                  ...formData,
                                  siteIds: newSiteIds,
                                });
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
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Halaman Data{" "}
                            {formData.jenisBa === "Multi Stream"
                              ? `Stream ${index + 1}`
                              : ""}
                          </label>
                          <input
                            type="text"
                            value={formData.halamanData[index]}
                            onChange={(e) => {
                              const newData = [...formData.halamanData];
                              newData[index] = e.target.value;
                              setFormData({
                                ...formData,
                                halamanData: newData,
                              });
                            }}
                            placeholder="Contoh: 1, 3, 5-7 (Kosongkan untuk seluruh halaman)"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                          />
                          <p className="text-xs text-gray-500 mt-1.5">
                            Masukkan nomor halaman spesifik yang ingin diproses
                            dari PDF ini.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kolom yang Diambil{" "}
                            {formData.jenisBa === "Multi Stream"
                              ? `Stream ${index + 1}`
                              : ""}
                          </label>
                          <input
                            type="text"
                            list="kolom-suggestions"
                            value={formData.kolomYangDiambil[index]}
                            onChange={(e) => {
                              const newData = [...formData.kolomYangDiambil];
                              newData[index] = e.target.value;
                              setFormData({
                                ...formData,
                                kolomYangDiambil: newData,
                              });
                            }}
                            placeholder="Contoh: Tanggal, Volume, Harga (Pisahkan dengan koma)"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                          />
                          <datalist id="kolom-suggestions">
                            {kolomSuggestions.map((sug, i) => (
                              <option key={i} value={sug} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                    ))}

                    {formData.jenisBa === "Multi Pembangkit" && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            siteIds: [...formData.siteIds, ""],
                            halamanData: [...formData.halamanData, ""],
                            kolomYangDiambil: [
                              ...formData.kolomYangDiambil,
                              "",
                            ],
                          });
                        }}
                        className="text-primary hover:text-[#0d4a5c] text-sm font-medium flex items-center gap-1 transition-colors mt-2 mb-4"
                      >
                        + Tambah Pembangkit
                      </button>
                    )}

                    <div>
                      <button
                        type="button"
                        onClick={() => setShowPrompt(!showPrompt)}
                        className="text-primary hover:text-[#0d4a5c] text-sm font-medium flex items-center gap-1 transition-colors"
                      >
                        {showPrompt
                          ? "Sembunyikan Prompt"
                          : "+ Tambah Prompt Khusus"}
                      </button>

                      {showPrompt && (
                        <div className="mt-3 animate-fade-in">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prompt AI
                          </label>
                          <textarea
                            value={formData.prompt}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                prompt: e.target.value,
                              })
                            }
                            placeholder="Masukkan instruksi khusus untuk pemrosesan AI..."
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all resize-y min-h-[100px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end flex-shrink-0 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleProcess}
                      disabled={
                        isProcessing ||
                        (formData.jenisBa === "Multi Stream"
                          ? !files[0] || !files[1]
                          : !files[0]) ||
                        (formData.jenisBa === "Multi Pembangkit"
                          ? formData.siteIds.every((id) => !id)
                          : !formData.siteId) ||
                        !formData.supplierId ||
                        !formData.reportDate
                      }
                      className="px-6 py-2.5 font-medium text-white bg-primary rounded-lg hover:bg-[#0d4a5c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full md:w-auto"
                    >
                      {isProcessing ? "Memproses..." : "Proses PDF"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4 flex-1 flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-2 flex-shrink-0">
                      <h4 className="font-bold text-gray-900 text-lg">
                        Review Data Extracted
                      </h4>
                      <button
                        onClick={() => setExtractedRecords(null)}
                        className="text-sm text-primary hover:underline"
                      >
                        Kembali ke Form
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                      {formData.jenisBa === "Multi Pembangkit" &&
                        extractedRecords && (
                          <div className="flex border-b border-gray-200 mb-2 overflow-x-auto hide-scrollbar">
                            {Array.from(
                              new Set(
                                extractedRecords
                                  .map((r) => r.siteId)
                                  .filter(Boolean),
                              ),
                            ).map((siteId) => {
                              const siteName =
                                extractedRecords.find(
                                  (r) => r.siteId === siteId,
                                )?.siteName || "Unknown";
                              const isActive = activeTabId === siteId;
                              return (
                                <button
                                  key={siteId}
                                  onClick={() =>
                                    setActiveTabId(siteId as string)
                                  }
                                  className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                                    isActive
                                      ? "border-primary text-primary"
                                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                  }`}
                                >
                                  {siteName}
                                </button>
                              );
                            })}
                          </div>
                        )}

                      <div
                        className={`grid ${formData.jenisBa === "Multi Stream" ? "grid-cols-7 text-[11px]" : "grid-cols-3 text-sm"} gap-2 mb-2 px-1 sticky top-0 bg-white z-10 pb-2 border-b border-gray-100`}
                      >
                        <div className="font-semibold text-gray-700 text-center">
                          Tanggal Kegiatan
                        </div>
                        {formData.jenisBa === "Multi Stream" ? (
                          <>
                            <div className="font-semibold text-gray-700 text-center">
                              S1 FLOWRATE
                            </div>
                            <div className="font-semibold text-gray-700 text-center">
                              S1 VOLUME
                            </div>
                            <div className="font-semibold text-gray-700 text-center">
                              S2 FLOWRATE
                            </div>
                            <div className="font-semibold text-gray-700 text-center">
                              S2 VOLUME
                            </div>
                            <div className="font-semibold text-gray-700 text-center text-primary">
                              TOTAL FLOW
                            </div>
                            <div className="font-semibold text-gray-700 text-center text-primary">
                              TOTAL VOL
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold text-gray-700 text-center">
                              {formData.jenisBa === "Multi Pembangkit" ? "VOLUME" : "FLOWRATE"}
                            </div>
                            <div className="font-semibold text-gray-700 text-center">
                              {formData.jenisBa === "Multi Pembangkit" ? "ENERGI" : "VOLUME"}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-2">
                        {extractedRecords.map((rec, index) => {
                          if (
                            formData.jenisBa === "Multi Pembangkit" &&
                            rec.siteId !== activeTabId
                          )
                            return null;
                          return (
                            <div
                              key={index}
                              className={`grid ${formData.jenisBa === "Multi Stream" ? "grid-cols-7" : "grid-cols-3"} gap-2`}
                            >
                              <input
                                type="text"
                                value={rec.tanggalKegiatan}
                                onChange={(e) => {
                                  const newRecs = [...extractedRecords];
                                  newRecs[index].tanggalKegiatan =
                                    e.target.value;
                                  setExtractedRecords(newRecs);
                                }}
                                className={`w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary ${formData.jenisBa === "Multi Stream" ? "text-xs" : "text-sm"}`}
                              />
                              {formData.jenisBa === "Multi Stream" && (
                                <>
                                  <input
                                    type="text"
                                    value={rec.stream1Flowrate || ""}
                                    onChange={(e) => {
                                      const newRecs = [...extractedRecords];
                                      newRecs[index].stream1Flowrate =
                                        e.target.value;
                                      const val1 =
                                        parseFloat(e.target.value) || 0;
                                      const val2 =
                                        parseFloat(
                                          rec.stream2Flowrate || "0",
                                        ) || 0;
                                      newRecs[index].flowrate = String(
                                        val1 + val2,
                                      );
                                      setExtractedRecords(newRecs);
                                    }}
                                    className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-right"
                                  />
                                  <input
                                    type="text"
                                    value={rec.stream1Volume || ""}
                                    onChange={(e) => {
                                      const newRecs = [...extractedRecords];
                                      newRecs[index].stream1Volume =
                                        e.target.value;
                                      const val1 =
                                        parseFloat(e.target.value) || 0;
                                      const val2 =
                                        parseFloat(rec.stream2Volume || "0") ||
                                        0;
                                      newRecs[index].volume = String(
                                        val1 + val2,
                                      );
                                      setExtractedRecords(newRecs);
                                    }}
                                    className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-right"
                                  />
                                  <input
                                    type="text"
                                    value={rec.stream2Flowrate || ""}
                                    onChange={(e) => {
                                      const newRecs = [...extractedRecords];
                                      newRecs[index].stream2Flowrate =
                                        e.target.value;
                                      const val1 =
                                        parseFloat(
                                          rec.stream1Flowrate || "0",
                                        ) || 0;
                                      const val2 =
                                        parseFloat(e.target.value) || 0;
                                      newRecs[index].flowrate = String(
                                        val1 + val2,
                                      );
                                      setExtractedRecords(newRecs);
                                    }}
                                    className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-right"
                                  />
                                  <input
                                    type="text"
                                    value={rec.stream2Volume || ""}
                                    onChange={(e) => {
                                      const newRecs = [...extractedRecords];
                                      newRecs[index].stream2Volume =
                                        e.target.value;
                                      const val1 =
                                        parseFloat(rec.stream1Volume || "0") ||
                                        0;
                                      const val2 =
                                        parseFloat(e.target.value) || 0;
                                      newRecs[index].volume = String(
                                        val1 + val2,
                                      );
                                      setExtractedRecords(newRecs);
                                    }}
                                    className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-right"
                                  />
                                </>
                              )}
                              <input
                                type="text"
                                value={rec.flowrate}
                                onChange={(e) => {
                                  const newRecs = [...extractedRecords];
                                  newRecs[index].flowrate = e.target.value;
                                  setExtractedRecords(newRecs);
                                }}
                                className={`w-full px-2 py-2 bg-white border ${formData.jenisBa === "Multi Stream" ? "border-primary bg-blue-50/30" : "border-gray-300"} rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-right font-medium ${formData.jenisBa === "Multi Stream" ? "text-xs" : "text-sm"}`}
                              />
                              <input
                                type="text"
                                value={rec.volume}
                                onChange={(e) => {
                                  const newRecs = [...extractedRecords];
                                  newRecs[index].volume = e.target.value;
                                  setExtractedRecords(newRecs);
                                }}
                                className={`w-full px-2 py-2 bg-white border ${formData.jenisBa === "Multi Stream" ? "border-primary bg-blue-50/30" : "border-gray-300"} rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-right font-medium ${formData.jenisBa === "Multi Stream" ? "text-xs" : "text-sm"}`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div
                        className={`grid ${formData.jenisBa === "Multi Stream" ? "grid-cols-7" : "grid-cols-3"} gap-2 mt-4 pt-4 border-t border-gray-200`}
                      >
                        <div className="text-sm font-bold text-gray-700 flex items-center justify-center">
                          Total Keseluruhan
                        </div>
                        {formData.jenisBa === "Multi Stream" && (
                          <>
                            <input
                              type="text"
                              readOnly
                              value={extractedRecords
                                .reduce(
                                  (sum, r) =>
                                    sum +
                                    (parseFloat(r.stream1Flowrate || "0") || 0),
                                  0,
                                )
                                .toFixed(4)}
                              className="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-900 text-right text-xs"
                            />
                            <input
                              type="text"
                              readOnly
                              value={extractedRecords
                                .reduce(
                                  (sum, r) =>
                                    sum +
                                    (parseFloat(r.stream1Volume || "0") || 0),
                                  0,
                                )
                                .toFixed(4)}
                              className="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-900 text-right text-xs"
                            />
                            <input
                              type="text"
                              readOnly
                              value={extractedRecords
                                .reduce(
                                  (sum, r) =>
                                    sum +
                                    (parseFloat(r.stream2Flowrate || "0") || 0),
                                  0,
                                )
                                .toFixed(4)}
                              className="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-900 text-right text-xs"
                            />
                            <input
                              type="text"
                              readOnly
                              value={extractedRecords
                                .reduce(
                                  (sum, r) =>
                                    sum +
                                    (parseFloat(r.stream2Volume || "0") || 0),
                                  0,
                                )
                                .toFixed(4)}
                              className="w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-900 text-right text-xs"
                            />
                          </>
                        )}
                        <input
                          type="text"
                          readOnly
                          value={extractedRecords
                            .filter(r => formData.jenisBa !== "Multi Pembangkit" || r.siteId === activeTabId)
                            .reduce(
                              (sum, r) => sum + (parseFloat(r.flowrate) || 0),
                              0,
                            )
                            .toFixed(4)}
                          className={`w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-900 text-right ${formData.jenisBa === "Multi Stream" ? "text-xs" : "text-sm"}`}
                        />
                        <input
                          type="text"
                          readOnly
                          value={extractedRecords
                            .filter(r => formData.jenisBa !== "Multi Pembangkit" || r.siteId === activeTabId)
                            .reduce(
                              (sum, r) => sum + (parseFloat(r.volume) || 0),
                              0,
                            )
                            .toFixed(4)}
                          className={`w-full px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg font-bold text-gray-900 text-right ${formData.jenisBa === "Multi Stream" ? "text-xs" : "text-sm"}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center flex-shrink-0 pt-4 border-t border-gray-100 gap-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.convertToMmscf}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              convertToMmscf: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-primary rounded focus:ring-secondary"
                        />
                        <span className="text-sm text-gray-700">
                          Konversi ke MMSCF
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.convertToBbtu}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              convertToBbtu: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-primary rounded focus:ring-secondary"
                        />
                        <span className="text-sm text-gray-700">
                          Konversi ke BBTU
                        </span>
                      </label>
                    </div>
                    <button
                      onClick={handleSimpanData}
                      disabled={isProcessing}
                      className="px-6 py-2.5 font-medium text-white bg-primary rounded-lg hover:bg-[#0d4a5c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full md:w-auto"
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

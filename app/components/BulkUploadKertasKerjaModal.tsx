"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  Database,
  FileSpreadsheet,
  Loader2,
  Save
} from "lucide-react";
import * as XLSX from "xlsx";
import { useBulkUpsertKertasKerjaRecords, type TemplateKertasKerja, type RecordKertasKerja } from "@/hooks/service/kertas-kerja-api";

type Props = {
  templates: TemplateKertasKerja[];
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

interface ParsedKertasKerjaRow {
  template_kertas_kerja_id: string;
  month_work: string;
  stock: number | null;
  hop: number | null;
  terima: number | null;
  pemakaian: number | null;
  stock_akhir_bulan: number | null;
  shop_akhir_bulan: number | null;
  renominasi_pesan: number | null;
  renominaso_proyeksi_akhir_bulan: number | null;
  delta_terima: number | null;
  pencapaian: number | null;
  rencana_pesan: number | null;
  rencana_hop: number | null;
  keterangan: string | null;
  // UI Display info
  sheetName: string;
  siteName: string;
  productName: string;
  supplierName: string;
  modaName: string;
}

export default function BulkUploadKertasKerjaModal({ templates, setOpenModal, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedKertasKerjaRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkSave = useBulkUpsertKertasKerjaRecords();

  // Parse Excel to extract sheet names when a file is selected
  useEffect(() => {
    if (!file) {
      setSheetNames([]);
      setSelectedSheets([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: "array" });
        setSheetNames(workbook.SheetNames);
        
        // Auto-select sheets starting with numbers (like "01. PNP", "02. PIP", etc.)
        const defaultSheets = workbook.SheetNames.filter((name) =>
          /^\d+/.test(name)
        );
        setSelectedSheets(
          defaultSheets.length > 0 ? defaultSheets : [workbook.SheetNames[0]]
        );
      } catch (err) {
        console.error("Gagal membaca daftar sheet:", err);
        setError("Gagal membaca file Excel. Pastikan format file benar.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleSheetToggle = (sheet: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sheet) ? prev.filter((s) => s !== sheet) : [...prev, sheet],
    );
  };

  const parseExcelNumber = (val: unknown): number | null => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    if (
      s === "" ||
      s === "-" ||
      s === "#DIV/0!" ||
      s === "#N/A" ||
      s === "#VALUE!"
    )
      return null;
    const num = parseFloat(s.replace(/,/g, ""));
    return isNaN(num) ? null : Math.round(num * 10000) / 10000;
  };

  const parseExcelString = (val: unknown): string | null => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    if (s === "" || s === "-") return null;
    return s;
  };

  const normalizeMonthWork = (rawLabel: string): string => {
    if (!rawLabel) return "";
    
    let s = rawLabel.toLowerCase().trim();
    
    const monthMap: Record<string, string> = {
      jan: "Jan", janu: "Jan", january: "Jan", januari: "Jan",
      feb: "Feb", peb: "Feb", february: "Feb", februari: "Feb", pebruari: "Feb",
      mar: "Mar", maret: "Mar", march: "Mar",
      apr: "Apr", april: "Apr",
      mei: "Mei", may: "Mei",
      jun: "Jun", juni: "Jun", june: "Jun",
      jul: "Jul", juli: "Jul", july: "Jul",
      agu: "Agu", agus: "Agu", agustus: "Agu", aug: "Agu", august: "Agu",
      sep: "Sep", sept: "Sep", september: "Sep",
      okt: "Okt", oct: "Okt", oktober: "Okt", october: "Okt",
      nov: "Nov", nop: "Nov", november: "Nov", nopember: "Nov",
      des: "Des", dec: "Des", desember: "Des", december: "Des"
    };

    let foundMonth = "";
    const words = s.replace(/[^a-z0-9]/gi, ' ').split(' ').filter(Boolean);
    for (const w of words) {
      if (/^\d+$/.test(w)) continue; // skip numbers
      for (const key of Object.keys(monthMap)) {
        if (w.startsWith(key)) {
          foundMonth = monthMap[key];
          break;
        }
      }
      if (foundMonth) break;
    }

    let foundYear = "";
    const yearMatch4 = s.match(/\b(20\d{2})\b/);
    if (yearMatch4) {
      foundYear = yearMatch4[1].substring(2);
    } else {
      const nums = s.match(/\b\d{2}\b/g);
      if (nums && nums.length > 0) {
         foundYear = nums[nums.length - 1];
      }
    }

    if (foundMonth && foundYear) {
      return `${foundMonth} '${foundYear}`;
    }
    
    return rawLabel;
  };

  const handleParseData = async () => {
    if (!file || selectedSheets.length === 0) {
      setError("Pilih file dan minimal satu sheet untuk diunggah");
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("File empty");
          const workbook = XLSX.read(data, { type: "array" });

          const results: ParsedKertasKerjaRow[] = [];
          let errorMessages: string[] = [];

          for (const sheetName of selectedSheets) {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) continue;

            const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
              header: 1,
              defval: null,
            });

            if (jsonData.length < 4) {
              errorMessages.push(`Sheet "${sheetName}": Format tidak sesuai (minimal 4 baris)`);
              continue;
            }

            let headerRowIndex = -1;
            for (let r = 0; r < Math.min(jsonData.length, 10); r++) {
              const row = jsonData[r];
              if (row && row.some(cell => cell !== null && cell !== undefined && String(cell).match(/^STOK\s+(.+?)\s*\([kK][lL]\)$/i))) {
                headerRowIndex = r;
                break;
              }
            }

            if (headerRowIndex === -1) {
              errorMessages.push(`Sheet "${sheetName}": Tidak dapat menemukan baris header (harus ada kolom dengan format "STOK [Bulan] (kL)")`);
              continue;
            }

            const headerRow = jsonData[headerRowIndex];
            console.log("=== EXCEL HEADER DEBUG ===");
            console.log("Sheet:", sheetName);
            console.log("Header Row Index:", headerRowIndex);
            if (headerRowIndex > 0) console.log("Row -2:", jsonData[headerRowIndex - 2]);
            console.log("Row -1:", jsonData[headerRowIndex - 1]);
            console.log("Row 0 (Header):", headerRow);
            console.log("Row +1:", jsonData[headerRowIndex + 1]);
            console.log("Row +2:", jsonData[headerRowIndex + 2]);
            console.log("==========================");
            if (!headerRow || headerRow.length < 13) {
              errorMessages.push(`Sheet "${sheetName}": Header tidak valid (kolom kurang dari 13)`);
              continue;
            }

            // Extract dynamic months
            const detectedMonths: string[] = [];
            // We search through all columns just in case indices shifted slightly
            let firstMonthColIndex = -1;
            for (let i = 0; i < headerRow.length; i++) {
              const cell = headerRow[i];
              if (cell !== undefined && cell !== null) {
                const cellStr = String(cell).trim();
                const match = cellStr.match(/^STOK\s+(.+?)\s*\([kK][lL]\)$/i);
                if (match) {
                  if (firstMonthColIndex === -1) firstMonthColIndex = i;
                  const m = match[1].trim();
                  if (m) detectedMonths.push(m);
                }
              }
            }

            const numMonths = detectedMonths.length;
            if (numMonths === 0) {
              errorMessages.push(`Sheet "${sheetName}": Tidak ada kolom bulan (STOK ... (kL)) yang terdeteksi`);
              continue;
            }

            // Dynamically find identifier column indices
            let colSite = 3, colProduct = 4, colModa = 5, colSupplier = 6;
            for (let i = 0; i < firstMonthColIndex; i++) {
              const h = String(headerRow[i] || "").toUpperCase().replace(/\s+/g, " ").trim();
              if (h.includes("PEMBANGKIT") && !h.includes("JENIS")) colSite = i;
              else if (h.includes("JENIS BBM") || h.includes("PRODUK")) colProduct = i;
              else if (h.includes("MODA")) colModa = i;
              else if (h.includes("TBBM") || h.includes("SUPPLIER")) colSupplier = i;
            }

            // Build Row 3 Map for dynamic column matching
            const row3 = jsonData[headerRowIndex];
            const row4 = jsonData[headerRowIndex + 1] || [];
            const row5 = jsonData[headerRowIndex + 2] || [];
            
            const row3Map: { name: string, start: number, end: number }[] = [];
            let lastRow3: any = null;
            for (let c = 0; c < 300; c++) {
              if (row3[c]) {
                if (lastRow3) lastRow3.end = c - 1;
                lastRow3 = { name: String(row3[c]).trim().toUpperCase(), start: c, end: 300 };
                row3Map.push(lastRow3);
              }
            }

            const getSubCategoryCols = (row3Match: string, row4Match: string): number[] => {
              const cols: number[] = [];
              const cats = row3Map.filter(x => x.name.includes(row3Match));
              if (cats.length === 0) return cols;
              for (const cat of cats) {
                let inSubCat = false;
                for (let c = cat.start; c <= cat.end; c++) {
                  if (row4[c]) {
                    if (String(row4[c]).toUpperCase().includes(row4Match)) {
                      inSubCat = true;
                    } else {
                      inSubCat = false;
                    }
                  }
                  if (inSubCat) cols.push(c);
                }
              }
              if (cols.length === 0) {
                for (let c = 0; c < 300; c++) {
                  if (row4[c] && String(row4[c]).toUpperCase().includes(row4Match)) {
                    for (let k = c; k < c + 30; k++) {
                      if (row4[k] && String(row4[k]).toUpperCase().includes(row4Match) === false) break;
                      cols.push(k);
                    }
                    break;
                  }
                }
              }
              return cols;
            };

            const findColForMonth = (cols: number[], targetMonth: string): number => {
              const target = normalizeMonthWork(targetMonth);
              for (const c of cols) {
                if (row5[c] && normalizeMonthWork(String(row5[c])) === target) return c;
                if (row4[c] && normalizeMonthWork(String(row4[c])) === target) return c;
              }
              for (let c = 70; c < 300; c++) {
                if (row5[c] && normalizeMonthWork(String(row5[c])) === target) return c;
              }
              return -1;
            };

            const terimaCols = getSubCategoryCols("REALISASI", "TERIMA");
            const pemakaianCols = getSubCategoryCols("REALISASI", "PEMAKAIAN");
            const stockAkhirCols = getSubCategoryCols("REALISASI", "STOK AKHIR");
            const shopAkhirCols = getSubCategoryCols("REALISASI", "SHOP AKHIR");
            const renoPesanCols = getSubCategoryCols("RENOMINASI", "PESAN");
            const renoProyeksiCols = getSubCategoryCols("RENOMINASI", "PROYEKSI");
            const deltaTerimaCols = getSubCategoryCols("DELTA", "DELTA TERIMA");
            const pencapaianCols = getSubCategoryCols("DELTA", "PENCAPAIAN");
            const rencanaPesanCols = getSubCategoryCols("RENCANA", "PESAN");
            const rencanaHopCols = getSubCategoryCols("RENCANA", "HOP");

            const findKeteranganCol = (targetMonth: string): number => {
              const target = normalizeMonthWork(targetMonth);
              for (let c = 0; c < 300; c++) {
                if (row4[c] && String(row4[c]).toLowerCase().includes("ket")) {
                  const m = String(row4[c]).replace(/ket/i, "").replace(/\(pilih salah satu\)/i, "").trim();
                  if (normalizeMonthWork(m) === target) return c;
                }
              }
              return -1;
            };

            const monthColMap: Record<number, any> = {};
            for (let i = 0; i < numMonths; i++) {
               const m = detectedMonths[i];
               monthColMap[i] = {
                 terima: findColForMonth(terimaCols, m),
                 pemakaian: findColForMonth(pemakaianCols, m),
                 stockAkhir: findColForMonth(stockAkhirCols, m),
                 shopAkhir: findColForMonth(shopAkhirCols, m),
                 renoPesan: findColForMonth(renoPesanCols, m),
                 renoProyeksi: findColForMonth(renoProyeksiCols, m),
                 deltaTerima: findColForMonth(deltaTerimaCols, m),
                 pencapaian: findColForMonth(pencapaianCols, m),
                 rencanaPesan: findColForMonth(rencanaPesanCols, m),
                 rencanaHop: findColForMonth(rencanaHopCols, m),
                 keterangan: findKeteranganCol(m),
               };
            }

            // Parse data rows (start 3 rows below the header row, as per export format)
            for (let rIdx = headerRowIndex + 3; rIdx < jsonData.length; rIdx++) {
              const row = jsonData[rIdx];
              if (!row || row.length === 0) continue;

              const no = row[0];
              // Data rows must start with a number
              if (no === null || no === undefined || isNaN(Number(no)) || String(no).trim() === "") {
                continue;
              }

              const siteName = String(row[colSite] || "").trim();
              const productName = String(row[colProduct] || "").trim();
              const modaName = String(row[colModa] || "").trim();
              const supplierName = String(row[colSupplier] || "").trim();

              // Find matching template (case-insensitive)
              const template = templates.find((t) => {
                const s1 = (t.site_name || "").toLowerCase().trim();
                const s2 = siteName.toLowerCase().trim();
                const p1 = (t.product_name || "").toLowerCase().trim();
                const p2 = productName.toLowerCase().trim();
                const sup1 = (t.supplier_name || "").toLowerCase().trim();
                const sup2 = supplierName.toLowerCase().trim();
                
                return s1 === s2 && p1 === p2 && sup1 === sup2;
              });

              if (!template) {
                // We ignore rows that do not match templates, or we could flag an error.
                // It is safer to ignore since there are total rows etc.
                continue;
              }

              // Parse monthly data
              for (let i = 0; i < numMonths; i++) {
                const baseStok = firstMonthColIndex + (i * 4);
                
                // Group 1: STOK, KETERISIAN, HOP, KETERANGAN (4 cols per month)
                const stock = parseExcelNumber(row[baseStok]);
                const hop = parseExcelNumber(row[baseStok + 2]);

                const map = monthColMap[i];
                
                const terima = map.terima !== -1 ? parseExcelNumber(row[map.terima]) : null;
                const pemakaian = map.pemakaian !== -1 ? parseExcelNumber(row[map.pemakaian]) : null;
                const stockAkhir = map.stockAkhir !== -1 ? parseExcelNumber(row[map.stockAkhir]) : null;
                const shopAkhir = map.shopAkhir !== -1 ? parseExcelNumber(row[map.shopAkhir]) : null;
                const renoPesan = map.renoPesan !== -1 ? parseExcelNumber(row[map.renoPesan]) : null;
                const renoProyeksi = map.renoProyeksi !== -1 ? parseExcelNumber(row[map.renoProyeksi]) : null;
                const deltaTerima = map.deltaTerima !== -1 ? parseExcelNumber(row[map.deltaTerima]) : null;
                const pencapaian = map.pencapaian !== -1 ? parseExcelNumber(row[map.pencapaian]) : null;
                const rencanaPesan = map.rencanaPesan !== -1 ? parseExcelNumber(row[map.rencanaPesan]) : null;
                const rencanaHop = map.rencanaHop !== -1 ? parseExcelNumber(row[map.rencanaHop]) : null;
                const keterangan = map.keterangan !== -1 ? parseExcelString(row[map.keterangan]) : null;

                // Avoid creating a record if everything is completely empty for this month
                if (
                  stock === null && hop === null && terima === null &&
                  pemakaian === null && stockAkhir === null && shopAkhir === null &&
                  renoPesan === null && renoProyeksi === null && deltaTerima === null &&
                  pencapaian === null && rencanaPesan === null && rencanaHop === null &&
                  keterangan === null
                ) {
                  continue;
                }

                results.push({
                  template_kertas_kerja_id: template.id,
                  month_work: normalizeMonthWork(detectedMonths[i]),
                  stock,
                  hop,
                  terima,
                  pemakaian,
                  stock_akhir_bulan: stockAkhir,
                  shop_akhir_bulan: shopAkhir,
                  renominasi_pesan: renoPesan,
                  renominaso_proyeksi_akhir_bulan: renoProyeksi,
                  delta_terima: deltaTerima,
                  pencapaian,
                  rencana_pesan: rencanaPesan,
                  rencana_hop: rencanaHop,
                  keterangan,
                  // display
                  sheetName,
                  siteName,
                  productName,
                  supplierName,
                  modaName
                });
              }
            }
          }

          if (results.length === 0) {
            setError(
              errorMessages.length > 0 
              ? errorMessages.join(", ") 
              : "Tidak ada data yang valid ditemukan. Pastikan baris data memiliki format yang sesuai."
            );
            return;
          }

          setParsedRows(results);
          setStep("preview");
        } catch (err) {
          console.error("Parse error:", err);
          setError("Gagal memproses file Excel. Pastikan menggunakan file yang di-export dari sistem.");
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem saat membaca file");
      setIsParsing(false);
    }
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Map to API payload format
      const payload: RecordKertasKerja[] = parsedRows.map(row => ({
        template_kertas_kerja_id: row.template_kertas_kerja_id,
        month_work: row.month_work,
        stock: row.stock ?? undefined,
        hop: row.hop ?? undefined,
        terima: row.terima ?? undefined,
        pemakaian: row.pemakaian ?? undefined,
        stock_akhir_bulan: row.stock_akhir_bulan ?? undefined,
        shop_akhir_bulan: row.shop_akhir_bulan ?? undefined,
        renominasi_pesan: row.renominasi_pesan ?? undefined,
        renominaso_proyeksi_akhir_bulan: row.renominaso_proyeksi_akhir_bulan ?? undefined,
        delta_terima: row.delta_terima ?? undefined,
        pencapaian: row.pencapaian ?? undefined,
        rencana_pesan: row.rencana_pesan ?? undefined,
        rencana_hop: row.rencana_hop ?? undefined,
        keterangan: row.keterangan ?? undefined,
      }));

      await bulkSave.mutateAsync({ records: payload });
      setShowSuccess(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setOpenModal(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menyimpan data ke database");
    } finally {
      setIsSaving(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setSheetNames([]);
    setSelectedSheets([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetToUpload = () => {
    setStep("upload");
    setParsedRows([]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Bulk Upload Kertas Kerja
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload file Excel Kertas Kerja yang telah diisi untuk mengupdate data.
            </p>
          </div>
          <button
            onClick={() => setOpenModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 flex gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 items-start">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          {showSuccess && (
            <div className="mb-6 flex gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 items-center animate-pulse">
              <CheckCircle2 size={24} className="shrink-0 text-green-600" />
              <div className="font-semibold text-lg">
                Berhasil menyimpan data ke database!
              </div>
            </div>
          )}

          {step === "upload" ? (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                className={`
                  border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-200
                  ${file ? "border-primary/50 bg-primary/5" : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"}
                `}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {!file ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Upload size={32} />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      Tarik & Lepas file Excel di sini
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                      Mendukung format .xlsx atau .xls (Gunakan format export Kertas Kerja)
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".xlsx, .xls"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Pilih File
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center w-full max-w-md">
                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                      <FileSpreadsheet size={32} />
                    </div>
                    <div className="text-center mb-6 w-full">
                      <p className="font-semibold text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={removeFile}
                        className="px-4 py-2 flex items-center gap-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                      >
                        <Trash2 size={16} /> Ganti File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sheet Selection */}
              {sheetNames.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Database size={16} className="text-primary" />
                    Pilih Sheet (Unit) untuk di-upload
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2 pb-2">
                    {sheetNames.map((sheet) => (
                      <label
                        key={sheet}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                          ${selectedSheets.includes(sheet) ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"}
                        `}
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedSheets.includes(sheet)}
                            onChange={() => handleSheetToggle(sheet)}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        </div>
                        <span
                          className={`text-sm font-medium truncate ${selectedSheets.includes(sheet) ? "text-primary" : "text-gray-700"}`}
                        >
                          {sheet}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Preview Data Kertas Kerja
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Ditemukan <span className="font-semibold text-primary">{parsedRows.length}</span> record bulan yang siap untuk diupdate dari file Excel.
                  </p>
                </div>
                <button
                  onClick={resetToUpload}
                  className="px-4 py-2 flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <ArrowLeft size={16} /> Kembali
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="max-h-[400px] overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200 bg-gray-50">
                          Unit / Sheet
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200 bg-gray-50">
                          Pembangkit
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200 bg-gray-50">
                          Bulan
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200 bg-gray-50 text-right">
                          Stok (kL)
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200 bg-gray-50 text-right">
                          HOP
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200 bg-gray-50 text-right">
                          Terima (kL)
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200 bg-gray-50 text-right">
                          Pemakaian (kL)
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200 bg-gray-50 text-right">
                          Nominasi (kL)
                        </th>
                        <th className="px-4 py-3 font-semibold text-gray-600 border-b border-gray-200 bg-gray-50 text-right">
                          Renominasi (kL)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {parsedRows.slice(0, 100).map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            {row.sheetName}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">
                            {row.siteName}
                            <div className="text-xs text-gray-500">{row.supplierName} - {row.productName}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                              {row.month_work}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                            {row.stock !== null ? row.stock : "-"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                            {row.hop !== null ? row.hop : "-"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600">
                            {row.terima !== null ? row.terima : "-"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600">
                            {row.pemakaian !== null ? row.pemakaian : "-"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600">
                            {row.rencana_pesan !== null ? row.rencana_pesan : "-"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600">
                            {row.renominasi_pesan !== null ? row.renominasi_pesan : "-"}
                          </td>
                        </tr>
                      ))}
                      {parsedRows.length > 100 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-4 text-center text-gray-500 italic bg-gray-50/50"
                          >
                            Menampilkan 100 dari {parsedRows.length} baris data...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={() => setOpenModal(false)}
            disabled={isSaving || isParsing}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all shadow-sm disabled:opacity-50"
          >
            Batal
          </button>
          {step === "upload" ? (
            <button
              type="button"
              onClick={handleParseData}
              disabled={!file || selectedSheets.length === 0 || isParsing}
              className="flex items-center justify-center min-w-[140px] px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#0d4a5c] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isParsing ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                "Proses Data"
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="flex items-center justify-center min-w-[160px] px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Simpan ke Database
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Save,
  Check,
  AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import { useBulkUpsertKertasKerjaTemplates } from "@/hooks/service/kertas-kerja-api";

type Props = {
  plants: any[];
  suppliers: any[];
  products: any[];
  modas: any[];
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

interface ParsedTemplateRow {
  site_id: string | null;
  site_name: string;
  site_valid: boolean;

  supplier_id: string | null;
  supplier_name: string;
  supplier_valid: boolean;

  product_id: string | null;
  product_name: string;
  product_valid: boolean;

  moda_id: string | null;
  moda_name: string;
  moda_valid: boolean;

  distance: number | null;
  estimated_delivery_time: number | null;
  hop_minimum: number | null;
  average_usage: number | null;
  freight_costs: number | null;
  is_active: boolean;

  errors: string[];
  isValid: boolean;
}

export default function BulkUploadTemplateModal({
  plants,
  suppliers,
  products,
  modas,
  setOpenModal,
  onSuccess
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTemplateRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkSave = useBulkUpsertKertasKerjaTemplates();

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
    return isNaN(num) ? null : num;
  };

  const handleParseData = async () => {
    if (!file) {
      setError("Pilih file template untuk diunggah");
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

          // We assume the first sheet is the template sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) throw new Error("Sheet template tidak ditemukan");

          const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
            header: 1,
            defval: null,
          });

          if (jsonData.length < 2) {
            setError("Format file tidak sesuai (harus ada minimal baris header dan satu baris data).");
            return;
          }

          // Header mapping
          const headerRow = jsonData[0];
          const colMap: Record<string, number> = {};
          headerRow.forEach((cell: any, idx: number) => {
            if (cell) {
              const label = String(cell).toLowerCase().trim();
              if (label.includes("pembangkit")) colMap["site"] = idx;
              else if (label.includes("tbbm") || label.includes("supplier") || label.includes("pemasok")) colMap["supplier"] = idx;
              else if (label.includes("produk") || label.includes("product") || label.includes("bbm")) colMap["product"] = idx;
              else if (label.includes("moda")) colMap["moda"] = idx;
              else if (label.includes("jarak")) colMap["distance"] = idx;
              else if (label.includes("est. waktu") || label.includes("pengiriman") || label.includes("delivery")) colMap["delivery_time"] = idx;
              else if (label.includes("hop min")) colMap["hop_min"] = idx;
              else if (label.includes("pemakaian") || label.includes("rata")) colMap["average_usage"] = idx;
              else if (label.includes("ongkos") || label.includes("freight") || label.includes("biaya")) colMap["freight_costs"] = idx;
              else if (label.includes("status")) colMap["status"] = idx;
            }
          });

          // Verify required columns
          const required = ["site", "supplier", "product", "moda"];
          const missing = required.filter((key) => colMap[key] === undefined);
          if (missing.length > 0) {
            setError(`Kolom wajib tidak ditemukan: ${missing.map(m => m.toUpperCase()).join(", ")}`);
            return;
          }

          const rows: ParsedTemplateRow[] = [];
          for (let rIdx = 1; rIdx < jsonData.length; rIdx++) {
            const row = jsonData[rIdx];
            if (!row || row.length === 0) continue;

            // If all fields are null or empty, skip row
            if (row.every((cell) => cell === null || String(cell).trim() === "")) continue;

            const siteNameRaw = String(row[colMap["site"]] || "").trim();
            const supplierNameRaw = String(row[colMap["supplier"]] || "").trim();
            const productNameRaw = String(row[colMap["product"]] || "").trim();
            const modaNameRaw = String(row[colMap["moda"]] || "").trim();

            if (!siteNameRaw && !supplierNameRaw && !productNameRaw && !modaNameRaw) {
              continue; // Skip empty row
            }

            // Lookups (case-insensitive, trimmed)
            const matchedSite = plants.find(
              (p: any) => p.name.toLowerCase().trim() === siteNameRaw.toLowerCase()
            );
            const matchedSupplier = suppliers.find(
              (s: any) => s.name.toLowerCase().trim() === supplierNameRaw.toLowerCase()
            );
            const matchedProduct = products.find(
              (pr: any) => pr.name.toLowerCase().trim() === productNameRaw.toLowerCase()
            );
            const matchedModa = modas.find(
              (m: any) => m.name.toLowerCase().trim() === modaNameRaw.toLowerCase()
            );

            // Error tracking
            const errors: string[] = [];
            if (!matchedSite) errors.push(`Pembangkit "${siteNameRaw || 'Empty'}" tidak ditemukan di database.`);
            if (!matchedSupplier) errors.push(`TBBM "${supplierNameRaw || 'Empty'}" tidak ditemukan di database.`);
            if (!matchedProduct) errors.push(`Produk "${productNameRaw || 'Empty'}" tidak ditemukan di database.`);
            if (!matchedModa) errors.push(`Moda "${modaNameRaw || 'Empty'}" tidak ditemukan di database.`);

            const distanceVal = colMap["distance"] !== undefined ? parseExcelNumber(row[colMap["distance"]]) : null;
            const deliveryTimeVal = colMap["delivery_time"] !== undefined ? parseExcelNumber(row[colMap["delivery_time"]]) : null;
            const hopMinVal = colMap["hop_min"] !== undefined ? parseExcelNumber(row[colMap["hop_min"]]) : null;
            const averageUsageVal = colMap["average_usage"] !== undefined ? parseExcelNumber(row[colMap["average_usage"]]) : null;
            const freightCostsVal = colMap["freight_costs"] !== undefined ? parseExcelNumber(row[colMap["freight_costs"]]) : null;

            const statusStr = colMap["status"] !== undefined ? String(row[colMap["status"]] || "").toLowerCase().trim() : "aktif";
            const isActive = statusStr === "aktif" || statusStr === "active" || statusStr === "true" || statusStr === "yes" || statusStr === "1";

            rows.push({
              site_id: matchedSite?.id || null,
              site_name: siteNameRaw,
              site_valid: !!matchedSite,

              supplier_id: matchedSupplier?.id || null,
              supplier_name: supplierNameRaw,
              supplier_valid: !!matchedSupplier,

              product_id: matchedProduct?.id || null,
              product_name: productNameRaw,
              product_valid: !!matchedProduct,

              moda_id: matchedModa?.id || null,
              moda_name: modaNameRaw,
              moda_valid: !!matchedModa,

              distance: distanceVal,
              estimated_delivery_time: deliveryTimeVal,
              hop_minimum: hopMinVal,
              average_usage: averageUsageVal,
              freight_costs: freightCostsVal,
              is_active: isActive,
              errors,
              isValid: errors.length === 0,
            });
          }

          if (rows.length === 0) {
            setError("Tidak ada data template yang valid ditemukan. Cek isi file Anda.");
            return;
          }

          setParsedRows(rows);
          setStep("preview");
        } catch (err: any) {
          console.error(err);
          setError("Gagal memproses file Excel: " + err.message);
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error(err);
      setError("Gagal membaca file: " + err.message);
      setIsParsing(false);
    }
  };

  const handleSaveToDatabase = async () => {
    // Only save rows that are valid
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setError("Tidak ada data yang valid untuk disimpan ke database.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = validRows.map((r) => ({
        site_id: r.site_id,
        supplier_id: r.supplier_id,
        product_id: r.product_id,
        moda_id: r.moda_id,
        distance: r.distance,
        estimated_delivery_time: r.estimated_delivery_time,
        hop_minimum: r.hop_minimum,
        average_usage: r.average_usage,
        freight_costs: r.freight_costs,
        is_active: r.is_active,
      }));

      await bulkSave.mutateAsync({ templates: payload });
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

  const totalValid = parsedRows.filter((r) => r.isValid).length;
  const totalInvalid = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Bulk Upload Template Kertas Kerja
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Unggah template konfigurasi Kertas Kerja. Hanya data dengan parameter valid yang akan disimpan.
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
            <div className="mb-6 flex gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 items-center">
              <CheckCircle2 size={24} className="shrink-0 text-green-600 animate-bounce" />
              <div className="font-semibold text-lg">
                Berhasil menyimpan data template ke database!
              </div>
            </div>
          )}

          {step === "upload" ? (
            <div className="space-y-6">
              {/* Drag and Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                  file
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <div className="p-4 bg-gray-100 text-gray-600 rounded-full mb-4">
                  <Upload size={32} />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-700">
                      Tarik & Letakkan file Excel Anda di sini
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      atau klik untuk menjelajahi file (.xlsx, .xls)
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <div className="flex justify-end gap-3">
                  <button
                    onClick={removeFile}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hapus File
                  </button>
                  <button
                    onClick={handleParseData}
                    disabled={isParsing}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:brightness-90 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      "Lanjutkan ke Preview"
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Badges and Note */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle size={16} className="text-blue-500" />
                    Informasi Validasi Data
                  </h3>
                  <p className="text-xs text-gray-600">
                    Baris dengan parameter yang tidak terdaftar di database (bertanda merah <span className="inline-block w-2.5 h-2.5 bg-red-100 border border-red-300 rounded-full"></span>) <strong>tidak akan disimpan</strong>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="inline-flex items-center px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">
                    {totalValid} Baris Siap Disimpan
                  </span>
                  {totalInvalid > 0 && (
                    <span className="inline-flex items-center px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-full">
                      {totalInvalid} Baris Tidak Valid (Dilewati)
                    </span>
                  )}
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-700 w-12 text-center">No</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Pembangkit</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">TBBM</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Produk</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Moda</th>
                        <th className="px-3 py-3 font-semibold text-gray-700 text-center">Jarak (km)</th>
                        <th className="px-3 py-3 font-semibold text-gray-700 text-center">Est. Kirim</th>
                        <th className="px-3 py-3 font-semibold text-gray-700 text-center">Min HOP</th>
                        <th className="px-3 py-3 font-semibold text-gray-700 text-center">Pemakaian</th>
                        <th className="px-3 py-3 font-semibold text-gray-700 text-right">Ongkos</th>
                        <th className="px-4 py-3 font-semibold text-gray-700 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((row, index) => (
                        <tr
                          key={index}
                          className={`hover:bg-gray-50/50 transition-colors ${
                            !row.isValid ? "bg-red-50/30" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-center font-medium text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {row.site_valid ? (
                                <Check size={14} className="text-green-500 shrink-0" />
                              ) : (
                                <span title="Pembangkit tidak terdaftar" className="shrink-0 flex items-center">
                                  <AlertCircle size={14} className="text-red-500" />
                                </span>
                              )}
                              <span className={row.site_valid ? "text-gray-900" : "text-red-700 font-medium"}>
                                {row.site_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {row.supplier_valid ? (
                                <Check size={14} className="text-green-500 shrink-0" />
                              ) : (
                                <span title="TBBM tidak terdaftar" className="shrink-0 flex items-center">
                                  <AlertCircle size={14} className="text-red-500" />
                                </span>
                              )}
                              <span className={row.supplier_valid ? "text-gray-900" : "text-red-700 font-medium"}>
                                {row.supplier_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {row.product_valid ? (
                                <Check size={14} className="text-green-500 shrink-0" />
                              ) : (
                                <span title="Produk tidak terdaftar" className="shrink-0 flex items-center">
                                  <AlertCircle size={14} className="text-red-500" />
                                </span>
                              )}
                              <span className={row.product_valid ? "text-gray-900" : "text-red-700 font-medium"}>
                                {row.product_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {row.moda_valid ? (
                                <Check size={14} className="text-green-500 shrink-0" />
                              ) : (
                                <span title="Moda tidak terdaftar" className="shrink-0 flex items-center">
                                  <AlertCircle size={14} className="text-red-500" />
                                </span>
                              )}
                              <span className={row.moda_valid ? "text-gray-900" : "text-red-700 font-medium"}>
                                {row.moda_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600">
                            {row.distance ?? "-"}
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600">
                            {row.estimated_delivery_time ?? "-"}
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600">
                            {row.hop_minimum ?? "-"}
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600">
                            {row.average_usage ?? "-"}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-600 font-medium">
                            {row.freight_costs !== null
                              ? new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  maximumFractionDigits: 0
                                }).format(row.freight_costs)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                row.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {row.is_active ? "Aktif" : "Tidak Aktif"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <button
                  onClick={resetToUpload}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Kembali
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOpenModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveToDatabase}
                    disabled={isSaving || totalValid === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:brightness-90 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Simpan ke Database ({totalValid})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

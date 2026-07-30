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
  AlertCircle,
  Plus
} from "lucide-react";
import * as XLSX from "xlsx";
import { useSites, useBulkUpdateSites } from "@/hooks/service/site-api";
import { useKertasKerjaMaster } from "@/hooks/service/kertas-kerja-api";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

interface ParsedSiteRow {
  id: string | null; // Null means new site
  name: string;
  site_type: "PEMBANGKIT" | "PEMASOK" | "TRANSPORTIR" | null;
  region: string;
  capacity: number | null;
  capacity_mw: number | null;
  is_enabled: boolean;
  kit_id: string | null;
  upk_id: string | null;
  unit_id: string | null;

  // Validation & UI
  typeText: string;
  statusText: string;
  kitText: string;
  upkText: string;
  unitText: string;
  isNew: boolean;
  hasChanged: boolean;
  errors: string[];
  isValid: boolean;
  originalSite?: any;
}

export default function BulkUploadSiteModal({ setOpenModal, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedSiteRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch all sites with commodity BBM for client-side diffing and lookup
  const { data: dbSites = [] } = useSites({ commodity: ["BBM"] });
  const bulkSaveMutation = useBulkUpdateSites();

  // Fetch reference lists for resolution
  const { data: jenisKits = [] } = useKertasKerjaMaster("master_jenis_kit");
  const { data: upks = [] } = useKertasKerjaMaster("master_unit_pelaksana");
  const { data: units = [] } = useKertasKerjaMaster("master_unit");

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

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) throw new Error("Sheet data tidak ditemukan");

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
              if (label === "id") colMap["id"] = idx;
              else if (label.includes("nama site") || label.includes("pemasok") || label.includes("pembangkit")) colMap["name"] = idx;
              else if (label.includes("tipe site") || label.includes("jenis site") || label.includes("tipe") || label === "jenis") colMap["site_type"] = idx;
              else if (label.includes("region") || label.includes("lokasi")) colMap["region"] = idx;
              else if (label.includes("jenis kit") || label.includes("kit")) colMap["kit"] = idx;
              else if (label.includes("unit pelaksana") || label.includes("pelaksana") || label.includes("upk")) colMap["upk"] = idx;
              else if (label.includes("unit")) colMap["unit"] = idx;
              else if (label.includes("kapasitas (kl)") || label.includes("kapasitas kl")) colMap["capacity"] = idx;
              else if (label.includes("kapasitas (mw)") || label.includes("kapasitas mw")) colMap["capacity_mw"] = idx;
              else if (label.includes("status")) colMap["status"] = idx;
            }
          });

          // Verify columns
          const required = ["name", "site_type", "region"];
          const missing = required.filter((key) => colMap[key] === undefined);
          if (missing.length > 0) {
            setError(`Kolom wajib tidak ditemukan: ${missing.map(m => m.toUpperCase()).join(", ")}`);
            return;
          }

          const rows: ParsedSiteRow[] = [];
          for (let rIdx = 1; rIdx < jsonData.length; rIdx++) {
            const row = jsonData[rIdx];
            if (!row || row.length === 0) continue;

            if (row.every((cell) => cell === null || String(cell).trim() === "")) continue;

            const idRaw = colMap["id"] !== undefined ? String(row[colMap["id"]] || "").trim() : "";
            const nameRaw = String(row[colMap["name"]] || "").trim();
            const typeRaw = String(row[colMap["site_type"]] || "").trim();
            const regionRaw = String(row[colMap["region"]] || "").trim();
            const kitRaw = colMap["kit"] !== undefined ? String(row[colMap["kit"]] || "").trim() : "";
            const upkRaw = colMap["upk"] !== undefined ? String(row[colMap["upk"]] || "").trim() : "";
            const unitRaw = colMap["unit"] !== undefined ? String(row[colMap["unit"]] || "").trim() : "";
            const capacityRaw = colMap["capacity"] !== undefined ? parseExcelNumber(row[colMap["capacity"]]) : null;
            const capacityMwRaw = colMap["capacity_mw"] !== undefined ? parseExcelNumber(row[colMap["capacity_mw"]]) : null;
            const statusRaw = colMap["status"] !== undefined ? String(row[colMap["status"]] || "").toLowerCase().trim() : "aktif";

            if (!nameRaw && !typeRaw && !regionRaw) continue;

            // Map and validate site type
            let mappedType: ParsedSiteRow["site_type"] = null;
            const lowerType = typeRaw.toLowerCase();
            if (lowerType.includes("pembangkit") || lowerType === "pembangkit") mappedType = "PEMBANGKIT";
            else if (lowerType.includes("pemasok") || lowerType.includes("supplier") || lowerType === "pemasok") mappedType = "PEMASOK";
            else if (lowerType.includes("transportir") || lowerType === "transportir") mappedType = "TRANSPORTIR";

            // Map status
            const isEnabled = statusRaw === "aktif" || statusRaw === "active" || statusRaw === "true" || statusRaw === "yes" || statusRaw === "1";

            const errors: string[] = [];
            if (!nameRaw) errors.push("Nama site tidak boleh kosong.");
            if (!mappedType) errors.push(`Tipe site "${typeRaw || 'Empty'}" tidak valid (harus Pembangkit, Pemasok, atau Transportir).`);
            if (!regionRaw) errors.push("Region tidak boleh kosong.");

            // Resolve references
            let kitId: string | null = null;
            if (kitRaw) {
              const matched = jenisKits.find((k: any) => k.name.toLowerCase().trim() === kitRaw.toLowerCase());
              if (matched) kitId = matched.id;
              else errors.push(`Jenis Kit "${kitRaw}" tidak ditemukan.`);
            }

            let upkId: string | null = null;
            if (upkRaw) {
              const matched = upks.find((u: any) => u.name.toLowerCase().trim() === upkRaw.toLowerCase());
              if (matched) upkId = matched.id;
              else errors.push(`Unit Pelaksana "${upkRaw}" tidak ditemukan.`);
            }

            let unitId: string | null = null;
            if (unitRaw) {
              const matched = units.find((u: any) => u.name.toLowerCase().trim() === unitRaw.toLowerCase());
              if (matched) unitId = matched.id;
              else errors.push(`Unit "${unitRaw}" tidak ditemukan.`);
            }

            // Diffing
            let isNew = true;
            let hasChanged = false;
            let originalSite: any = undefined;

            if (idRaw) {
              isNew = false;
              originalSite = dbSites.find((s) => s.id === idRaw);
              if (!originalSite) {
                errors.push(`ID "${idRaw}" tidak ditemukan di database.`);
              } else {
                // Check if values changed
                const nameDiff = originalSite.name !== nameRaw;
                const typeDiff = originalSite.site_type !== mappedType;
                const regionDiff = originalSite.region !== regionRaw;
                
                const origCap = originalSite.capacity !== null ? Number(originalSite.capacity) : null;
                const capacityDiff = origCap !== capacityRaw;

                const origCapMw = originalSite.capacity_mw !== null ? Number(originalSite.capacity_mw) : null;
                const capacityMwDiff = origCapMw !== capacityMwRaw;

                const statusDiff = originalSite.is_enabled !== isEnabled;

                const kitDiff = (originalSite.kit_id || "") !== (kitId || "");
                const upkDiff = (originalSite.upk_id || "") !== (upkId || "");
                const unitDiff = (originalSite.unit_id || "") !== (unitId || "");

                hasChanged = nameDiff || typeDiff || regionDiff || capacityDiff || capacityMwDiff || statusDiff || kitDiff || upkDiff || unitDiff;
              }
            }

            rows.push({
              id: idRaw || null,
              name: nameRaw,
              site_type: mappedType,
              region: regionRaw,
              capacity: capacityRaw,
              capacity_mw: capacityMwRaw,
              is_enabled: isEnabled,
              kit_id: kitId,
              upk_id: upkId,
              unit_id: unitId,

              typeText: typeRaw,
              statusText: statusRaw,
              kitText: kitRaw,
              upkText: upkRaw,
              unitText: unitRaw,
              isNew,
              hasChanged,
              errors,
              isValid: errors.length === 0,
              originalSite
            });
          }

          if (rows.length === 0) {
            setError("Tidak ada data site yang valid ditemukan. Cek isi file Anda.");
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
    // We only update rows that are valid and have actually changed (or are new)
    const validRows = parsedRows.filter((r) => r.isValid && (r.isNew || r.hasChanged));
    if (validRows.length === 0) {
      setError("Tidak ada perubahan atau data baru yang valid untuk disimpan.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = validRows.map((r) => ({
        id: r.id,
        name: r.name,
        site_type: r.site_type,
        region: r.region,
        capacity: r.capacity,
        capacity_mw: r.capacity_mw,
        is_enabled: r.is_enabled,
        kit_id: r.kit_id,
        upk_id: r.upk_id,
        unit_id: r.unit_id,
        commodity: "BBM"
      }));

      await bulkSaveMutation.mutateAsync({ sites: payload });
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

  const totalValidToSave = parsedRows.filter((r) => r.isValid && (r.isNew || r.hasChanged)).length;
  const totalNoChanges = parsedRows.filter((r) => r.isValid && !r.isNew && !r.hasChanged).length;
  const totalInvalid = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Bulk Update TBBM & Pembangkit (Site)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Edit nilai kapasitas, status, region, jenis kit, unit pelaksana, atau nama langsung pada Excel dan upload kembali.
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
                Berhasil memperbarui data site di database!
              </div>
            </div>
          )}

          {step === "upload" ? (
            <div className="space-y-6">
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
                      Tarik & Letakkan file Excel pre-populated Anda di sini
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
              {/* Validation Summary Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle size={16} className="text-blue-500" />
                    Preview Perubahan Site
                  </h3>
                  <p className="text-xs text-gray-600">
                    Nilai yang berubah atau baris baru akan disimpan. Baris yang memiliki error tidak akan disimpan.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full">
                    {totalValidToSave} Perubahan / Baru
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                    {totalNoChanges} Tidak Berubah
                  </span>
                  {totalInvalid > 0 && (
                    <span className="inline-flex items-center px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-full">
                      {totalInvalid} Error (Dilewati)
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
                        <th className="px-4 py-3 font-semibold text-gray-700">Tipe Aksi</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Nama Site</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Tipe Site</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Region</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Jenis Kit</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Unit Pelaksana</th>
                        <th className="px-4 py-3 font-semibold text-gray-700">Unit</th>
                        <th className="px-4 py-3 font-semibold text-gray-700 text-center">Kapasitas (kL)</th>
                        <th className="px-4 py-3 font-semibold text-gray-700 text-center">Kapasitas (MW)</th>
                        <th className="px-4 py-3 font-semibold text-gray-700 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((row, index) => {
                        const orig = row.originalSite;
                        const origCap = orig?.capacity !== null && orig?.capacity !== undefined ? Number(orig.capacity) : null;
                        const origCapMw = orig?.capacity_mw !== null && orig?.capacity_mw !== undefined ? Number(orig.capacity_mw) : null;

                        const nameChanged = orig && orig.name !== row.name;
                        const typeChanged = orig && orig.site_type !== row.site_type;
                        const regionChanged = orig && orig.region !== row.region;
                        const capacityChanged = orig && origCap !== row.capacity;
                        const capacityMwChanged = orig && origCapMw !== row.capacity_mw;
                        const statusChanged = orig && orig.is_enabled !== row.is_enabled;

                        const origKitName = orig ? (jenisKits.find((k: any) => k.id === orig.kit_id)?.name || "") : "";
                        const kitChanged = orig && origKitName !== row.kitText;

                        const origUpkName = orig ? (upks.find((u: any) => u.id === orig.upk_id)?.name || "") : "";
                        const upkChanged = orig && origUpkName !== row.upkText;

                        const origUnitName = orig ? (units.find((u: any) => u.id === orig.unit_id)?.name || "") : "";
                        const unitChanged = orig && origUnitName !== row.unitText;

                        return (
                          <tr
                            key={index}
                            className={`hover:bg-gray-50/50 transition-colors ${
                              !row.isValid
                                ? "bg-red-50/30"
                                : row.isNew
                                ? "bg-green-50/20"
                                : row.hasChanged
                                ? "bg-amber-50/20"
                                : ""
                            }`}
                          >
                            <td className="px-4 py-3 text-center font-medium text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3">
                              {!row.isValid ? (
                                <span title={row.errors.join(", ")} className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-150 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  <AlertCircle size={10} />
                                  Error
                                </span>
                              ) : row.isNew ? (
                                <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-150 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  <Plus size={10} />
                                  Baru
                                </span>
                              ) : row.hasChanged ? (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  Update
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-full text-[10px]">
                                  Sama
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={nameChanged ? "text-amber-800 font-bold bg-amber-100/50 px-1 rounded" : "text-gray-900"}>
                                {row.name}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={typeChanged ? "text-amber-800 font-bold bg-amber-100/50 px-1 rounded" : "text-gray-700"}>
                                {row.site_type === "PEMBANGKIT" ? "Pembangkit" : row.site_type === "PEMASOK" ? "Pemasok" : row.site_type === "TRANSPORTIR" ? "Transportir" : row.typeText}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={regionChanged ? "text-amber-800 font-bold bg-amber-100/50 px-1 rounded" : "text-gray-700"}>
                                {row.region}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={kitChanged ? "text-amber-800 font-bold bg-amber-100/50 px-1 rounded" : "text-gray-700"}>
                                {row.kitText || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={upkChanged ? "text-amber-800 font-bold bg-amber-100/50 px-1 rounded" : "text-gray-700"}>
                                {row.upkText || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={unitChanged ? "text-amber-800 font-bold bg-amber-100/50 px-1 rounded" : "text-gray-700"}>
                                {row.unitText || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={capacityChanged ? "text-amber-800 font-bold bg-amber-100/50 px-1 rounded" : "text-gray-700"}>
                                {row.capacity !== null ? `${row.capacity} kL` : "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={capacityMwChanged ? "text-amber-800 font-bold bg-amber-100/50 px-1 rounded" : "text-gray-700"}>
                                {row.capacity_mw !== null ? `${row.capacity_mw} MW` : "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  statusChanged ? "bg-amber-100 border border-amber-300 text-amber-850" :
                                  row.is_enabled
                                    ? "bg-green-55 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {row.is_enabled ? "Aktif" : "Tidak Aktif"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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
                    disabled={isSaving || totalValidToSave === 0}
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
                        Simpan ke Database ({totalValidToSave})
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

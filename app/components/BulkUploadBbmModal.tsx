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
} from "lucide-react";
import * as XLSX from "xlsx";
import { useCreateBbmMonthlyBulk } from "@/hooks/service/bbm-api";
import { useSites } from "@/hooks/service/site-api";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

interface ParsedBbmRow {
  id: string;
  sheetName: string;
  monthDate: string; // e.g. "2026-04"
  excelPembangkit: string;
  excelTbbm: string;
  siteId: string;
  supplierId: string;
  product: string;
  moda: string;
  nomination: number | null;
  usage: number | null;
}

export default function BulkUploadBbmModal({ setOpenModal, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedBbmRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkSave = useCreateBbmMonthlyBulk();

  // Load BBM Sites and Suppliers
  const { data: tbbmData } = useSites({ type: "PEMASOK", commodity: "BBM" });
  const { data: pembangkitData } = useSites({
    type: "PEMBANGKIT",
    commodity: "BBM",
  });

  const tbbmList = tbbmData ?? [];
  const pembangkitList = pembangkitData ?? [];

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
          /^\d+/.test(name),
        );
        setSelectedSheets(
          defaultSheets.length > 0 ? defaultSheets : [workbook.SheetNames[0]],
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

  const handleSheetToggle = (sheet: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sheet) ? prev.filter((s) => s !== sheet) : [...prev, sheet],
    );
  };

  // Heuristic plant site pre-matching
  // Heuristic plant site pre-matching
  const preMatchPembangkit = (excelName: string): string => {
    if (!excelName) return "";
    const cleanExcel = excelName
      .toLowerCase()
      .replace(/^(pltd|pltg|pltu|pltgu|sewa)\s+/i, "")
      .trim()
      .replace(/[^a-z0-9]/g, "");

    // 1. Try strict cleaned match
    let match = pembangkitList.find((s) => {
      const cleanSite = s.name
        .toLowerCase()
        .replace(/^(pltd|pltg|pltu|pltgu|sewa)\s+/i, "")
        .trim()
        .replace(/[^a-z0-9]/g, "");
      return cleanSite === cleanExcel;
    });

    if (match) return match.id;

    // 2. Try substring match on cleaned names
    match = pembangkitList.find((s) => {
      const cleanSite = s.name
        .toLowerCase()
        .replace(/^(pltd|pltg|pltu|pltgu|sewa)\s+/i, "")
        .trim()
        .replace(/[^a-z0-9]/g, "");
      return cleanSite.includes(cleanExcel) || cleanExcel.includes(cleanSite);
    });

    if (match) return match.id;

    // 3. Fallback to clean substring match on raw name
    const lowerExcel = excelName.toLowerCase().trim();
    match = pembangkitList.find((s) => {
      const lowerSite = s.name.toLowerCase().trim();
      return lowerSite.includes(lowerExcel) || lowerExcel.includes(lowerSite);
    });

    return match ? match.id : "";
  };

  // Heuristic TBBM supplier pre-matching
  const preMatchTbbm = (excelName: string): string => {
    if (!excelName) return "";
    const cleanExcel = excelName
      .toLowerCase()
      .replace(/^(tbbm|jobber)\s+/i, "")
      .trim()
      .replace(/[^a-z0-9]/g, "");

    // 1. Try strict cleaned match
    let match = tbbmList.find((s) => {
      const cleanSite = s.name
        .toLowerCase()
        .replace(/^(tbbm|jobber)\s+/i, "")
        .trim()
        .replace(/[^a-z0-9]/g, "");
      return cleanSite === cleanExcel;
    });

    if (match) return match.id;

    // 2. Try substring match on cleaned names
    match = tbbmList.find((s) => {
      const cleanSite = s.name
        .toLowerCase()
        .replace(/^(tbbm|jobber)\s+/i, "")
        .trim()
        .replace(/[^a-z0-9]/g, "");
      return cleanSite.includes(cleanExcel) || cleanExcel.includes(cleanSite);
    });

    if (match) return match.id;

    // 3. Fallback to clean substring match on raw name
    const lowerExcel = excelName.toLowerCase().trim();
    match = tbbmList.find((s) => {
      const lowerSite = s.name.toLowerCase().trim();
      return lowerSite.includes(lowerExcel) || lowerExcel.includes(lowerSite);
    });

    return match ? match.id : "";
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

  // Dynamic month label parser
  const parseMonthLabel = (monthLabelStr: string): string | null => {
    if (!monthLabelStr) return null;
    const clean = monthLabelStr.trim().toUpperCase();
    if (
      clean.includes("STOK") ||
      clean.includes("KETERANGAN") ||
      clean.includes("DETAIL") ||
      clean.length > 10
    ) {
      return null;
    }

    const idMonths = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MEI",
      "JUN",
      "JUL",
      "AGU",
      "SEP",
      "OKT",
      "NOP",
      "DES",
    ];
    const enMonths = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];

    let monthIndex = -1;
    for (let i = 0; i < 12; i++) {
      const pattern = new RegExp(
        `(^|\\s|['\\-\\/])(${idMonths[i]}|${enMonths[i]})($|\\s|['\\-\\/])`,
        "i",
      );
      if (pattern.test(clean)) {
        monthIndex = i;
        break;
      }
    }

    if (monthIndex === -1) return null;

    const yearMatch = clean.match(/(20\d{2}|\d{2})/);
    if (!yearMatch) return null;

    let year = yearMatch[0];
    if (year.length === 2) {
      year = "20" + year;
    }

    const monthPad = String(monthIndex + 1).padStart(2, "0");
    return `${year}-${monthPad}`;
  };

  const handleParse = async () => {
    if (!file || selectedSheets.length === 0) {
      setError("Silakan pilih file dan minimal satu sheet untuk diproses.");
      return;
    }

    try {
      setIsParsing(true);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            setIsParsing(false);
            return;
          }

          const workbook = XLSX.read(data, { type: "array" });
          const allRows: ParsedBbmRow[] = [];

          selectedSheets.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) return;

            const rawData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
              header: 1,
              defval: null,
            });

            // Detect month row index dynamically
            let monthRowIndex = 5;
            for (let r = 3; r <= 8; r++) {
              if (!rawData[r]) continue;
              let monthCellCount = 0;
              for (let c = 0; c < rawData[r].length; c++) {
                const cellVal = rawData[r][c];
                if (cellVal && parseMonthLabel(String(cellVal))) {
                  monthCellCount++;
                }
              }
              if (monthCellCount >= 3) {
                monthRowIndex = r;
                break;
              }
            }

            const monthRow = rawData[monthRowIndex];
            if (!monthRow) return;

            // Detect "JENIS BBM" and "MODA ANGKUTAN" columns dynamically
            let jenisBbmColIdx = 5; // default Column F
            let modaColIdx = 6; // default Column G

            for (let r = 0; r <= monthRowIndex; r++) {
              if (!rawData[r]) continue;
              for (let c = 0; c < rawData[r].length; c++) {
                const cellVal = rawData[r][c];
                if (cellVal) {
                  const normVal = String(cellVal)
                    .toUpperCase()
                    .replace(/\s+/g, "");
                  if (normVal.includes("JENISBBM")) {
                    jenisBbmColIdx = c;
                  } else if (
                    normVal.includes("MODAANGKUTAN") ||
                    normVal.includes("MODAANGKUT")
                  ) {
                    modaColIdx = c;
                  }
                }
              }
            }

            const norm = (s: unknown) =>
              String(s || "")
                .toUpperCase()
                .replace(/\s+/g, " ")
                .trim();
            const columnsByMonth: Record<
              string,
              { nominationCol: number; usageCol: number }
            > = {};

            // Map the columns by month dynamically
            for (let colIdx = 0; colIdx < monthRow.length; colIdx++) {
              const cellVal = monthRow[colIdx];
              if (!cellVal) continue;

              const monthDate = parseMonthLabel(String(cellVal));
              if (!monthDate) continue;

              let parentHeader = "";
              if (rawData[monthRowIndex - 2]) {
                for (let j = colIdx; j >= 0; j--) {
                  if (rawData[monthRowIndex - 2][j]) {
                    parentHeader = norm(rawData[monthRowIndex - 2][j]);
                    break;
                  }
                }
              }

              let subheader = "";
              if (rawData[monthRowIndex - 1]) {
                for (let j = colIdx; j >= 0; j--) {
                  if (rawData[monthRowIndex - 1][j]) {
                    subheader = norm(rawData[monthRowIndex - 1][j]);
                    break;
                  }
                }
              }

              if (!columnsByMonth[monthDate]) {
                columnsByMonth[monthDate] = { nominationCol: -1, usageCol: -1 };
              }

              if (
                (parentHeader.includes("RENCANA") ||
                  parentHeader.includes("PROGNOSA")) &&
                subheader.includes("PESAN")
              ) {
                columnsByMonth[monthDate].nominationCol = colIdx;
              } else if (
                parentHeader.includes("REALISASI") &&
                subheader.includes("PEMAKAIAN")
              ) {
                columnsByMonth[monthDate].usageCol = colIdx;
              }
            }

            // Scan all data rows
            for (let r = monthRowIndex + 1; r < rawData.length; r++) {
              const row = rawData[r];
              if (!row) continue;

              const pembangkit = row[3]; // Column D
              const tbbm = row[11]; // Column L

              if (!pembangkit || !tbbm) continue;

              const pembangkitStr = String(pembangkit).trim();
              const tbbmStr = String(tbbm).trim();

              if (
                pembangkitStr.toUpperCase().includes("TOTAL") ||
                tbbmStr.toUpperCase().includes("TOTAL") ||
                pembangkitStr.toUpperCase().includes("JUMLAH") ||
                tbbmStr.toUpperCase().includes("JUMLAH") ||
                pembangkitStr.toUpperCase().includes("(TIDAK OPERASI)")
              ) {
                continue;
              }

              // Extract metrics for all active months with data
              Object.entries(columnsByMonth).forEach(([monthDate, cols]) => {
                const nominationVal =
                  cols.nominationCol !== -1
                    ? parseExcelNumber(row[cols.nominationCol])
                    : null;
                const usageVal =
                  cols.usageCol !== -1
                    ? parseExcelNumber(row[cols.usageCol])
                    : null;

                if (nominationVal === null && usageVal === null) {
                  return;
                }

                // Resolve product and moda dynamically from the sheet
                const rawJenisBbm = row[jenisBbmColIdx]
                  ? String(row[jenisBbmColIdx]).trim().toUpperCase()
                  : "";
                let parsedProduct = "HSD"; // default fallback
                if (rawJenisBbm.includes("B40")) {
                  parsedProduct = "B40";
                } else if (rawJenisBbm.includes("B35")) {
                  parsedProduct = "B35";
                } else if (rawJenisBbm.includes("MFO")) {
                  parsedProduct = "MFO";
                } else if (rawJenisBbm.includes("HSD")) {
                  parsedProduct = "HSD";
                } else if (rawJenisBbm !== "") {
                  const matchedOption = ["HSD", "B35", "B40", "MFO"].find(
                    (opt) => rawJenisBbm.includes(opt),
                  );
                  if (matchedOption) {
                    parsedProduct = matchedOption;
                  }
                }

                const rawModa = row[modaColIdx]
                  ? String(row[modaColIdx]).trim()
                  : "Trucking";

                allRows.push({
                  id: `${sheetName}-${r}-${monthDate}-${pembangkitStr}`,
                  sheetName,
                  monthDate,
                  excelPembangkit: pembangkitStr,
                  excelTbbm: tbbmStr,
                  siteId: preMatchPembangkit(pembangkitStr),
                  supplierId: preMatchTbbm(tbbmStr),
                  product: parsedProduct,
                  moda: rawModa,
                  nomination: nominationVal,
                  usage: usageVal,
                });
              });
            }
          });

          if (allRows.length === 0) {
            setError(
              "Tidak ada baris data valid yang berhasil di-parse. Pastikan sheet yang Anda pilih sesuai.",
            );
            setIsParsing(false);
            return;
          }

          setParsedRows(allRows);
          setStep("preview");
        } catch (innerErr) {
          console.error(innerErr);
          setError("Gagal memproses sheet Excel.");
        } finally {
          setIsParsing(false);
        }
      };

      reader.onerror = () => {
        setError("Gagal membaca file.");
        setIsParsing(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat mem-parse file Excel.");
      setIsParsing(false);
    }
  };

  const handleRowFieldChange = (
    id: string,
    field: keyof ParsedBbmRow,
    value: unknown,
  ) => {
    setParsedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleRowDelete = (id: string) => {
    setParsedRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSaveToDatabase = async () => {
    const invalidRows = parsedRows.filter(
      (row) => !row.siteId || !row.supplierId,
    );
    if (invalidRows.length > 0) {
      setError(
        `Terdapat ${invalidRows.length} baris yang belum dipetakan ke Site/Supplier sistem. Silakan lengkapi atau hapus baris tersebut.`,
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = parsedRows.map((row) => ({
        monthDate: row.monthDate,
        siteId: row.siteId,
        supplierId: row.supplierId,
        product: row.product,
        moda: row.moda,
        unit: "KILOLITER",
        nomination: row.nomination ?? undefined,
        usage: row.usage ?? undefined,
      }));

      await bulkSave.mutateAsync(payload);

      setShowSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        setOpenModal(false);
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      setError(
        (err as { message?: string }).message ||
          "Gagal mengunggah data bulk ke database.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatMonthDate = (ym: string) => {
    if (!ym) return "";
    const [year, month] = ym.split("-");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${monthNames[mIdx] || month} ${year}`;
  };

  const matchedCount = parsedRows.filter(
    (r) => r.siteId && r.supplierId,
  ).length;
  const unmatchedCount = parsedRows.length - matchedCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        onClick={() => !isSaving && setOpenModal(false)}
      />
      <div className="relative bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-6 z-10 max-h-[90vh] flex flex-col animate-fade-in border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Input Nominasi & Pemakaian BBM
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Unggah kertas kerja rakor BBM, petakan secara instan, dan simpan
                dalam hitungan detik.
              </p>
            </div>
          </div>
          <button
            disabled={isSaving}
            onClick={() => setOpenModal(false)}
            className="cursor-pointer text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors p-1.5 hover:bg-gray-50 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerts */}
        {showSuccess && (
          <div className="mt-4 flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
            <CheckCircle2 size={18} className="shrink-0" />
            Upload bulk berhasil! Data sedang disimpan ke database.
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
            <AlertTriangle size={18} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {step === "upload" ? (
            <div className="space-y-6 max-w-2xl mx-auto py-6">
              {/* Info Panel */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/60 flex items-center justify-between">
                <div className="text-xs text-gray-600 space-y-1 leading-relaxed">
                  <p className="font-semibold text-gray-800 text-sm">
                    Petunjuk Ingestion Otomatis:
                  </p>
                  <p>
                    • Sistem akan mem-parse semua bulan dengan data tidak kosong
                    secara otomatis.
                  </p>
                  <p>
                    • <strong>PESAN (kL)</strong> →{" "}
                    <span className="font-semibold text-emerald-700">
                      VOLUME_NOMINATION
                    </span>
                  </p>
                  <p>
                    • <strong>PEMAKAIAN (kL)</strong> →{" "}
                    <span className="font-semibold text-sky-700">
                      VOLUME_USAGE
                    </span>
                  </p>
                </div>
                <div className="text-xs text-right text-gray-500 font-medium">
                  Satuan: <strong className="text-gray-700">KILOLITER</strong>
                </div>
              </div>

              {/* Upload Drag & Drop */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  File Spreadsheet Kertas Kerja
                </label>
                <div
                  onClick={() => {
                    if (isParsing) return;
                    fileInputRef.current?.click();
                  }}
                  className={`border-2 border-dashed border-gray-300 hover:border-primary bg-gray-50/50 hover:bg-primary/5 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
                    isParsing
                      ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50 hover:bg-gray-50"
                      : ""
                  }`}
                >
                  <Upload
                    size={36}
                    className="text-gray-400 group-hover:text-primary group-hover:scale-105 transition-all mb-3"
                  />
                  <p className="text-sm font-semibold text-gray-700">
                    {file ? file.name : "Pilih atau Seret File Excel (.xlsx)"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                      : "Gunakan file rakor BBM untuk parsing otomatis"}
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls"
                    disabled={isParsing}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Sheet Selection Checklist */}
              {file && sheetNames.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Pilih Sheet Tabs yang akan Di-Ingest
                    </label>
                    <span className="text-xs font-medium text-gray-500">
                      {selectedSheets.length} dipilih dari {sheetNames.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto border border-gray-100 p-3 rounded-lg bg-gray-50/30">
                    {sheetNames.map((name) => {
                      const isSelected = selectedSheets.includes(name);
                      return (
                        <label
                          key={name}
                          className={`flex items-center gap-2.5 px-3 py-2 border rounded-xl cursor-pointer select-none text-xs font-medium transition-all ${
                            isParsing ? "opacity-50 cursor-not-allowed" : ""
                          } ${
                            isSelected
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isParsing}
                            onChange={() => handleSheetToggle(name)}
                            className="rounded-xs border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className="truncate">{name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Preview State
            <div className="flex flex-col h-full space-y-4">
              {/* Preview Dashboard Stats */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-200/70">
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="text-gray-600">
                    Total Baris Ter-Parse:{" "}
                    <strong className="text-gray-900">
                      {parsedRows.length}
                    </strong>
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-green-700">
                      Cocok: <strong>{matchedCount}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-amber-700">
                      Perlu Penyesuaian: <strong>{unmatchedCount}</strong>
                    </span>
                  </div>
                </div>

                {unmatchedCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    <AlertTriangle size={14} />
                    Pilih Site/Supplier manual untuk baris berlabel kuning
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-auto border border-gray-200 rounded-2xl bg-white shadow-xs max-h-[50vh]">
                <table className="min-w-[1200px] w-full text-xs text-left border-collapse table-fixed">
                  <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-xs border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase tracking-wider w-[50px]">
                        No
                      </th>
                      <th className="px-4 py-3 text-gray-500 font-bold uppercase tracking-wider w-[100px]">
                        Sheet
                      </th>
                      <th className="px-4 py-3 text-gray-500 font-bold uppercase tracking-wider w-[100px]">
                        Bulan
                      </th>
                      <th className="px-4 py-3 text-gray-500 font-bold uppercase tracking-wider w-[280px]">
                        Excel Pembangkit & Site Sistem
                      </th>
                      <th className="px-4 py-3 text-gray-500 font-bold uppercase tracking-wider w-[280px]">
                        Excel TBBM & Supplier Sistem
                      </th>
                      <th className="px-4 py-3 text-gray-500 font-bold uppercase tracking-wider w-[90px]">
                        Produk
                      </th>
                      <th className="px-4 py-3 text-gray-500 font-bold uppercase tracking-wider w-[140px]">
                        Nomination (Pesan)
                      </th>
                      <th className="px-4 py-3 text-gray-500 font-bold uppercase tracking-wider w-[140px]">
                        Usage (Pakai)
                      </th>
                      <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase tracking-wider w-[60px]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {parsedRows.map((row, idx) => {
                      const isRowMatched = row.siteId && row.supplierId;
                      return (
                        <tr
                          key={row.id}
                          className={`transition-colors ${
                            isRowMatched
                              ? "hover:bg-gray-50/50"
                              : "bg-amber-50/20 hover:bg-amber-50/30"
                          }`}
                        >
                          {/* index */}
                          <td className="px-4 py-3 text-center font-semibold text-gray-500">
                            {idx + 1}
                          </td>

                          {/* sheet */}
                          <td className="px-4 py-3 text-gray-600 font-medium">
                            {row.sheetName}
                          </td>

                          {/* Bulan */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                              {formatMonthDate(row.monthDate)}
                            </span>
                          </td>

                          {/* Pembangkit */}
                          <td className="px-4 py-3 space-y-1">
                            <span
                              className="block text-xs font-semibold text-gray-700 truncate"
                              title={row.excelPembangkit}
                            >
                              {row.excelPembangkit}
                            </span>
                            <select
                              value={row.siteId}
                              onChange={(e) =>
                                handleRowFieldChange(
                                  row.id,
                                  "siteId",
                                  e.target.value,
                                )
                              }
                              className={`w-full text-xs px-2.5 py-1 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${
                                row.siteId
                                  ? "border-gray-200 text-gray-900"
                                  : "border-amber-400 bg-amber-50/30 text-amber-900"
                              }`}
                            >
                              <option value="">
                                -- Hubungkan Pembangkit --
                              </option>
                              {pembangkitList.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* TBBM */}
                          <td className="px-4 py-3 space-y-1">
                            <span
                              className="block text-xs font-semibold text-gray-700 truncate"
                              title={row.excelTbbm}
                            >
                              {row.excelTbbm}
                            </span>
                            <select
                              value={row.supplierId}
                              onChange={(e) =>
                                handleRowFieldChange(
                                  row.id,
                                  "supplierId",
                                  e.target.value,
                                )
                              }
                              className={`w-full text-xs px-2.5 py-1 bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${
                                row.supplierId
                                  ? "border-gray-200 text-gray-900"
                                  : "border-amber-400 bg-amber-50/30 text-amber-900"
                              }`}
                            >
                              <option value="">
                                -- Hubungkan TBBM/Supplier --
                              </option>
                              {tbbmList.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Product */}
                          <td className="px-4 py-3">
                            <select
                              value={row.product}
                              onChange={(e) =>
                                handleRowFieldChange(
                                  row.id,
                                  "product",
                                  e.target.value,
                                )
                              }
                              className="w-full text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none"
                            >
                              <option value="HSD">HSD</option>
                              <option value="B35">B35</option>
                              <option value="B40">B40</option>
                              <option value="MFO">MFO</option>
                            </select>
                          </td>

                          {/* Nomination */}
                          <td className="px-4 py-3">
                            <div className="relative">
                              <input
                                type="number"
                                step="any"
                                placeholder="-"
                                value={
                                  row.nomination === null ? "" : row.nomination
                                }
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value);
                                  handleRowFieldChange(
                                    row.id,
                                    "nomination",
                                    val === null
                                      ? null
                                      : Math.round(val * 10000) / 10000,
                                  );
                                }}
                                className="w-full text-xs pl-2 pr-6 py-1 border border-gray-200 rounded-lg text-right font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-semibold select-none">
                                kL
                              </span>
                            </div>
                          </td>

                          {/* Usage */}
                          <td className="px-4 py-3">
                            <div className="relative">
                              <input
                                type="number"
                                step="any"
                                placeholder="-"
                                value={row.usage === null ? "" : row.usage}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value);
                                  handleRowFieldChange(
                                    row.id,
                                    "usage",
                                    val === null
                                      ? null
                                      : Math.round(val * 10000) / 10000,
                                  );
                                }}
                                className="w-full text-xs pl-2 pr-6 py-1 border border-gray-200 rounded-lg text-right font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-semibold select-none">
                                kL
                              </span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleRowDelete(row.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                              title="Hapus baris"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
          {step === "upload" ? (
            <>
              <button
                type="button"
                disabled={isSaving || isParsing}
                onClick={() => setOpenModal(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={!file || selectedSheets.length === 0 || isParsing}
                className="px-5 py-2.5 bg-primary text-white hover:bg-[#0d4a5c] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-[#115d72]/10"
              >
                {isParsing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    Parse data Excel <Upload size={16} />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setStep("upload")}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} /> Kembali
              </button>
              <button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={isSaving || parsedRows.length === 0}
                className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-green-600/10"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    Simpan ke Database <Database size={16} />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

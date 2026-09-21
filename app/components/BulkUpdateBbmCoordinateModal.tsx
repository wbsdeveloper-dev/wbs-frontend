"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  Loader2,
  MapPinned,
  Save,
  Upload,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  type BbmCoordinateCommitResult,
  useCommitBbmCoordinates,
  useSites,
} from "../../hooks/service/site-api";
import {
  buildBbmCoordinateNotes,
  buildBbmCoordinateResultNotes,
  classifyBbmCoordinateRows,
  parseBbmCoordinateMatrix,
  toBbmCoordinateCommitRows,
  toBbmCoordinateNoteExportRows,
  type BbmCoordinateNote,
  type BbmCoordinateNoteCategory,
  type ClassifiedBbmCoordinateRow,
} from "./bbm-coordinate-import";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

type Step = "upload" | "preview" | "confirm";

const STATUS_STYLE: Record<ClassifiedBbmCoordinateRow["status"], string> = {
  CHANGED: "bg-blue-100 text-blue-700",
  UNCHANGED: "bg-green-100 text-green-700",
  CREATE: "bg-emerald-100 text-emerald-800",
  AMBIGUOUS: "bg-orange-100 text-orange-800",
};

const STATUS_LABEL: Record<ClassifiedBbmCoordinateRow["status"], string> = {
  CHANGED: "Akan diperbarui",
  UNCHANGED: "Sudah sama",
  CREATE: "Akan dibuat · Pembangkit BBM",
  AMBIGUOUS: "Ambigu · dilewati",
};

export default function BulkUpdateBbmCoordinateModal({
  setOpenModal,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [compatibleSheets, setCompatibleSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [rows, setRows] = useState<ClassifiedBbmCoordinateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<BbmCoordinateCommitResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    data: sites = [],
    isLoading: sitesLoading,
    isError: sitesLoadFailed,
    error: sitesLoadError,
  } = useSites({
    commodity: ["BBM"],
    includeDisabled: true,
  });
  const commitMutation = useCommitBbmCoordinates();

  const summary = useMemo(
    () => ({
      changed: rows.filter((item) => item.status === "CHANGED").length,
      unchanged: rows.filter((item) => item.status === "UNCHANGED").length,
      create: rows.filter((item) => item.status === "CREATE").length,
      ambiguous: rows.filter((item) => item.status === "AMBIGUOUS").length,
      duplicates: rows.filter(
        (item) => item.row.overriddenRowNumbers.length > 0,
      ).length,
    }),
    [rows],
  );

  const handleFileSelected = (nextFile: File | null) => {
    setFile(nextFile);
    setCompatibleSheets([]);
    setSelectedSheet("");
    setRows([]);
    setResult(null);
    setError(null);
  };

  const handleParse = async () => {
    if (!file) return setError("Pilih file Excel terlebih dahulu.");
    if (sitesLoading) {
      return setError("Data site masih dimuat. Tunggu lalu coba kembali.");
    }
    if (sitesLoadFailed) {
      const detail =
        sitesLoadError instanceof Error ? `: ${sitesLoadError.message}` : "";
      return setError(
        `Data site gagal dimuat${detail}. Muat ulang halaman lalu coba kembali.`,
      );
    }
    setIsParsing(true);
    setError(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const parseSheet = (sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet)
          throw new Error(`Sheet "${sheetName}" tidak ditemukan.`);
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
          defval: null,
          raw: true,
        });
        return parseBbmCoordinateMatrix(matrix);
      };

      let targetSheet = selectedSheet;
      if (!targetSheet) {
        const detected = workbook.SheetNames.filter((sheetName) => {
          try {
            return parseSheet(sheetName).length > 0;
          } catch {
            return false;
          }
        });
        if (detected.length === 0) {
          throw new Error(
            "Tidak ada sheet dengan kolom nama_sentral, latitude, dan longitude yang dapat diproses.",
          );
        }
        setCompatibleSheets(detected);
        if (detected.length > 1) return;
        [targetSheet] = detected;
        setSelectedSheet(targetSheet);
      }

      const parsed = parseSheet(targetSheet);
      setRows(classifyBbmCoordinateRows(parsed, sites));
      setStep("preview");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal membaca Excel.",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommit = async () => {
    if (!file || !selectedSheet || rows.length === 0) return;
    setError(null);
    try {
      const committed = await commitMutation.mutateAsync({
        fileName: file.name,
        sheetName: selectedSheet,
        rows: toBbmCoordinateCommitRows(rows),
      });
      setResult(committed);
      onSuccess?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Transaksi gagal.");
    }
  };

  const notes = useMemo(() => buildBbmCoordinateNotes(rows), [rows]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-[1250px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b bg-gray-50 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <MapPinned size={22} className="text-primary" /> Update Koordinat
              BBM
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Perbarui latitude dan longitude TBBM/Pembangkit secara terpisah
              dari Update Multi Data.
            </p>
          </div>
          <button
            onClick={() => setOpenModal(false)}
            className="rounded-lg p-2 hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex items-center justify-center gap-3 border-b px-6 py-3 text-xs font-semibold">
          {(["upload", "preview", "confirm"] as Step[]).map((item, index) => (
            <React.Fragment key={item}>
              <span
                className={step === item ? "text-primary" : "text-gray-400"}
              >
                {index + 1}.{" "}
                {item === "upload"
                  ? "Upload"
                  : item === "preview"
                    ? "Preview"
                    : "Konfirmasi"}
              </span>
              {index < 2 && <span className="h-px w-12 bg-gray-300" />}
            </React.Fragment>
          ))}
        </div>

        <main className="overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex whitespace-pre-line gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0" /> {error}
            </div>
          )}

          {result ? (
            <ResultView
              result={result}
              sourceFileName={file?.name ?? "koordinat-bbm"}
              onClose={() => setOpenModal(false)}
            />
          ) : step === "upload" ? (
            <div className="mx-auto max-w-3xl space-y-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <strong>Format Excel</strong>
                <p className="mt-1 text-xs">
                  Kolom wajib: <code>nama_sentral</code>, <code>latitude</code>,
                  dan <code>longitude</code>. Kolom <code>kode_sentral</code>{" "}
                  diabaikan. Nama dicocokkan ke <code>site_dim.name</code>.
                </p>
              </div>
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFileSelected(event.dataTransfer.files[0] ?? null);
                }}
                className="rounded-2xl border-2 border-dashed border-gray-300 p-10 text-center hover:border-primary"
              >
                <Upload size={42} className="mx-auto text-primary" />
                <p className="mt-3 font-semibold">
                  Tarik file Excel atau pilih file
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Format .xlsx atau .xls
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onClick={(event) => {
                    event.currentTarget.value = "";
                  }}
                  onChange={(event) =>
                    handleFileSelected(event.target.files?.[0] ?? null)
                  }
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold"
                >
                  Pilih File
                </button>
                {file && (
                  <p className="mt-3 text-sm text-green-700">{file.name}</p>
                )}
              </div>

              {compatibleSheets.length > 1 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <label className="text-sm font-semibold">
                    Pilih sheet koordinat
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={(event) => setSelectedSheet(event.target.value)}
                    className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Pilih sheet</option>
                    {compatibleSheets.map((sheetName) => (
                      <option key={sheetName}>{sheetName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  disabled={
                    !file ||
                    isParsing ||
                    (compatibleSheets.length > 1 && !selectedSheet)
                  }
                  onClick={handleParse}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  {isParsing && <Loader2 size={16} className="animate-spin" />}{" "}
                  Proses File
                </button>
              </div>
            </div>
          ) : step === "preview" ? (
            <div className="space-y-4">
              <SummaryGrid summary={summary} />
              {notes.length > 0 && (
                <ImportNotes
                  notes={notes}
                  sourceFileName={file?.name ?? "koordinat-bbm"}
                />
              )}
              <CoordinateTable rows={rows} />
              <div className="flex justify-between">
                <button
                  onClick={() => setStep("upload")}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2"
                >
                  <ArrowLeft size={16} /> Kembali
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white"
                >
                  Tinjau Konfirmasi
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <strong>Konfirmasi update koordinat</strong>
                <p className="mt-1 text-xs">
                  Server akan mencocokkan ulang nama. Nama yang belum ada dibuat
                  sebagai Pembangkit BBM, sedangkan nama ambigu tetap dilewati.
                  Seluruh perubahan diproses secara transaksional.
                </p>
              </div>
              <SummaryGrid summary={summary} />
              {notes.length > 0 && (
                <ImportNotes
                  notes={notes}
                  sourceFileName={file?.name ?? "koordinat-bbm"}
                />
              )}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep("preview")}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2"
                >
                  <ArrowLeft size={16} /> Kembali
                </button>
                <button
                  disabled={commitMutation.isPending}
                  onClick={handleCommit}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  {commitMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}{" "}
                  Simpan Koordinat
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SummaryGrid({
  summary,
}: {
  summary: {
    changed: number;
    unchanged: number;
    create: number;
    ambiguous: number;
    duplicates: number;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
      <Summary label="Akan diperbarui" value={summary.changed} />
      <Summary label="Sudah sama" value={summary.unchanged} />
      <Summary label="Site baru" value={summary.create} />
      <Summary label="Ambigu" value={summary.ambiguous} />
      <Summary label="Nama duplikat" value={summary.duplicates} />
    </div>
  );
}

function CoordinateTable({ rows }: { rows: ClassifiedBbmCoordinateRow[] }) {
  return (
    <div className="max-h-[48vh] overflow-auto rounded-xl border">
      <table className="w-full min-w-[1050px] text-xs">
        <thead className="sticky top-0 z-10 bg-gray-100 text-left text-gray-600">
          <tr>
            {[
              "Baris",
              "Nama Excel",
              "Site Server / Jenis",
              "Koordinat Lama",
              "Koordinat Baru",
              "Status",
            ].map((label) => (
              <th key={label} className="px-3 py-3 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((item) => (
            <tr
              key={`${item.row.normalizedName}-${item.row.rowNumber}`}
              className="align-top"
            >
              <td className="px-3 py-3 font-semibold">#{item.row.rowNumber}</td>
              <td className="px-3 py-3">
                <strong>{item.row.sourceName}</strong>
                {item.row.sourceCode && (
                  <p className="text-gray-400">
                    Kode diabaikan: {item.row.sourceCode}
                  </p>
                )}
              </td>
              <td className="px-3 py-3">
                {item.site ? (
                  <>
                    {item.site.name}
                    <p className="text-gray-500">
                      {item.site.site_type === "PEMASOK"
                        ? "TBBM/Pemasok"
                        : "Pembangkit"}
                    </p>
                  </>
                ) : item.candidates.length ? (
                  item.candidates
                    .map((site) => `${site.name} (${site.site_type})`)
                    .join(", ")
                ) : (
                  "-"
                )}
              </td>
              <td className="px-3 py-3">
                {item.site
                  ? `${item.site.lat ?? "-"}, ${item.site.long ?? "-"}`
                  : "-"}
              </td>
              <td className="px-3 py-3 font-medium">
                {item.row.latitude}, {item.row.longitude}
              </td>
              <td className="px-3 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${STATUS_STYLE[item.status]}`}
                >
                  {STATUS_LABEL[item.status]}
                </span>
                <p className="mt-2 max-w-[240px] text-gray-500">
                  {item.reason}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const NOTE_CATEGORIES: Array<{
  category: BbmCoordinateNoteCategory;
  label: string;
  badgeClass: string;
}> = [
  {
    category: "CREATE",
    label: "Akan Dibuat",
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  {
    category: "CREATED",
    label: "Site Dibuat",
    badgeClass: "bg-green-100 text-green-800",
  },
  {
    category: "AMBIGUOUS",
    label: "Ambigu",
    badgeClass: "bg-orange-100 text-orange-800",
  },
  {
    category: "DUPLICATE",
    label: "Duplikat Excel",
    badgeClass: "bg-purple-100 text-purple-800",
  },
];

function safeExportBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return (withoutExtension || "koordinat-bbm").replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function exportCoordinateNotes(
  notes: BbmCoordinateNote[],
  sourceFileName: string,
): void {
  const workbook = XLSX.utils.book_new();
  const summaryRows = NOTE_CATEGORIES.map(({ category, label }) => ({
    Kategori: label,
    Jumlah: notes.filter((note) => note.category === category).length,
  }));
  const appendSheet = (name: string, data: object[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 14 },
      { wch: 24 },
      { wch: 45 },
      { wch: 16 },
      { wch: 16 },
      { wch: 65 },
      { wch: 22 },
      { wch: 65 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  };

  appendSheet("Ringkasan", summaryRows);
  appendSheet("Semua Catatan", toBbmCoordinateNoteExportRows(notes));
  for (const { category, label } of NOTE_CATEGORIES) {
    const categoryNotes = notes.filter((note) => note.category === category);
    if (categoryNotes.length > 0) {
      appendSheet(label, toBbmCoordinateNoteExportRows(categoryNotes));
    }
  }
  XLSX.writeFile(
    workbook,
    `catatan-koordinat-${safeExportBaseName(sourceFileName)}.xlsx`,
  );
}

function ImportNotes({
  notes,
  sourceFileName,
}: {
  notes: BbmCoordinateNote[];
  sourceFileName: string;
}) {
  return (
    <details className="group rounded-xl border border-amber-300 bg-amber-50 text-sm text-amber-950">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <strong>Catatan pencocokan</strong>
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold">
            {notes.length} catatan
          </span>
          {NOTE_CATEGORIES.map(({ category, label, badgeClass }) => {
            const count = notes.filter(
              (note) => note.category === category,
            ).length;
            return count > 0 ? (
              <span
                key={category}
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
              >
                {label}: {count}
              </span>
            ) : null;
          })}
        </div>
        <ChevronDown
          size={18}
          className="shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-amber-200 px-4 pb-4 pt-3">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => exportCoordinateNotes(notes, sourceFileName)}
            className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            <Download size={15} /> Export Catatan Excel
          </button>
        </div>
        <div className="space-y-3">
          {NOTE_CATEGORIES.map(({ category, label, badgeClass }) => {
            const categoryNotes = notes.filter(
              (note) => note.category === category,
            );
            if (categoryNotes.length === 0) return null;
            return (
              <section
                key={category}
                className="rounded-lg border border-amber-200 bg-white p-3"
              >
                <h4 className="flex items-center gap-2 font-semibold">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${badgeClass}`}
                  >
                    {label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {categoryNotes.length} catatan
                  </span>
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-700">
                  {categoryNotes.map((note, index) => (
                    <li key={`${note.category}-${note.rowNumber}-${index}`}>
                      Baris {note.rowNumber} —{" "}
                      <strong>{note.sourceName}</strong>: {note.reason}
                      {note.candidates.length > 0 &&
                        ` (kandidat: ${note.candidates.join(", ")})`}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </details>
  );
}

function ResultView({
  result,
  sourceFileName,
  onClose,
}: {
  result: BbmCoordinateCommitResult;
  sourceFileName: string;
  onClose: () => void;
}) {
  const notes = buildBbmCoordinateResultNotes(result.details);
  return (
    <div className="mx-auto w-full max-w-4xl py-6 text-center">
      <CheckCircle2 size={58} className="mx-auto text-green-500" />
      <h3 className="mt-3 text-xl font-bold">Update koordinat selesai</h3>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <Summary label="Site dibuat" value={result.created} />
        <Summary label="Diperbarui" value={result.updated} />
        <Summary label="Sudah sama" value={result.unchanged} />
        <Summary label="Ambigu" value={result.ambiguous} />
      </div>
      {notes.length > 0 && (
        <div className="mt-5 text-left">
          <ImportNotes notes={notes} sourceFileName={sourceFileName} />
        </div>
      )}
      <button
        onClick={onClose}
        className="mt-7 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white"
      >
        Tutup
      </button>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <strong className="block text-xl">{value}</strong>
      {label}
    </div>
  );
}

"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  useCommitBbmRelations,
  useRelations,
  useSites,
  type BbmRelationCommitResult,
} from "@/hooks/service/site-api";
import {
  parseBbmRelationMatrix,
  toBbmRelationCommitRows,
  type ParsedBbmRelationRow,
} from "./bbm-relation-import";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

type Step = "upload" | "match" | "confirm";

const actionLabels: Record<ParsedBbmRelationRow["action"], string> = {
  CREATE: "Buat",
  UPDATE: "Perbarui",
  REACTIVATE: "Aktifkan kembali",
  DEACTIVATE: "Nonaktifkan",
  UNCHANGED: "Tidak berubah",
  INVALID: "Tidak valid",
};

const actionStyles: Record<ParsedBbmRelationRow["action"], string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  REACTIVATE: "bg-emerald-100 text-emerald-700",
  DEACTIVATE: "bg-amber-100 text-amber-800",
  UNCHANGED: "bg-gray-100 text-gray-600",
  INVALID: "bg-red-100 text-red-700",
};

export default function BulkUpdateBbmRelationModal({
  setOpenModal,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [rows, setRows] = useState<ParsedBbmRelationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<BbmRelationCommitResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sites = [], isLoading: sitesLoading } = useSites({
    commodity: ["BBM"],
    includeDisabled: true,
  });
  const { data: relations = [], isLoading: relationsLoading } = useRelations();
  const commitMutation = useCommitBbmRelations();
  const invalidRows = useMemo(
    () => rows.filter((row) => row.errors.length > 0),
    [rows],
  );
  const counts = useMemo(
    () =>
      rows.reduce<Record<string, number>>((accumulator, row) => {
        accumulator[row.action] = (accumulator[row.action] ?? 0) + 1;
        return accumulator;
      }, {}),
    [rows],
  );
  const canContinue = rows.length > 0 && invalidRows.length === 0;

  const handleFile = (nextFile: File | null) => {
    setFile(nextFile);
    setRows([]);
    setSheetName("");
    setError(null);
  };

  const handleParse = async () => {
    if (!file) {
      setError("Pilih file Excel terlebih dahulu.");
      return;
    }
    if (sitesLoading || relationsLoading) {
      setError(
        "Data referensi masih dimuat. Tunggu beberapa saat lalu coba lagi.",
      );
      return;
    }
    setIsParsing(true);
    setError(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const preferred = workbook.SheetNames.includes("Relasi BBM")
        ? "Relasi BBM"
        : workbook.SheetNames.find((name) => {
            try {
              const matrix = XLSX.utils.sheet_to_json<unknown[]>(
                workbook.Sheets[name],
                {
                  header: 1,
                  defval: null,
                  raw: true,
                },
              );
              return (
                parseBbmRelationMatrix(matrix, { sites, relations }).length > 0
              );
            } catch {
              return false;
            }
          });
      if (!preferred) {
        throw new Error(
          'Sheet "Relasi BBM" atau sheet dengan kolom wajib tidak ditemukan.',
        );
      }
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(
        workbook.Sheets[preferred],
        {
          header: 1,
          defval: null,
          raw: true,
        },
      );
      const parsed = parseBbmRelationMatrix(matrix, { sites, relations });
      if (!parsed.length)
        throw new Error("Tidak ada baris relasi yang dapat diproses.");
      setSheetName(preferred);
      setRows(parsed);
      setStep("match");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal membaca file Excel.",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommit = async () => {
    if (!file || !canContinue) return;
    setError(null);
    try {
      const committed = await commitMutation.mutateAsync({
        fileName: file.name,
        sheetName,
        rows: toBbmRelationCommitRows(rows),
      });
      setResult(committed);
      onSuccess?.();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Transaksi relasi gagal dan seluruh perubahan dibatalkan.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b bg-gray-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Update Multi Relasi TBBM–Pembangkit
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Validasi pasangan BBM, tinjau perubahan, lalu simpan atomik.
            </p>
          </div>
          <button
            onClick={() => setOpenModal(false)}
            className="rounded-lg p-2 hover:bg-gray-200"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex items-center justify-center gap-3 border-b px-6 py-3 text-xs font-semibold">
          {(["upload", "match", "confirm"] as Step[]).map((item, index) => (
            <React.Fragment key={item}>
              <span
                className={step === item ? "text-primary" : "text-gray-400"}
              >
                {index + 1}.{" "}
                {item === "upload"
                  ? "Upload"
                  : item === "match"
                    ? "Pencocokan"
                    : "Konfirmasi"}
              </span>
              {index < 2 && <span className="h-px w-12 bg-gray-300" />}
            </React.Fragment>
          ))}
        </div>

        <main className="overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <Result result={result} onClose={() => setOpenModal(false)} />
          ) : step === "upload" ? (
            <div className="mx-auto max-w-3xl space-y-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                Gunakan template relasi terbaru. Kolom ID tersembunyi tidak
                perlu diisi untuk baris baru; nama akan dicocokkan tepat dengan
                Pemasok/TBBM dan Pembangkit BBM aktif.
              </div>
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleFile(event.dataTransfer.files[0] ?? null);
                }}
                className="rounded-2xl border-2 border-dashed border-gray-300 p-10 text-center hover:border-primary"
              >
                <Upload size={42} className="mx-auto text-primary" />
                <p className="mt-3 font-semibold">
                  Tarik file Excel atau pilih file
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Maksimum 5.000 baris; status wajib AKTIF atau TIDAK AKTIF.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(event) =>
                    handleFile(event.target.files?.[0] ?? null)
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
              <div className="flex justify-end">
                <button
                  disabled={!file || isParsing}
                  onClick={handleParse}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  {isParsing && <Loader2 size={16} className="animate-spin" />}
                  Proses File
                </button>
              </div>
            </div>
          ) : step === "match" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span>
                  {rows.length} baris · {invalidRows.length} tidak valid · sheet{" "}
                  {sheetName}
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(
                    [
                      "CREATE",
                      "UPDATE",
                      "REACTIVATE",
                      "DEACTIVATE",
                      "UNCHANGED",
                    ] as const
                  ).map((action) =>
                    counts[action] ? (
                      <span
                        key={action}
                        className={`rounded-full px-2.5 py-1 font-semibold ${actionStyles[action]}`}
                      >
                        {actionLabels[action]}: {counts[action]}
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
              {invalidRows.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  Perbaiki file lalu upload ulang. Commit tidak dapat dilakukan
                  selama masih ada baris tidak valid.
                </div>
              )}
              <RelationTable rows={rows} showErrors />
              <div className="flex justify-between">
                <button
                  onClick={() => setStep("upload")}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2"
                >
                  <ArrowLeft size={16} /> Kembali
                </button>
                <button
                  disabled={!canContinue}
                  onClick={() => setStep("confirm")}
                  className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  Tinjau Konfirmasi
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <strong>Konfirmasi transaksi atomik</strong>
                <p className="mt-1 text-xs">
                  Server memvalidasi ulang semua baris. Jika satu baris gagal,
                  seluruh transaksi dibatalkan. Prioritas, komoditas, tipe, dan
                  tanggal ditentukan otomatis oleh backend.
                </p>
              </div>
              <RelationTable rows={rows} />
              <div className="flex justify-between">
                <button
                  onClick={() => setStep("match")}
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
                  )}
                  Simpan Semua Relasi
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function RelationTable({
  rows,
  showErrors = false,
}: {
  rows: ParsedBbmRelationRow[];
  showErrors?: boolean;
}) {
  return (
    <div className="max-h-[58vh] overflow-auto rounded-xl border">
      <table className="w-full min-w-[1100px] text-xs">
        <thead className="sticky top-0 z-10 bg-gray-100 text-left text-gray-600">
          <tr>
            <Th>Baris</Th>
            <Th>Nama TBBM</Th>
            <Th>Nama Pembangkit</Th>
            <Th>Moda Angkutan</Th>
            <Th>Status</Th>
            <Th>Catatan</Th>
            <Th>Aksi Sistem</Th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr
              key={row.key}
              className={
                row.errors.length ? "bg-red-50/60 align-top" : "align-top"
              }
            >
              <td className="px-3 py-3 font-bold">
                #{row.rowNumber}
                {showErrors &&
                  row.errors.map((message) => (
                    <p
                      key={message}
                      className="mt-1 max-w-[260px] font-normal text-red-600"
                    >
                      {message}
                    </p>
                  ))}
              </td>
              <td className="px-3 py-3">
                <strong>{row.sourceName || "-"}</strong>
                <p className="mt-1 text-[10px] text-gray-400">
                  {row.sourceSiteId || "ID dari nama"}
                </p>
              </td>
              <td className="px-3 py-3">
                <strong>{row.targetName || "-"}</strong>
                <p className="mt-1 text-[10px] text-gray-400">
                  {row.targetSiteId || "ID dari nama"}
                </p>
              </td>
              <td className="px-3 py-3">{row.transportMode || "-"}</td>
              <td className="px-3 py-3">
                {row.status === "ACTIVE"
                  ? "AKTIF"
                  : row.status === "INACTIVE"
                    ? "TIDAK AKTIF"
                    : "-"}
              </td>
              <td className="max-w-[260px] px-3 py-3">{row.notes || "-"}</td>
              <td className="px-3 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${actionStyles[row.action]}`}
                >
                  {actionLabels[row.action]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 font-semibold">{children}</th>;
}

function Result({
  result,
  onClose,
}: {
  result: BbmRelationCommitResult;
  onClose: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl py-8 text-center">
      <CheckCircle2 size={64} className="mx-auto text-green-500" />
      <h3 className="mt-4 text-xl font-bold">Bulk update relasi berhasil</h3>
      <p className="mt-1 text-xs text-gray-500">Import ID: {result.importId}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
        <Summary label="Dibuat" value={result.created} />
        <Summary label="Diperbarui" value={result.updated} />
        <Summary label="Diaktifkan" value={result.reactivated} />
        <Summary label="Dinonaktifkan" value={result.deactivated} />
        <Summary label="Tidak berubah" value={result.unchanged} />
      </div>
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

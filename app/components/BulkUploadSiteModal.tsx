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
  useCommitBbmSites,
  useSites,
  type BbmSiteCommitResult,
  type Site,
} from "@/hooks/service/site-api";
import { useKertasKerjaMaster } from "@/hooks/service/kertas-kerja-api";
import {
  bbmReferenceKey,
  getBbmSiteImportConflicts,
  getPendingBbmReferences,
  mergeBbmSiteImportRows,
  normalizeImportText,
  parseBbmSiteMatrix,
  toBbmSiteCommitRows,
  type ParsedBbmSiteRow,
} from "./bbm-site-import";

type Props = {
  setOpenModal: (value: boolean) => void;
  onSuccess?: () => void;
};

type Step = "upload" | "match" | "confirm";
const CREATE_VALUE = "__create__";

function numberOrUndefined(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function changedNumber(current: number | undefined, next: number | undefined) {
  return next !== undefined && Number(current ?? 0) !== Number(next);
}

export default function BulkUploadSiteModal({
  setOpenModal,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [compatibleSheets, setCompatibleSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [rows, setRows] = useState<ParsedBbmSiteRow[]>([]);
  const [confirmedReferenceKeys, setConfirmedReferenceKeys] = useState<
    string[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<BbmSiteCommitResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: sites = [], isLoading: sitesLoading } = useSites({
    commodity: ["BBM"],
    includeDisabled: true,
  });
  const { data: regions = [] } = useKertasKerjaMaster("master_region", "BBM");
  const { data: kits = [] } = useKertasKerjaMaster("master_jenis_kit", "BBM");
  const { data: upks = [] } = useKertasKerjaMaster(
    "master_unit_pelaksana",
    "BBM",
  );
  const { data: units = [] } = useKertasKerjaMaster("master_unit");
  const commitMutation = useCommitBbmSites();

  const updateRow = (key: string, patch: Partial<ParsedBbmSiteRow>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const getSite = (row: ParsedBbmSiteRow): Site | undefined =>
    sites.find((site) => site.id === row.siteId);

  const permanentErrors = (row: ParsedBbmSiteRow) =>
    row.errors.filter(
      (message) =>
        !message.startsWith("Region ") &&
        !message.startsWith("Jenis Kit ") &&
        !message.startsWith("Unit Pelaksana ") &&
        !message.startsWith('Unit "') &&
        !message.startsWith("Tipe Site tidak sesuai"),
    );

  const isReferenceConfirmed = (
    type: "REGION" | "KIT" | "UPK" | "UNIT",
    name?: string,
  ) =>
    Boolean(
      name && confirmedReferenceKeys.includes(bbmReferenceKey(type, name)),
    );

  const validationErrors = (row: ParsedBbmSiteRow): string[] => {
    const messages = [...permanentErrors(row)];
    const selected = getSite(row);
    if (!row.siteType) messages.push("Tipe Site belum valid.");
    if (row.mode === "existing" && !selected) {
      messages.push("Pilih site existing atau pilih Buat Site Baru.");
    }
    if (
      row.mode === "existing" &&
      selected &&
      row.siteType &&
      selected.site_type !== row.siteType
    ) {
      messages.push("Site existing tidak sesuai dengan Tipe Site.");
    }
    if (row.mode === "create" && !row.createConfirmed) {
      messages.push("Pembuatan site baru belum dikonfirmasi.");
    }
    if (row.newRegionName && !isReferenceConfirmed("REGION", row.newRegionName))
      messages.push(`Konfirmasi pembuatan Region "${row.newRegionName}".`);
    if (row.siteType === "PEMBANGKIT") {
      if (row.newKitName && !isReferenceConfirmed("KIT", row.newKitName))
        messages.push(`Konfirmasi pembuatan Jenis Kit "${row.newKitName}".`);
      if (row.newUpkName && !isReferenceConfirmed("UPK", row.newUpkName))
        messages.push(
          `Konfirmasi pembuatan Unit Pelaksana "${row.newUpkName}".`,
        );
      if (row.newUnitName && !isReferenceConfirmed("UNIT", row.newUnitName))
        messages.push(`Konfirmasi pembuatan Unit "${row.newUnitName}".`);
    }
    return [...new Set(messages)];
  };

  const conflicts = useMemo(() => getBbmSiteImportConflicts(rows), [rows]);
  const pendingReferences = useMemo(
    () => getPendingBbmReferences(rows),
    [rows],
  );
  const previewRows = useMemo(() => mergeBbmSiteImportRows(rows), [rows]);
  const invalidCount = rows.filter(
    (row) => validationErrors(row).length > 0 || conflicts.has(row.key),
  ).length;
  const canContinue = rows.length > 0 && invalidCount === 0;

  const actionFor = (row: ParsedBbmSiteRow) => {
    const createsReference = Boolean(
      row.newRegionName || row.newKitName || row.newUpkName || row.newUnitName,
    );
    if (row.mode === "create")
      return createsReference ? "Buat Site + Master" : "Buat Site";
    const site = getSite(row);
    if (!site) return "Belum cocok";
    const changesSite =
      site.name !== row.raw.name ||
      (row.region !== undefined && site.region !== row.region) ||
      (row.kitId !== undefined && site.kit_id !== row.kitId) ||
      (row.upkId !== undefined && site.upk_id !== row.upkId) ||
      (row.unitId !== undefined && site.unit_id !== row.unitId) ||
      changedNumber(site.capacity, row.capacity) ||
      changedNumber(site.capacity_mw, row.capacityMw) ||
      (row.isEnabled !== undefined && site.is_enabled !== row.isEnabled);
    if (changesSite && createsReference) return "Update Site + Master";
    if (changesSite) return "Update Site";
    return createsReference ? "Buat Master" : "Site sama";
  };

  const handleFileSelected = (nextFile: File | null) => {
    setFile(nextFile);
    setCompatibleSheets([]);
    setSelectedSheet("");
    setRows([]);
    setConfirmedReferenceKeys([]);
    setError(null);
  };

  const handleParse = async () => {
    if (!file) {
      setError("Pilih file Excel terlebih dahulu.");
      return;
    }
    if (sitesLoading) {
      setError("Data site masih dimuat. Tunggu beberapa saat lalu coba lagi.");
      return;
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
        return parseBbmSiteMatrix(matrix, {
          sites,
          regions,
          kits,
          upks,
          units,
          sheetName,
        });
      };

      let targetSheet = selectedSheet;
      if (!targetSheet) {
        let oldFormatError: Error | undefined;
        const detected = workbook.SheetNames.filter((sheetName) => {
          try {
            return parseSheet(sheetName).length > 0;
          } catch (caught) {
            if (
              caught instanceof Error &&
              caught.message.includes("format pasangan lama")
            ) {
              oldFormatError = caught;
            }
            return false;
          }
        });
        if (detected.length === 0) {
          throw (
            oldFormatError ??
            new Error(
              "Tidak ada sheet dengan kolom Nama Site dan Tipe Site yang dapat diproses.",
            )
          );
        }
        setCompatibleSheets(detected);
        if (detected.length > 1) return;
        [targetSheet] = detected;
        setSelectedSheet(targetSheet);
      }

      const parsed = parseSheet(targetSheet);
      if (!parsed.length)
        throw new Error("Tidak ada baris site yang dapat diproses.");
      setRows(parsed);
      setStep("match");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Gagal membaca Excel.",
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
        confirmedReferences: pendingReferences
          .filter((reference) => confirmedReferenceKeys.includes(reference.key))
          .map((reference) => ({
            type: reference.type,
            name: reference.name,
            confirmed: true as const,
          })),
        rows: toBbmSiteCommitRows(rows),
      });
      setResult(committed);
      onSuccess?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Transaksi gagal.");
    }
  };

  const selectClass =
    "w-full min-w-[150px] rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";
  const inputClass =
    "w-full min-w-[120px] rounded-lg border border-gray-300 px-2 py-2 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-[1450px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b bg-gray-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Update Multi Site BBM
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Tambah atau perbarui Pembangkit/TBBM tanpa membuat relasi.
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
              <AlertCircle size={18} className="shrink-0" /> {error}
            </div>
          )}

          {result ? (
            <div className="mx-auto max-w-xl py-10 text-center">
              <CheckCircle2 size={64} className="mx-auto text-green-500" />
              <h3 className="mt-4 text-xl font-bold">Import site berhasil</h3>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <Summary
                  label="Master dibuat"
                  value={result.referencesCreated}
                />
                <Summary label="Site dibuat" value={result.sitesCreated} />
                <Summary label="Site diperbarui" value={result.sitesUpdated} />
                <Summary label="Tidak berubah" value={result.sitesUnchanged} />
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="mt-7 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white"
              >
                Tutup
              </button>
            </div>
          ) : step === "upload" ? (
            <div className="mx-auto max-w-3xl space-y-5">
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
                  Wajib memiliki kolom Nama Site dan Tipe Site.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
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
                    Pilih sheet data site
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={(event) => setSelectedSheet(event.target.value)}
                    className={`${selectClass} mt-2`}
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
                  {isParsing && <Loader2 size={16} className="animate-spin" />}
                  Proses File
                </button>
              </div>
            </div>
          ) : step === "match" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {rows.length} baris site · {invalidCount} perlu diselesaikan
                </span>
                <span className="font-semibold text-red-600">
                  Relasi tidak diproses
                </span>
              </div>
              {pendingReferences.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  <strong>Konfirmasi master baru</strong>
                  <p className="mt-1 text-xs">
                    Nilai berikut belum ada di daftar master. Centang setiap
                    nilai yang disetujui untuk dibuat saat seluruh site
                    disimpan.
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {pendingReferences.map((reference) => (
                      <label
                        key={reference.key}
                        className="flex items-start gap-2 rounded-lg border border-amber-200 bg-white p-3"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={confirmedReferenceKeys.includes(
                            reference.key,
                          )}
                          onChange={(event) =>
                            setConfirmedReferenceKeys((current) =>
                              event.target.checked
                                ? [...new Set([...current, reference.key])]
                                : current.filter(
                                    (key) => key !== reference.key,
                                  ),
                            )
                          }
                        />
                        <span>
                          Buat <strong>{reference.label}</strong>:{" "}
                          {reference.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="max-h-[58vh] overflow-auto rounded-xl border">
                <table className="min-w-[1600px] w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-gray-100 text-left text-gray-600">
                    <tr>
                      <Th>Baris / Error</Th>
                      <Th>Nama Site</Th>
                      <Th>Tipe Site</Th>
                      <Th>Cocokkan Site</Th>
                      <Th>Region</Th>
                      <Th>Jenis Kit</Th>
                      <Th>Unit Pelaksana</Th>
                      <Th>Unit</Th>
                      <Th>Kapasitas kL</Th>
                      <Th>Kapasitas MW</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((row) => {
                      const messages = [
                        ...validationErrors(row),
                        ...(conflicts.get(row.key) ?? []),
                      ];
                      const eligibleSites = sites.filter(
                        (site) => site.site_type === row.siteType,
                      );
                      return (
                        <tr
                          key={row.key}
                          className={
                            messages.length
                              ? "bg-red-50/50 align-top"
                              : "align-top"
                          }
                        >
                          <td className="px-3 py-3">
                            <strong>
                              {row.sheetName ? `${row.sheetName} · ` : ""}#
                              {row.rowNumber}
                            </strong>
                            {messages.map((message) => (
                              <p
                                key={message}
                                className="mt-1 max-w-[230px] text-red-600"
                              >
                                {message}
                              </p>
                            ))}
                          </td>
                          <td className="px-3 py-3 font-semibold">
                            {row.raw.name || "-"}
                          </td>
                          <td className="px-3 py-3">
                            {row.siteType === "PEMBANGKIT"
                              ? "Pembangkit"
                              : row.siteType === "PEMASOK"
                                ? "TBBM/Pemasok"
                                : row.raw.siteType || "-"}
                          </td>
                          <td className="px-3 py-3">
                            <select
                              className={selectClass}
                              value={
                                row.mode === "create"
                                  ? CREATE_VALUE
                                  : row.siteId
                              }
                              onChange={(event) => {
                                if (event.target.value === CREATE_VALUE) {
                                  updateRow(row.key, {
                                    mode: "create",
                                    siteId: "",
                                    createConfirmed: false,
                                  });
                                } else {
                                  updateRow(row.key, {
                                    mode: "existing",
                                    siteId: event.target.value,
                                    createConfirmed: false,
                                  });
                                }
                              }}
                            >
                              <option value="">Pilih site</option>
                              {eligibleSites.map((site) => (
                                <option key={site.id} value={site.id}>
                                  {site.name}
                                  {!site.is_enabled ? " (nonaktif)" : ""}
                                </option>
                              ))}
                              <option value={CREATE_VALUE}>
                                + Buat Site Baru
                              </option>
                            </select>
                            {row.mode === "create" && (
                              <label className="mt-2 flex gap-2 text-[11px]">
                                <input
                                  type="checkbox"
                                  checked={row.createConfirmed}
                                  onChange={(event) =>
                                    updateRow(row.key, {
                                      createConfirmed: event.target.checked,
                                    })
                                  }
                                />
                                Konfirmasi buat site baru
                              </label>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <select
                              className={selectClass}
                              value={
                                row.newRegionName
                                  ? CREATE_VALUE
                                  : (row.region ?? "")
                              }
                              onChange={(event) => {
                                if (event.target.value === CREATE_VALUE) {
                                  updateRow(row.key, {
                                    region: row.raw.region,
                                    newRegionName: row.raw.region,
                                  });
                                } else {
                                  updateRow(row.key, {
                                    region: event.target.value || undefined,
                                    newRegionName: undefined,
                                  });
                                }
                              }}
                            >
                              <option value="">Tidak update</option>
                              {regions.map((item) => (
                                <option key={item.id} value={item.name}>
                                  {item.name}
                                </option>
                              ))}
                              {row.raw.region &&
                                !regions.some(
                                  (item) =>
                                    normalizeImportText(item.name) ===
                                    normalizeImportText(row.raw.region),
                                ) && (
                                  <option value={CREATE_VALUE}>
                                    + Buat baru: {row.raw.region}
                                  </option>
                                )}
                            </select>
                          </td>
                          <ReferenceCell
                            disabled={row.siteType !== "PEMBANGKIT"}
                            value={row.kitId}
                            newName={row.newKitName}
                            rawName={row.raw.kit}
                            items={kits}
                            onChange={(value, newName) =>
                              updateRow(row.key, {
                                kitId: value,
                                newKitName: newName,
                              })
                            }
                          />
                          <ReferenceCell
                            disabled={row.siteType !== "PEMBANGKIT"}
                            value={row.upkId}
                            newName={row.newUpkName}
                            rawName={row.raw.upk}
                            items={upks}
                            onChange={(value, newName) =>
                              updateRow(row.key, {
                                upkId: value,
                                newUpkName: newName,
                              })
                            }
                          />
                          <ReferenceCell
                            disabled={row.siteType !== "PEMBANGKIT"}
                            value={row.unitId}
                            newName={row.newUnitName}
                            rawName={row.raw.unit}
                            items={units}
                            onChange={(value, newName) =>
                              updateRow(row.key, {
                                unitId: value,
                                newUnitName: newName,
                              })
                            }
                          />
                          <td className="px-3 py-3">
                            <input
                              disabled={row.siteType !== "PEMBANGKIT"}
                              className={inputClass}
                              type="number"
                              min="0"
                              value={row.capacity ?? ""}
                              placeholder="Tidak update"
                              onChange={(event) =>
                                updateRow(row.key, {
                                  capacity: numberOrUndefined(
                                    event.target.value,
                                  ),
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              disabled={row.siteType !== "PEMBANGKIT"}
                              className={inputClass}
                              type="number"
                              min="0"
                              value={row.capacityMw ?? ""}
                              placeholder="Tidak update"
                              onChange={(event) =>
                                updateRow(row.key, {
                                  capacityMw: numberOrUndefined(
                                    event.target.value,
                                  ),
                                })
                              }
                            />
                          </td>
                          <td className="px-3 py-3">
                            <select
                              className={selectClass}
                              value={
                                row.isEnabled === undefined
                                  ? ""
                                  : row.isEnabled
                                    ? "true"
                                    : "false"
                              }
                              onChange={(event) =>
                                updateRow(row.key, {
                                  isEnabled:
                                    event.target.value === ""
                                      ? undefined
                                      : event.target.value === "true",
                                })
                              }
                            >
                              <option value="">Tidak update</option>
                              <option value="true">Aktif</option>
                              <option value="false">Tidak Aktif</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                <strong>Konfirmasi transaksi site_dim</strong>
                <p className="mt-1 text-xs">
                  Semua site diproses atomik. Tidak ada relasi TBBM–Pembangkit
                  yang dibuat atau diperbarui.
                </p>
              </div>
              <div className="max-h-[56vh] overflow-auto rounded-xl border">
                <table className="w-full min-w-[1000px] text-xs">
                  <thead className="sticky top-0 bg-gray-100 text-left">
                    <tr>
                      <Th>Baris</Th>
                      <Th>Nama</Th>
                      <Th>Jenis</Th>
                      <Th>Atribut</Th>
                      <Th>Aksi</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewRows.map((row) => (
                      <tr key={row.key} className="align-top">
                        <td className="px-3 py-3 font-bold">
                          {row.sheetName ? `${row.sheetName} · ` : ""}#
                          {row.rowNumber}
                        </td>
                        <td className="px-3 py-3">
                          <strong>{row.raw.name}</strong>
                          <p className="text-gray-500">
                            {row.mode === "existing"
                              ? getSite(row)?.name
                              : "Site baru"}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          {row.siteType === "PEMBANGKIT"
                            ? "Pembangkit"
                            : "TBBM/Pemasok"}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          Region: {row.region ?? "tidak update"}
                          {row.newRegionName ? " (master baru)" : ""}
                          <br />
                          Kit/UPK/Unit:{" "}
                          {row.newKitName ??
                            (row.kitId ? "dipilih" : "-")} /{" "}
                          {row.newUpkName ?? (row.upkId ? "dipilih" : "-")} /{" "}
                          {row.newUnitName ?? (row.unitId ? "dipilih" : "-")}
                          <br />
                          kL: {row.capacity ?? "tidak update"}; MW:{" "}
                          {row.capacityMw ?? "tidak update"}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 font-semibold text-blue-700">
                            {actionFor(row)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  )}{" "}
                  Simpan Semua Site
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 font-semibold">{children}</th>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <strong className="block text-xl">{value}</strong>
      {label}
    </div>
  );
}

function ReferenceCell({
  value,
  newName,
  rawName,
  items,
  disabled,
  onChange,
}: {
  value: string | undefined;
  newName: string | undefined;
  rawName: string;
  items: Array<{ id: string; name: string }>;
  disabled: boolean;
  onChange: (value: string | undefined, newName: string | undefined) => void;
}) {
  return (
    <td className="px-3 py-3">
      <select
        disabled={disabled}
        value={newName ? CREATE_VALUE : (value ?? "")}
        onChange={(event) =>
          event.target.value === CREATE_VALUE
            ? onChange(undefined, rawName)
            : onChange(event.target.value || undefined, undefined)
        }
        className="w-full min-w-[150px] rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs disabled:bg-gray-100"
      >
        <option value="">Tidak update</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
        {rawName &&
          !items.some(
            (item) =>
              normalizeImportText(item.name) === normalizeImportText(rawName),
          ) && <option value={CREATE_VALUE}>+ Buat baru: {rawName}</option>}
      </select>
    </td>
  );
}

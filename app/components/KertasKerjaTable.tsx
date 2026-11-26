"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Maximize2,
  Minimize2,
  Save,
  Loader2,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  Lock,
  MoreVertical,
  ChevronDown,
  Cloud,
  CloudOff,
  Clock3,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";
import {
  useKertasKerjaTemplates,
  useKertasKerjaRecords,
  useBulkUpsertKertasKerjaRecords,
  useKertasKerjaMaster,
  RecordKertasKerja,
} from "@/hooks/service/kertas-kerja-api";
import Modal from "./ui/Modal";
import {
  isKertasKerjaDayField,
  roundKertasKerjaDayFields,
  roundKertasKerjaDayValue,
} from "./kertas-kerja-day-values";
import {
  calculateKertasKerjaDelta,
  withCalculatedKertasKerjaDelta,
} from "./kertas-kerja-calculations";

interface KertasKerjaTableProps {
  selectedRegion: string;
  selectedYear: number;
  selectedUnit?: string;
  selectedUnitPelaksana?: string;
  selectedPembangkit?: string;
  canUpdate?: boolean;
}

type KertasKerjaModalState =
  | {
      type: "message";
      status: "success" | "error" | "info";
      title: string;
      message: string;
    }
  | { type: "refresh-confirm" }
  | null;

type AutoSyncStatus =
  | "idle"
  | "pending"
  | "saving"
  | "refreshing"
  | "saved"
  | "error"
  | "offline";

type DirtyKertasKerjaRecords = Record<string, Partial<RecordKertasKerja>>;

type EditableTableControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

const EDITABLE_TABLE_CONTROL_SELECTOR = [
  "input:not([readonly]):not([disabled])",
  "select:not([disabled])",
  "textarea:not([readonly]):not([disabled])",
].join(", ");

function getTableCellVisualColumn(cell: HTMLTableCellElement): number {
  const row = cell.parentElement as HTMLTableRowElement | null;
  if (!row) return cell.cellIndex;

  return Array.from(row.cells)
    .slice(0, cell.cellIndex)
    .reduce((column, previousCell) => column + previousCell.colSpan, 0);
}

function findEditableControlBelow(
  tableBody: HTMLTableSectionElement,
  sourceRowIndex: number,
  visualColumn: number,
): EditableTableControl | null {
  const rows = Array.from(tableBody.rows);

  for (let rowIndex = sourceRowIndex + 1; rowIndex < rows.length; rowIndex++) {
    let columnStart = 0;

    for (const cell of Array.from(rows[rowIndex].cells)) {
      const columnEnd = columnStart + cell.colSpan;
      const containsColumn =
        visualColumn >= columnStart && visualColumn < columnEnd;

      if (containsColumn) {
        const control = cell.querySelector<EditableTableControl>(
          EDITABLE_TABLE_CONTROL_SELECTOR,
        );
        if (control) return control;
        break;
      }

      columnStart = columnEnd;
    }
  }

  return null;
}

export default function KertasKerjaTable({
  selectedRegion,
  selectedYear,
  selectedUnit,
  selectedUnitPelaksana,
  selectedPembangkit,
  canUpdate = false,
}: KertasKerjaTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [modalState, setModalState] = useState<KertasKerjaModalState>(null);
  const [autoSyncStatus, setAutoSyncStatus] = useState<AutoSyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [isPageVisible, setIsPageVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const saveInFlightRef = useRef(false);
  const autoRefreshInFlightRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const autoSaveCallbackRef = useRef<() => void>(() => undefined);
  const autoRefreshCallbackRef = useRef<() => void>(() => undefined);
  const [localRecords, setLocalRecords] = useState<
    Record<string, RecordKertasKerja>
  >({});
  const [dirtyRecords, setDirtyRecords] = useState<DirtyKertasKerjaRecords>({});
  const dirtyRecordsRef = useRef<DirtyKertasKerjaRecords>({});

  const {
    data: templates = [],
    isLoading: templatesLoading,
    isRefetching: templatesRefetching,
    refetch: refetchTemplates,
  } = useKertasKerjaTemplates();
  const {
    data: records = [],
    isLoading: recordsLoading,
    isRefetching: recordsRefetching,
    refetch: refetchRecords,
  } = useKertasKerjaRecords();
  const upsertMutation = useBulkUpsertKertasKerjaRecords();
  const {
    data: polaOperasiList = [],
    isRefetching: polaOperasiRefetching,
    refetch: refetchPolaOperasi,
  } = useKertasKerjaMaster("master_pola_operasi");

  const filteredTemplates = templates.filter((t) => {
    if (selectedRegion && t.site_region !== selectedRegion) return false;
    if (selectedUnit && t.unit_name !== selectedUnit) return false;
    if (selectedUnitPelaksana && t.upk_name !== selectedUnitPelaksana)
      return false;
    if (selectedPembangkit && t.site_name !== selectedPembangkit) return false;
    if (!showInactive && t.is_active === false) return false;
    return true;
  });

  const availableUnits = Array.from(
    new Set(filteredTemplates.map((t) => t.unit_name).filter(Boolean)),
  ) as string[];

  const [activeUnitTab, setActiveUnitTab] = useState<string>("");

  useEffect(() => {
    if (availableUnits.length > 0 && !availableUnits.includes(activeUnitTab)) {
      setActiveUnitTab(availableUnits[0]);
    } else if (availableUnits.length === 0) {
      setActiveUnitTab("");
    }
  }, [availableUnits, activeUnitTab]);

  const displayedTemplates = activeUnitTab
    ? filteredTemplates.filter((t) => t.unit_name === activeUnitTab)
    : filteredTemplates;

  const isLoading = templatesLoading || recordsLoading;
  const isDirty = Object.keys(dirtyRecords).length > 0;
  const isRefreshing =
    templatesRefetching || recordsRefetching || polaOperasiRefetching;
  isRefreshingRef.current = isRefreshing;

  const updateDirtyRecords = (
    updater:
      | DirtyKertasKerjaRecords
      | ((current: DirtyKertasKerjaRecords) => DirtyKertasKerjaRecords),
  ) => {
    const current = dirtyRecordsRef.current;
    const next = typeof updater === "function" ? updater(current) : updater;
    dirtyRecordsRef.current = next;
    setDirtyRecords(next);
  };

  useEffect(() => {
    if (
      canUpdate &&
      (saveInFlightRef.current ||
        Object.keys(dirtyRecordsRef.current).length > 0 ||
        tableRef.current?.contains(document.activeElement))
    ) {
      return;
    }

    if (!canUpdate) {
      // Discard any pending local edit if UPDATE access is revoked at runtime.
      dirtyRecordsRef.current = {};
      setDirtyRecords({});
      setAutoSyncStatus("idle");
    }

    const initial: Record<string, RecordKertasKerja> = {};
    records.forEach((r) => {
      initial[`${r.template_kertas_kerja_id}_${r.month_work}`] =
        withCalculatedKertasKerjaDelta(roundKertasKerjaDayFields(r));
    });
    setLocalRecords(initial);
  }, [canUpdate, records]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setAutoSyncStatus((status) => (status === "offline" ? "idle" : status));
    };
    const handleOffline = () => {
      setIsOnline(false);
      setAutoSyncStatus("offline");
    };
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!isActionsMenuOpen) return;

    const handleMenuClose = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (
        event instanceof MouseEvent &&
        actionsMenuRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setIsActionsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleMenuClose);
    document.addEventListener("keydown", handleMenuClose);
    return () => {
      document.removeEventListener("mousedown", handleMenuClose);
      document.removeEventListener("keydown", handleMenuClose);
    };
  }, [isActionsMenuOpen]);

  const performRefresh = async ({
    automatic = false,
    discardUnsaved = false,
  }: { automatic?: boolean; discardUnsaved?: boolean } = {}) => {
    if (autoRefreshInFlightRef.current || isRefreshingRef.current) return;

    if (discardUnsaved) updateDirtyRecords({});
    autoRefreshInFlightRef.current = true;
    setRefreshError("");
    if (automatic) setAutoSyncStatus("refreshing");

    try {
      const recordResult = automatic
        ? await refetchRecords()
        : (
            await Promise.all([
              refetchTemplates(),
              refetchRecords(),
              refetchPolaOperasi(),
            ])
          )[1];

      if (recordResult.isError) {
        throw recordResult.error ?? new Error("Data gagal dimuat ulang.");
      }

      // Never replace local edits that appeared while refresh was in flight.
      if (Object.keys(dirtyRecordsRef.current).length === 0) {
        const refreshedRecords = recordResult.data ?? [];
        const refreshedLocalRecords: Record<string, RecordKertasKerja> = {};
        refreshedRecords.forEach((record) => {
          refreshedLocalRecords[
            `${record.template_kertas_kerja_id}_${record.month_work}`
          ] = withCalculatedKertasKerjaDelta(roundKertasKerjaDayFields(record));
        });
        setLocalRecords(refreshedLocalRecords);
        setLastSyncedAt(new Date());
      }

      if (automatic) setAutoSyncStatus("idle");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Data gagal dimuat ulang.";
      setRefreshError(message);
      setAutoSyncStatus("error");

      if (!automatic) {
        setModalState({
          type: "message",
          status: "error",
          title: "Refresh Data Gagal",
          message,
        });
      }
    } finally {
      autoRefreshInFlightRef.current = false;
    }
  };

  const handleRefresh = () => {
    if (isDirty) {
      setModalState({ type: "refresh-confirm" });
      return;
    }

    void performRefresh();
  };

  const handleRecordChange = (
    templateId: string,
    month: string,
    field: keyof RecordKertasKerja,
    val: string,
  ) => {
    if (!canUpdate) return;

    const key = `${templateId}_${month}`;

    setLocalRecords((prev) => {
      const existing = prev[key] || {
        template_kertas_kerja_id: templateId,
        month_work: month,
      };

      const parsedValue =
        val === "" ? null : isNaN(Number(val)) ? val : Number(val);
      const parsedVal = isKertasKerjaDayField(field)
        ? roundKertasKerjaDayValue(parsedValue)
        : parsedValue;

      // If the value hasn't changed, don't do anything
      if (existing[field] === parsedVal) {
        return prev;
      }

      const updatedRecord = {
        ...existing,
        [field]: parsedVal,
      } as RecordKertasKerja;
      const shouldRecalculateDelta =
        field === "terima" || field === "rencana_pesan";
      const calculatedValues = shouldRecalculateDelta
        ? calculateKertasKerjaDelta(updatedRecord)
        : null;
      const nextRecord = calculatedValues
        ? { ...updatedRecord, ...calculatedValues }
        : updatedRecord;

      // Mark the changed value and its same-month calculated fields as dirty.
      updateDirtyRecords((dirtyPrev) => {
        const dirtyExisting = dirtyPrev[key] || {};
        return {
          ...dirtyPrev,
          [key]: {
            ...dirtyExisting,
            id: existing.id,
            template_kertas_kerja_id: templateId,
            month_work: month,
            [field]: parsedVal,
            ...(calculatedValues ?? {}),
          },
        };
      });
      setAutoSyncStatus(isOnline ? "pending" : "offline");

      return {
        ...prev,
        [key]: nextRecord,
      };
    });
  };

  const performSave = async ({
    automatic = false,
  }: { automatic?: boolean } = {}) => {
    if (!canUpdate) {
      if (!automatic) {
        setModalState({
          type: "message",
          status: "info",
          title: "Mode Baca Saja",
          message:
            "Anda tidak memiliki hak UPDATE untuk mengubah atau menyimpan Kertas Kerja BBM.",
        });
      }
      return;
    }

    if (saveInFlightRef.current) return;

    const snapshot = dirtyRecordsRef.current;
    const payload = Object.values(snapshot);
    if (payload.length === 0) {
      if (!automatic) {
        setModalState({
          type: "message",
          status: "info",
          title: "Tidak Ada Perubahan",
          message: "Tidak ada data untuk disimpan.",
        });
      }
      return;
    }

    if (!navigator.onLine) {
      setIsOnline(false);
      setAutoSyncStatus("offline");
      if (!automatic) {
        setModalState({
          type: "message",
          status: "error",
          title: "Tidak Ada Koneksi",
          message:
            "Perubahan belum disimpan dan akan dicoba kembali saat online.",
        });
      }
      return;
    }

    saveInFlightRef.current = true;
    setAutoSyncStatus("saving");

    try {
      await upsertMutation.mutateAsync({
        records: payload as RecordKertasKerja[],
      });

      // Clear only records that are still identical to the saved snapshot.
      // Any edits made while this request was running remain dirty.
      const currentDirtyRecords = dirtyRecordsRef.current;
      const remainingDirtyRecords = Object.fromEntries(
        Object.entries(currentDirtyRecords).filter(([key, currentRecord]) => {
          const savedRecord = snapshot[key];
          if (!savedRecord) return true;

          const currentEntries = Object.entries(currentRecord);
          const savedEntries = Object.entries(savedRecord);
          return (
            currentEntries.length !== savedEntries.length ||
            currentEntries.some(
              ([field, value]) =>
                !Object.is(
                  value,
                  savedRecord[field as keyof RecordKertasKerja],
                ),
            )
          );
        }),
      ) as DirtyKertasKerjaRecords;

      updateDirtyRecords(remainingDirtyRecords);
      setLastSyncedAt(new Date());
      setAutoSyncStatus(
        Object.keys(remainingDirtyRecords).length > 0 ? "pending" : "saved",
      );

      if (!automatic) {
        setModalState({
          type: "message",
          status: "success",
          title: "Perubahan Tersimpan",
          message: "Perubahan data Kertas Kerja BBM berhasil disimpan.",
        });
      }
    } catch (error) {
      setAutoSyncStatus("error");
      if (!automatic) {
        setModalState({
          type: "message",
          status: "error",
          title: "Gagal Menyimpan",
          message:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat menyimpan perubahan.",
        });
      }
    } finally {
      saveInFlightRef.current = false;
    }
  };

  const handleSave = () => {
    void performSave();
  };

  autoSaveCallbackRef.current = () => {
    void performSave({ automatic: true });
  };
  autoRefreshCallbackRef.current = () => {
    const hasActiveTableEditor =
      tableRef.current?.contains(document.activeElement) ?? false;
    if (
      !isOnline ||
      !isPageVisible ||
      modalState !== null ||
      hasActiveTableEditor ||
      saveInFlightRef.current ||
      autoRefreshInFlightRef.current ||
      isRefreshingRef.current ||
      Object.keys(dirtyRecordsRef.current).length > 0
    ) {
      return;
    }

    void performRefresh({ automatic: true });
  };

  // Auto-save once, 3 seconds after the latest committed cell change.
  useEffect(() => {
    if (!canUpdate || !isOnline || !isPageVisible || !isDirty) return;

    setAutoSyncStatus("pending");
    const timeoutId = window.setTimeout(() => {
      autoSaveCallbackRef.current();
    }, 3_000);

    return () => window.clearTimeout(timeoutId);
  }, [canUpdate, dirtyRecords, isDirty, isOnline, isPageVisible]);

  // Poll for fresh records every 5 seconds, but only while the table is idle.
  useEffect(() => {
    if (!isOnline || !isPageVisible) return;

    const intervalId = window.setInterval(() => {
      autoRefreshCallbackRef.current();
    }, 5_000);

    return () => window.clearInterval(intervalId);
  }, [isOnline, isPageVisible]);

  const autoSyncLabel = (() => {
    if (!canUpdate) return "Mode baca saja — tanpa hak UPDATE";
    if (!isOnline || autoSyncStatus === "offline") {
      return "Offline — perubahan tertunda";
    }
    if (autoSyncStatus === "saving") return "Menyimpan otomatis...";
    if (autoSyncStatus === "refreshing") return "Memuat data terbaru...";
    if (autoSyncStatus === "pending") return "Auto-save dalam 3 detik";
    if (autoSyncStatus === "error") return "Sinkronisasi gagal";
    if (autoSyncStatus === "saved" && lastSyncedAt) {
      return `Tersimpan ${lastSyncedAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`;
    }
    return "Auto-sync aktif";
  })();

  const shortYear = String(selectedYear).slice(-2);
  const allMonths = [
    `Jan '${shortYear}`,
    `Feb '${shortYear}`,
    `Mar '${shortYear}`,
    `Apr '${shortYear}`,
    `Mei '${shortYear}`,
    `Jun '${shortYear}`,
    `Jul '${shortYear}`,
    `Agu '${shortYear}`,
    `Sep '${shortYear}`,
    `Okt '${shortYear}`,
    `Nov '${shortYear}`,
    `Des '${shortYear}`,
  ];

  const currentMonthIndex = new Date().getMonth();
  const currentMonth = allMonths[currentMonthIndex] || allMonths[5];

  const displayedMonths = isExpanded ? allMonths : [currentMonth];
  const numMonths = displayedMonths.length;

  const handleTableEnterNavigation = (
    event: React.KeyboardEvent<HTMLTableElement>,
  ) => {
    if (
      !canUpdate ||
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    const control = event.target;
    if (
      !(
        control instanceof HTMLInputElement ||
        control instanceof HTMLSelectElement ||
        control instanceof HTMLTextAreaElement
      ) ||
      control.disabled ||
      ("readOnly" in control && control.readOnly)
    ) {
      return;
    }

    const sourceCell = control.closest("td");
    const sourceRow = sourceCell?.parentElement as HTMLTableRowElement | null;
    const tableBody =
      sourceRow?.parentElement as HTMLTableSectionElement | null;
    if (!sourceCell || !sourceRow || !tableBody) return;

    const sourceRowIndex = Array.from(tableBody.rows).indexOf(sourceRow);
    const tableBodyIndex = Array.from(event.currentTarget.tBodies).indexOf(
      tableBody,
    );
    if (sourceRowIndex < 0 || tableBodyIndex < 0) return;

    const visualColumn = getTableCellVisualColumn(sourceCell);
    const nextControl = findEditableControlBelow(
      tableBody,
      sourceRowIndex,
      visualColumn,
    );
    if (!nextControl) return;

    event.preventDefault();
    const table = event.currentTarget;
    control.blur();

    requestAnimationFrame(() => {
      const currentTableBody = table.tBodies[tableBodyIndex];
      if (!currentTableBody) return;

      const currentNextControl = findEditableControlBelow(
        currentTableBody,
        sourceRowIndex,
        visualColumn,
      );
      if (!currentNextControl) return;

      currentNextControl.focus();
      if (currentNextControl instanceof HTMLInputElement) {
        currentNextControl.select();
      }
    });
  };

  const InputCell = ({
    defaultValue,
    onBlur,
    className = "",
    readOnly = false,
    bgColorClass,
    roundToInteger = false,
    valueType = "number",
  }: {
    defaultValue: any;
    onBlur?: (val: string) => void;
    className?: string;
    readOnly?: boolean;
    bgColorClass?: string;
    roundToInteger?: boolean;
    valueType?: "number" | "text";
  }) => {
    const formatValue = (v: any) => {
      if (v == null || v === "") return "";
      const num = Number(v);
      if (valueType === "text" || isNaN(num)) return String(v);
      return String(roundToInteger ? Math.round(num) : num);
    };

    const sanitizeNumericValue = (value: string) => {
      const normalized = value.replace(/,/g, ".").replace(/[^\d.-]/g, "");
      const isNegative = normalized.startsWith("-");
      const unsignedValue = normalized.replace(/-/g, "");
      const [integerPart = "", ...decimalParts] = unsignedValue.split(".");
      const decimalPart = decimalParts.join("");

      return `${isNegative ? "-" : ""}${integerPart}${
        decimalParts.length > 0 ? `.${decimalPart}` : ""
      }`;
    };

    const effectiveReadOnly = !canUpdate || readOnly;
    const [val, setVal] = useState(formatValue(defaultValue));

    useEffect(() => {
      setVal(formatValue(defaultValue));
    }, [defaultValue]);

    return (
      <input
        type="text"
        inputMode={valueType === "number" ? "decimal" : "text"}
        pattern={valueType === "number" ? "-?[0-9]*[.,]?[0-9]*" : undefined}
        value={val}
        onChange={(e) => {
          if (effectiveReadOnly) return;
          setVal(
            valueType === "number"
              ? sanitizeNumericValue(e.target.value)
              : e.target.value,
          );
        }}
        onBlur={() => {
          if (effectiveReadOnly) return;
          const incompleteNumber = ["-", ".", "-."].includes(val);
          const normalizedValue = formatValue(
            valueType === "number" && incompleteNumber ? "" : val,
          );
          setVal(normalizedValue);
          onBlur?.(normalizedValue);
        }}
        readOnly={effectiveReadOnly}
        aria-readonly={effectiveReadOnly}
        placeholder="-"
        className={`w-full min-w-[60px] px-1 py-1 text-xs font-medium border border-transparent hover:border-slate-400 focus:border-primary focus:ring-1 focus:ring-primary rounded outline-none transition-all ${className} ${
          bgColorClass || "!bg-transparent"
        } ${
          effectiveReadOnly
            ? "cursor-default hover:border-transparent focus:border-transparent focus:ring-0 text-gray-700"
            : "focus:!bg-white dark:focus:!bg-slate-800 text-gray-900"
        }`}
      />
    );
  };

  const getHopColor = (val: any) => {
    const num = Number(val);
    if (isNaN(num) || val === null || val === "" || val === undefined)
      return "";
    if (num <= 5)
      return "!bg-red-500 !text-white hover:!bg-red-600 focus:!bg-red-600 focus:!text-white";
    if (num <= 10)
      return "!bg-yellow-300 !text-gray-950 hover:!bg-yellow-400 focus:!bg-yellow-400 focus:!text-gray-950";
    return "!bg-green-500 !text-white hover:!bg-green-600 focus:!bg-green-600 focus:!text-white";
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const unitsToExport =
      availableUnits.length > 0 ? availableUnits : ["Kertas Kerja"];

    unitsToExport.forEach((unit) => {
      const templatesForUnit =
        availableUnits.length > 0
          ? filteredTemplates.filter((t) => t.unit_name === unit)
          : filteredTemplates;

      const wsData: any[][] = [];

      const row1 = [
        "NO.",
        "UNIT PELAKSANA",
        "JENIS KIT",
        "PEMBANGKIT",
        "JENIS BBM",
        "MODA ANGKUTAN",
        "TBBM",
        "",
        "",
        "TANGKI TIMBUN",
        "",
        "",
        "",
        "HOP MINIMUM",
      ];
      displayedMonths.forEach((m) => {
        row1.push(
          `STOK ${m} (kL)`,
          `KETERISIAN TANGKI (%)`,
          `HOP ${m} (Hari)`,
          `KETERANGAN HOP < HOP MIN`,
        );
      });
      row1.push("REALISASI (SAP)");
      for (let i = 1; i < 4 * numMonths; i++) row1.push("");
      row1.push("RENOMINASI/KONFIRMASI");
      for (let i = 1; i < 2 * numMonths; i++) row1.push("");
      row1.push("DELTA (REAL - KONF)");
      for (let i = 1; i < 2 * numMonths; i++) row1.push("");
      row1.push("NOMINASI");
      for (let i = 1; i < 2 * numMonths; i++) row1.push("");
      row1.push("POLA OPERASI");
      row1.push("KETERANGAN");
      for (let i = 1; i < 2 * numMonths; i++) row1.push("");
      wsData.push(row1);

      const row2: any[] = [];
      for (let i = 0; i < 6; i++) row2.push("");
      row2.push("NAMA", "JARAK (km)", "Estimasi Pengiriman");
      row2.push(
        "KAP. (kL)",
        "PEMAKAIAN RATA2 BULAN-1",
        "FREIGHT COST (Rp)",
        "HOP (Hari)",
      );
      row2.push("");
      displayedMonths.forEach(() => {
        row2.push("", "", "", "");
      });
      row2.push("TERIMA (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("PEMAKAIAN (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("STOK AKHIR BULAN (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("SHOP AKHIR BULAN (Hari)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("PESAN (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("PROYEKSI SHOP AKHIR BULAN (Hari)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("DELTA TERIMA (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("PENCAPAIAN (%)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("PESAN (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("HOP (Hari)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("");
      row2.push("KETERANGAN");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("DETAIL KETERANGAN");
      for (let i = 1; i < numMonths; i++) row2.push("");
      wsData.push(row2);

      const row3: any[] = [];
      for (let i = 0; i < 6; i++) row3.push("");
      row3.push("", "", "Hari");
      row3.push("", "", "", "");
      row3.push("");
      displayedMonths.forEach(() => {
        row3.push("", "", "", "");
      });
      displayedMonths.forEach((m) => row3.push(m));
      displayedMonths.forEach((m) => row3.push(m));
      displayedMonths.forEach((m) => row3.push(m));
      displayedMonths.forEach((m) => row3.push(m));
      displayedMonths.forEach((m) => row3.push(m));
      displayedMonths.forEach((m) => row3.push(m));
      displayedMonths.forEach((m) => row3.push(m));
      displayedMonths.forEach((m) => row3.push(m));
      displayedMonths.forEach((m) => row3.push(m));
      displayedMonths.forEach((m) => row3.push(m));
      row3.push("");
      displayedMonths.forEach((m) => row3.push(m));
      displayedMonths.forEach((m) => row3.push(m));
      wsData.push(row3);

      let excelIdx = 0;
      Object.entries(
        templatesForUnit.reduce(
          (acc, t) => {
            const site = t.upk_name || "Unknown UPK";
            if (!acc[site]) acc[site] = [];
            acc[site].push(t);
            return acc;
          },
          {} as Record<string, typeof templatesForUnit>,
        ),
      ).forEach(([upkName, siteTemplates]) => {
        const getSum = (
          arr: any[],
          m: string,
          field: keyof RecordKertasKerja,
        ) => {
          const sum = arr.reduce(
            (s, t) => s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0),
            0,
          );
          return sum === 0 ? "-" : sum;
        };

        const getAvg = (
          arr: any[],
          m: string,
          field: keyof RecordKertasKerja,
        ) => {
          const sum = arr.reduce(
            (s, t) => s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0),
            0,
          );
          if (arr.length === 0 || sum === 0) return "-";
          const average = sum / arr.length;
          return isKertasKerjaDayField(field)
            ? Math.round(average)
            : Number(average.toFixed(2));
        };

        const productsInSite = Array.from(
          new Set(
            siteTemplates.map((t) => t.product_name || "Unknown Product"),
          ),
        );

        productsInSite.forEach((product) => {
          const productTemplates = siteTemplates.filter(
            (t) => (t.product_name || "Unknown Product") === product,
          );

          productTemplates.forEach((template) => {
            excelIdx++;
            const trData: any[] = [];
            trData.push(excelIdx);
            trData.push(template.upk_name || "-");
            trData.push(template.kit_name || "-");
            trData.push(template.site_name || "-");
            trData.push(template.product_name || "-");
            trData.push(template.moda_name || "-");

            trData.push(template.supplier_name || "-");
            trData.push(template.distance ?? "-");
            trData.push(template.estimated_delivery_time ?? "-");

            trData.push(template.site_capacity ?? "-");
            trData.push(template.average_usage ?? "-");
            trData.push(template.freight_costs ?? "-");
            const calcHop =
              template.site_capacity && template.average_usage
                ? Math.round(template.site_capacity / template.average_usage)
                : "-";
            trData.push(calcHop);
            trData.push(roundKertasKerjaDayValue(template.hop_minimum) ?? "-");

            displayedMonths.forEach((m) => {
              const rec = localRecords[`${template.id}_${m}`];
              trData.push(rec?.stock ?? "-");
              const calcKet =
                rec?.stock && template.site_capacity
                  ? (
                      (Number(rec.stock) / template.site_capacity) *
                      100
                    ).toFixed(2)
                  : "-";
              trData.push(calcKet);
              trData.push(rec?.hop ?? "-");
              trData.push(rec?.keterangan_hop_less_than_5 ?? "-");
            });

            displayedMonths.forEach((m) =>
              trData.push(localRecords[`${template.id}_${m}`]?.terima ?? "-"),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.pemakaian ?? "-",
              ),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.stock_akhir_bulan ?? "-",
              ),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.shop_akhir_bulan ?? "-",
              ),
            );

            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.renominasi_pesan ?? "-",
              ),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]
                  ?.renominaso_proyeksi_akhir_bulan ?? "-",
              ),
            );

            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.delta_terima ?? "-",
              ),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.pencapaian ?? "-",
              ),
            );

            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.rencana_pesan ?? "-",
              ),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.rencana_hop ?? "-",
              ),
            );

            trData.push("-");

            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.keterangan ?? "-",
              ),
            );
            displayedMonths.forEach((m) => trData.push("-"));

            wsData.push(trData);
          });

          const tpData: any[] = [];
          tpData.push("");
          tpData.push(`TOTAL ${product} ${upkName}`);
          for (let i = 0; i < 12; i++) tpData.push("");

          displayedMonths.forEach((m) => {
            tpData.push(getSum(productTemplates, m, "stock"));
            tpData.push(getAvg(productTemplates, m, "keterisian_tanki"));
            tpData.push(getAvg(productTemplates, m, "hop"));
            tpData.push("-");
          });

          displayedMonths.forEach((m) =>
            tpData.push(getSum(productTemplates, m, "terima")),
          );
          displayedMonths.forEach((m) =>
            tpData.push(getSum(productTemplates, m, "pemakaian")),
          );
          displayedMonths.forEach((m) =>
            tpData.push(getSum(productTemplates, m, "stock_akhir_bulan")),
          );
          displayedMonths.forEach((m) =>
            tpData.push(getAvg(productTemplates, m, "shop_akhir_bulan")),
          );

          displayedMonths.forEach((m) =>
            tpData.push(getSum(productTemplates, m, "renominasi_pesan")),
          );
          displayedMonths.forEach((m) =>
            tpData.push(
              getAvg(productTemplates, m, "renominaso_proyeksi_akhir_bulan"),
            ),
          );

          displayedMonths.forEach((m) =>
            tpData.push(getSum(productTemplates, m, "delta_terima")),
          );
          displayedMonths.forEach((m) =>
            tpData.push(getAvg(productTemplates, m, "pencapaian")),
          );

          displayedMonths.forEach((m) =>
            tpData.push(getSum(productTemplates, m, "rencana_pesan")),
          );
          displayedMonths.forEach((m) =>
            tpData.push(getAvg(productTemplates, m, "rencana_hop")),
          );

          tpData.push("-");

          displayedMonths.forEach((m) => tpData.push("-"));
          displayedMonths.forEach((m) => tpData.push("-"));
          wsData.push(tpData);
        });

        const tsData: any[] = [];
        tsData.push("");
        tsData.push(`TOTAL BBM ${upkName}`);
        for (let i = 0; i < 12; i++) tsData.push("");

        displayedMonths.forEach((m) => {
          tsData.push(getSum(siteTemplates, m, "stock"));
          tsData.push(getAvg(siteTemplates, m, "keterisian_tanki"));
          tsData.push(getAvg(siteTemplates, m, "hop"));
          tsData.push("-");
        });

        displayedMonths.forEach((m) =>
          tsData.push(getSum(siteTemplates, m, "terima")),
        );
        displayedMonths.forEach((m) =>
          tsData.push(getSum(siteTemplates, m, "pemakaian")),
        );
        displayedMonths.forEach((m) =>
          tsData.push(getSum(siteTemplates, m, "stock_akhir_bulan")),
        );
        displayedMonths.forEach((m) =>
          tsData.push(getAvg(siteTemplates, m, "shop_akhir_bulan")),
        );

        displayedMonths.forEach((m) =>
          tsData.push(getSum(siteTemplates, m, "renominasi_pesan")),
        );
        displayedMonths.forEach((m) =>
          tsData.push(
            getAvg(siteTemplates, m, "renominaso_proyeksi_akhir_bulan"),
          ),
        );

        displayedMonths.forEach((m) =>
          tsData.push(getSum(siteTemplates, m, "delta_terima")),
        );
        displayedMonths.forEach((m) =>
          tsData.push(getAvg(siteTemplates, m, "pencapaian")),
        );

        displayedMonths.forEach((m) =>
          tsData.push(getSum(siteTemplates, m, "rencana_pesan")),
        );
        displayedMonths.forEach((m) =>
          tsData.push(getAvg(siteTemplates, m, "rencana_hop")),
        );

        tsData.push("-");

        displayedMonths.forEach((m) => tsData.push("-"));
        displayedMonths.forEach((m) => tsData.push("-"));
        wsData.push(tsData);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      const merges = [];
      merges.push({ s: { r: 0, c: 0 }, e: { r: 2, c: 0 } });
      merges.push({ s: { r: 0, c: 1 }, e: { r: 2, c: 1 } });
      merges.push({ s: { r: 0, c: 2 }, e: { r: 2, c: 2 } });
      merges.push({ s: { r: 0, c: 3 }, e: { r: 2, c: 3 } });
      merges.push({ s: { r: 0, c: 4 }, e: { r: 2, c: 4 } });
      merges.push({ s: { r: 0, c: 5 }, e: { r: 2, c: 5 } });
      merges.push({ s: { r: 0, c: 6 }, e: { r: 0, c: 8 } });
      merges.push({ s: { r: 0, c: 9 }, e: { r: 0, c: 12 } });
      merges.push({ s: { r: 0, c: 13 }, e: { r: 2, c: 13 } });
      if (merges.length > 0) ws["!merges"] = merges;

      const safeSheetName = unit.substring(0, 31).replace(/[\\/*?:\[\]]/g, "");
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName || "Kertas Kerja");
    });

    const today = new Date().toISOString().split("T")[0];
    const regionName = selectedRegion
      ? selectedRegion.replace(/\s+/g, "_")
      : "All_Region";
    XLSX.writeFile(wb, `Kertas_Kerja_BBM_${regionName}_${today}.xlsx`);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a1",
    });
    let isFirst = true;
    const unitsToExport =
      availableUnits.length > 0 ? availableUnits : ["Kertas Kerja"];

    unitsToExport.forEach((unit) => {
      const templatesForUnit =
        availableUnits.length > 0
          ? filteredTemplates.filter((t) => t.unit_name === unit)
          : filteredTemplates;

      if (templatesForUnit.length === 0) return;

      const numMonths = displayedMonths.length;
      const wsData: any[][] = [];

      const row1: any[] = [
        { content: "No.", rowSpan: 3 },
        { content: "UNIT PELAKSANA", rowSpan: 3 },
        { content: "JENIS KIT", rowSpan: 3 },
        { content: "PEMBANGKIT", rowSpan: 3 },
        { content: "JENIS BBM", rowSpan: 3 },
        { content: "MODA ANGKUTAN", rowSpan: 3 },
        { content: "TBBM", rowSpan: 3 },
        { content: "JARAK (km)", rowSpan: 3 },
        { content: "Estimasi Pengiriman", rowSpan: 3 },
        { content: "TANGKI TIMBUN", rowSpan: 3 },
        { content: "PEMAKAIAN RATA2 BULAN-1", rowSpan: 3 },
        { content: "FREIGHT COST (Rp)", rowSpan: 3 },
        { content: "HOP (Hari)", rowSpan: 3 },
        { content: "HOP MINIMUM", rowSpan: 3 },
      ];
      displayedMonths.forEach((m) => {
        row1.push({ content: `STOK ${m} (kL)`, rowSpan: 3 });
        row1.push({ content: `KETERISIAN TANGKI (%)`, rowSpan: 3 });
        row1.push({ content: `HOP ${m} (Hari)`, rowSpan: 3 });
        row1.push({ content: `KETERANGAN HOP < HOP MIN`, rowSpan: 3 });
      });
      row1.push({
        content: "REALISASI (SAP)",
        colSpan: 4 * numMonths,
        styles: { halign: "center", fillColor: [0, 150, 136] },
      });
      row1.push({
        content: "RENOMINASI/KONFIRMASI",
        colSpan: 2 * numMonths,
        styles: { halign: "center", fillColor: [63, 81, 181] },
      });
      row1.push({
        content: "DELTA (REAL - KONF)",
        colSpan: 2 * numMonths,
        styles: { halign: "center", fillColor: [244, 67, 54] },
      });
      row1.push({
        content: "NOMINASI",
        colSpan: 2 * numMonths,
        styles: { halign: "center", fillColor: [3, 169, 244] },
      });
      row1.push({ content: "POLA OPERASI", rowSpan: 3 });
      row1.push({
        content: "KETERANGAN",
        colSpan: 2 * numMonths,
        styles: { halign: "center" },
      });
      wsData.push(row1);

      const row2: any[] = [];
      displayedMonths.forEach(() => {
        row2.push("", "", "", "");
      });
      row2.push({
        content: "TERIMA (kL)",
        colSpan: numMonths,
        styles: { halign: "center", fillColor: [0, 150, 136] },
      });
      row2.push({
        content: "PEMAKAIAN (kL)",
        colSpan: numMonths,
        styles: { halign: "center", fillColor: [0, 150, 136] },
      });
      row2.push({
        content: "STOK AKHIR BULAN (kL)",
        colSpan: numMonths,
        styles: { halign: "center", fillColor: [0, 150, 136] },
      });
      row2.push({
        content: "SHOP AKHIR BULAN (Hari)",
        colSpan: numMonths,
        styles: { halign: "center", fillColor: [0, 150, 136] },
      });
      row2.push({
        content: "PESAN (kL)",
        colSpan: numMonths,
        styles: { halign: "center", fillColor: [63, 81, 181] },
      });
      row2.push({
        content: "PROYEKSI SHOP AKHIR BULAN (Hari)",
        colSpan: numMonths,
        styles: { halign: "center", fillColor: [63, 81, 181] },
      });
      row2.push({
        content: "DELTA TERIMA (kL)",
        colSpan: numMonths,
        styles: { halign: "center", fillColor: [244, 67, 54] },
      });
      row2.push({
        content: "PENCAPAIAN (%)",
        colSpan: numMonths,
        styles: { halign: "center", fillColor: [244, 67, 54] },
      });
      row2.push({
        content: "PESAN (kL)",
        colSpan: numMonths,
        styles: { halign: "center", fillColor: [3, 169, 244] },
      });
      row2.push({
        content: "HOP (Hari)",
        colSpan: numMonths,
        styles: { halign: "center", fillColor: [3, 169, 244] },
      });
      row2.push({
        content: "KETERANGAN",
        colSpan: numMonths,
        styles: { halign: "center" },
      });
      row2.push({
        content: "DETAIL KETERANGAN",
        colSpan: numMonths,
        styles: { halign: "center" },
      });
      wsData.push(row2);

      const row3: any[] = [];
      displayedMonths.forEach(() => {
        row3.push("", "", "", "");
      });
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      displayedMonths.forEach((m) =>
        row3.push({
          content: m,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            textColor: [0, 0, 0],
          },
        }),
      );
      wsData.push(row3);

      let excelIdx = 0;
      const bodyData: any[][] = [];

      Object.entries(
        templatesForUnit.reduce(
          (acc, t) => {
            const site = t.upk_name || "Unknown UPK";
            if (!acc[site]) acc[site] = [];
            acc[site].push(t);
            return acc;
          },
          {} as Record<string, typeof templatesForUnit>,
        ),
      ).forEach(([upkName, siteTemplates]) => {
        const getSum = (
          arr: any[],
          m: string,
          field: keyof RecordKertasKerja,
        ) => {
          const sum = arr.reduce(
            (s, t) => s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0),
            0,
          );
          return sum === 0 ? "-" : sum;
        };

        const getAvg = (
          arr: any[],
          m: string,
          field: keyof RecordKertasKerja,
        ) => {
          const sum = arr.reduce(
            (s, t) => s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0),
            0,
          );
          if (arr.length === 0 || sum === 0) return "-";
          const average = sum / arr.length;
          return isKertasKerjaDayField(field)
            ? Math.round(average)
            : Number(average.toFixed(2));
        };

        const productsInSite = Array.from(
          new Set(
            siteTemplates.map((t) => t.product_name || "Unknown Product"),
          ),
        );

        productsInSite.forEach((product) => {
          const productTemplates = siteTemplates.filter(
            (t) => (t.product_name || "Unknown Product") === product,
          );

          productTemplates.forEach((template) => {
            excelIdx++;
            const trData: any[] = [];
            trData.push(excelIdx);
            trData.push(template.upk_name || "-");
            trData.push(template.kit_name || "-");
            trData.push(template.site_name || "-");
            trData.push(template.product_name || "-");
            trData.push(template.moda_name || "-");

            trData.push(template.supplier_name || "-");
            trData.push(template.distance ?? "-");
            trData.push(template.estimated_delivery_time ?? "-");

            trData.push(template.site_capacity ?? "-");
            trData.push(template.average_usage ?? "-");
            trData.push(template.freight_costs ?? "-");
            const calcHop =
              template.site_capacity && template.average_usage
                ? Math.round(template.site_capacity / template.average_usage)
                : "-";
            trData.push(calcHop);
            trData.push(roundKertasKerjaDayValue(template.hop_minimum) ?? "-");

            displayedMonths.forEach((m) => {
              const rec = localRecords[`${template.id}_${m}`];
              trData.push(rec?.stock ?? "-");
              const calcKet =
                rec?.stock && template.site_capacity
                  ? (
                      (Number(rec.stock) / template.site_capacity) *
                      100
                    ).toFixed(2)
                  : "-";
              trData.push(calcKet);
              trData.push(rec?.hop ?? "-");
              trData.push(rec?.keterangan_hop_less_than_5 ?? "-");
            });

            displayedMonths.forEach((m) =>
              trData.push(localRecords[`${template.id}_${m}`]?.terima ?? "-"),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.pemakaian ?? "-",
              ),
            );

            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.stock_akhir_bulan ?? "-",
              ),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.shop_akhir_bulan ?? "-",
              ),
            );

            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.renominasi_pesan ?? "-",
              ),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]
                  ?.renominaso_proyeksi_akhir_bulan ?? "-",
              ),
            );

            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.delta_terima ?? "-",
              ),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.pencapaian ?? "-",
              ),
            );

            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.rencana_pesan ?? "-",
              ),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.rencana_hop ?? "-",
              ),
            );

            const polaId =
              localRecords[`${template.id}_${displayedMonths[0]}`]
                ?.master_pola_id;
            const polaName =
              polaOperasiList.find((p) => p.id === polaId)?.name || "-";
            trData.push(polaName);

            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.keterangan ?? "-",
              ),
            );
            displayedMonths.forEach((m) =>
              trData.push(
                localRecords[`${template.id}_${m}`]?.detail_keterangan ?? "-",
              ),
            );

            bodyData.push(trData);
          });

          const tsData: any[] = [];
          tsData.push({
            content: "TOTAL S.D",
            colSpan: 2,
            styles: { halign: "center", fontStyle: "bold" },
          });
          tsData.push(upkName || "-");
          tsData.push("", product, "", "", "", "", "");

          const sumCap = siteTemplates.reduce(
            (s, t) => s + (t.site_capacity || 0),
            0,
          );
          const sumUsage = siteTemplates.reduce(
            (s, t) => s + (t.average_usage || 0),
            0,
          );
          tsData.push(sumCap > 0 ? sumCap : "-");
          tsData.push(sumUsage > 0 ? sumUsage : "-");
          tsData.push("-");
          tsData.push(
            sumCap > 0 && sumUsage > 0 ? Math.round(sumCap / sumUsage) : "-",
          );
          tsData.push("-");

          displayedMonths.forEach((m) => {
            const sStok = getSum(productTemplates, m, "stock");
            tsData.push(sStok);
            const calcKet =
              sStok !== "-" && sumCap > 0
                ? ((Number(sStok) / sumCap) * 100).toFixed(2)
                : "-";
            tsData.push(calcKet);
            tsData.push(getAvg(productTemplates, m, "hop"));
            tsData.push("-");
          });

          displayedMonths.forEach((m) =>
            tsData.push(getSum(productTemplates, m, "terima")),
          );
          displayedMonths.forEach((m) =>
            tsData.push(getSum(productTemplates, m, "pemakaian")),
          );
          displayedMonths.forEach((m) =>
            tsData.push(getSum(productTemplates, m, "stock_akhir_bulan")),
          );
          displayedMonths.forEach((m) =>
            tsData.push(getAvg(productTemplates, m, "shop_akhir_bulan")),
          );
          displayedMonths.forEach((m) =>
            tsData.push(getSum(productTemplates, m, "renominasi_pesan")),
          );
          displayedMonths.forEach((m) =>
            tsData.push(
              getAvg(productTemplates, m, "renominaso_proyeksi_akhir_bulan"),
            ),
          );
          displayedMonths.forEach((m) =>
            tsData.push(getSum(productTemplates, m, "delta_terima")),
          );
          displayedMonths.forEach((m) =>
            tsData.push(getAvg(productTemplates, m, "pencapaian")),
          );
          displayedMonths.forEach((m) =>
            tsData.push(getSum(productTemplates, m, "rencana_pesan")),
          );
          displayedMonths.forEach((m) =>
            tsData.push(getAvg(productTemplates, m, "rencana_hop")),
          );

          tsData.push("-");

          displayedMonths.forEach((m) => tsData.push("-"));
          displayedMonths.forEach((m) => tsData.push("-"));
          bodyData.push(tsData);
        });

        const totData: any[] = [];
        totData.push({
          content: "TOTAL",
          colSpan: 2,
          styles: { halign: "center", fontStyle: "bold" },
        });
        totData.push(upkName || "-", "", "", "", "", "", "", "");

        const sumCap = siteTemplates.reduce(
          (s, t) => s + (t.site_capacity || 0),
          0,
        );
        const sumUsage = siteTemplates.reduce(
          (s, t) => s + (t.average_usage || 0),
          0,
        );
        totData.push(sumCap > 0 ? sumCap : "-");
        totData.push(sumUsage > 0 ? sumUsage : "-");
        totData.push("-");
        totData.push(
          sumCap > 0 && sumUsage > 0 ? Math.round(sumCap / sumUsage) : "-",
        );
        totData.push("-");

        displayedMonths.forEach((m) => {
          const sStok = getSum(siteTemplates, m, "stock");
          totData.push(sStok);
          const calcKet =
            sStok !== "-" && sumCap > 0
              ? ((Number(sStok) / sumCap) * 100).toFixed(2)
              : "-";
          totData.push(calcKet);
          totData.push(getAvg(siteTemplates, m, "hop"));
          totData.push("-");
        });

        displayedMonths.forEach((m) =>
          totData.push(getSum(siteTemplates, m, "terima")),
        );
        displayedMonths.forEach((m) =>
          totData.push(getSum(siteTemplates, m, "pemakaian")),
        );
        displayedMonths.forEach((m) =>
          totData.push(getSum(siteTemplates, m, "stock_akhir_bulan")),
        );
        displayedMonths.forEach((m) =>
          totData.push(getAvg(siteTemplates, m, "shop_akhir_bulan")),
        );
        displayedMonths.forEach((m) =>
          totData.push(getSum(siteTemplates, m, "renominasi_pesan")),
        );
        displayedMonths.forEach((m) =>
          totData.push(
            getAvg(siteTemplates, m, "renominaso_proyeksi_akhir_bulan"),
          ),
        );
        displayedMonths.forEach((m) =>
          totData.push(getSum(siteTemplates, m, "delta_terima")),
        );
        displayedMonths.forEach((m) =>
          totData.push(getAvg(siteTemplates, m, "pencapaian")),
        );
        displayedMonths.forEach((m) =>
          totData.push(getSum(siteTemplates, m, "rencana_pesan")),
        );
        displayedMonths.forEach((m) =>
          totData.push(getAvg(siteTemplates, m, "rencana_hop")),
        );

        totData.push("-");

        displayedMonths.forEach((m) => totData.push("-"));
        displayedMonths.forEach((m) => totData.push("-"));
        bodyData.push(totData);
      });

      if (!isFirst) doc.addPage();
      isFirst = false;

      doc.setFontSize(14);
      doc.text(`Kertas Kerja - Unit ${unit}`, 40, 40);

      autoTable(doc, {
        startY: 50,
        head: [wsData[0], wsData[1], wsData[2]],
        body: bodyData,
        theme: "grid",
        styles: {
          fontSize: 5,
          cellPadding: 2,
          halign: "center",
          textColor: [50, 50, 50],
        },
        headStyles: { textColor: 255, fontStyle: "bold" },
        margin: { top: 50, left: 20, right: 20 },
      });
    });

    const today = new Date().toISOString().split("T")[0];
    const regionName = selectedRegion
      ? selectedRegion.replace(/\s+/g, "_")
      : "All_Region";
    doc.save(`Kertas_Kerja_BBM_${regionName}_${today}.pdf`);
  };
  let globalIdx = 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col w-full h-full min-h-0 shadow-sm">
      <div className="p-3 border-b border-slate-100 bg-gradient-to-r from-primary to-primary-dark flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-sm">
        <div className="flex flex-col gap-1.5 bg-white/10 rounded p-2 border border-white/20">
          <span className="text-white text-xs font-bold leading-none">
            Keterangan:
          </span>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3 bg-red-500 border border-black/10 rounded-sm"></div>
              <span className="text-white text-xs font-medium">
                : HOP &le;5 Hari
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3 bg-yellow-300 border border-black/10 rounded-sm"></div>
              <span className="text-white text-xs font-medium">
                : HOP &gt;5 - 10 Hari
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3 bg-green-500 border border-black/10 rounded-sm"></div>
              <span className="text-white text-xs font-medium">
                : HOP &gt;10 Hari
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div
            role="status"
            aria-live="polite"
            title={
              canUpdate
                ? "Auto-save 3 detik setelah edit; auto-refresh setiap 5 detik saat tabel tidak sedang digunakan"
                : "Seluruh data hanya dapat dilihat karena Anda tidak memiliki hak UPDATE"
            }
            className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold shadow-sm ${
              !canUpdate
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : !isOnline || autoSyncStatus === "offline"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : autoSyncStatus === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : autoSyncStatus === "saved"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-white/30 bg-white/15 text-white"
            }`}
          >
            {!canUpdate ? (
              <Lock size={15} aria-hidden="true" />
            ) : !isOnline || autoSyncStatus === "offline" ? (
              <CloudOff size={15} aria-hidden="true" />
            ) : autoSyncStatus === "saving" ||
              autoSyncStatus === "refreshing" ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : autoSyncStatus === "pending" ? (
              <Clock3 size={15} aria-hidden="true" />
            ) : autoSyncStatus === "error" ? (
              <AlertCircle size={15} aria-hidden="true" />
            ) : autoSyncStatus === "saved" ? (
              <CheckCircle2 size={15} aria-hidden="true" />
            ) : (
              <Cloud size={15} aria-hidden="true" />
            )}
            {autoSyncLabel}
          </div>
          <div className="relative order-last" ref={actionsMenuRef}>
            <button
              type="button"
              onClick={() => setIsActionsMenuOpen((isOpen) => !isOpen)}
              aria-expanded={isActionsMenuOpen}
              aria-haspopup="menu"
              aria-label="Buka menu lainnya"
              className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <MoreVertical size={17} aria-hidden="true" />
              Lainnya
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`transition-transform ${isActionsMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isActionsMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowInactive((isVisible) => !isVisible);
                    setIsActionsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  {showInactive ? (
                    <EyeOff size={17} className="text-gray-500" />
                  ) : (
                    <Eye size={17} className="text-gray-500" />
                  )}
                  {showInactive
                    ? "Sembunyikan Non-Aktif"
                    : "Tampilkan Non-Aktif"}
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    handleExportPdf();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50"
                >
                  <FileText size={17} aria-hidden="true" />
                  Export PDF
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsActionsMenuOpen(false);
                    handleExportExcel();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
                >
                  <Download size={17} aria-hidden="true" />
                  Export Excel
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={
              upsertMutation.isPending || isLoading || !isDirty || !canUpdate
            }
            className={`flex items-center gap-2 px-4 py-2 text-sm bg-white rounded-md transition-colors shadow-sm font-bold ${!canUpdate ? "hidden" : "text-primary hover:bg-slate-50 disabled:opacity-70"}`}
          >
            {upsertMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Save size={16} />
            )}
            {upsertMutation.isPending
              ? "Menyimpan..."
              : isDirty
                ? "Simpan Perubahan*"
                : "Simpan Perubahan"}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing || upsertMutation.isPending}
            title={refreshError || "Muat ulang data tabel dari server"}
            aria-label="Refresh data tabel"
            className={`flex items-center gap-2 px-4 py-2 text-sm bg-white hover:bg-slate-50 rounded-md transition-colors shadow-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70 ${refreshError ? "text-red-600" : "text-primary"}`}
          >
            {isRefreshing ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw size={16} aria-hidden="true" />
            )}
            {isRefreshing
              ? "Memuat..."
              : refreshError
                ? "Coba Lagi"
                : "Refresh Data"}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white text-primary hover:bg-slate-50 rounded-md transition-colors shadow-sm font-semibold"
          >
            {isExpanded ? (
              <>
                <Minimize2 size={16} /> Ciutkan Bulan
              </>
            ) : (
              <>
                <Maximize2 size={16} /> Tampilkan Semua Bulan
              </>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-auto custom-scrollbar flex-1 w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : null}
        <table
          ref={tableRef}
          className="w-full border-collapse text-xs text-center min-w-max"
          onKeyDown={handleTableEnterNavigation}
          aria-readonly={!canUpdate}
        >
          <thead className="sticky top-0 z-30 shadow-sm">
            {/* Row 1 */}
            <tr className="bg-slate-50 text-slate-700">
              <th
                className="border border-slate-200 p-2 font-bold sticky left-0 z-40 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase text-[10px] w-[40px] min-w-[40px] max-w-[40px]"
                rowSpan={3}
              >
                NO.
              </th>
              <th
                className="border border-slate-200 p-2 font-bold sticky left-[40px] z-40 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase text-[10px] w-[150px] min-w-[150px] max-w-[150px]"
                rowSpan={3}
              >
                UNIT PELAKSANA
              </th>
              <th
                className="border border-slate-200 p-2 font-bold sticky left-[190px] z-40 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase text-[10px] w-[90px] min-w-[90px] max-w-[90px]"
                rowSpan={3}
              >
                JENIS KIT
              </th>
              <th
                className="border border-slate-200 p-2 font-bold sticky left-[280px] z-40 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase text-[10px] w-[180px] min-w-[180px] max-w-[180px]"
                rowSpan={3}
              >
                PEMBANGKIT
              </th>
              <th
                className="border border-slate-200 p-2 font-bold uppercase text-[10px]"
                rowSpan={3}
              >
                JENIS BBM
              </th>
              <th
                className="border border-slate-200 p-2 font-bold uppercase text-[10px]"
                rowSpan={3}
              >
                MODA ANGKUTAN
              </th>
              <th
                className="border border-slate-200 p-2 font-bold uppercase text-[10px] bg-slate-100"
                colSpan={3}
              >
                TBBM
              </th>
              <th
                className="border border-slate-200 p-2 font-bold uppercase text-[10px] bg-slate-100"
                colSpan={4}
              >
                TANGKI TIMBUN
              </th>
              <th
                className="border border-slate-200 p-2 font-bold uppercase text-[10px]"
                rowSpan={3}
              >
                HOP MINIMUM
              </th>

              {/* Group column per month (Stok, Keterisian, dsb) */}
              {displayedMonths.map((month, i) => (
                <React.Fragment key={`group-1-${i}`}>
                  <th
                    className="border border-slate-300 dark:border-slate-600 p-2 font-extrabold bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border-t-2 border-t-amber-500 uppercase text-[10px]"
                    rowSpan={3}
                  >
                    STOK
                    <br />
                    {month}
                    <br />
                    (kL)
                  </th>
                  <th
                    className="border border-slate-300 dark:border-slate-600 p-2 font-extrabold bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border-t-2 border-t-amber-500 uppercase text-[10px]"
                    rowSpan={3}
                  >
                    KETERISIAN TANGKI
                    <br />
                    (%)
                  </th>
                  <th
                    className="border border-slate-300 dark:border-slate-600 p-2 font-extrabold bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border-t-2 border-t-amber-500 uppercase text-[10px]"
                    rowSpan={3}
                  >
                    HOP
                    <br />
                    {month}
                    <br />
                    (Hari)
                  </th>
                  <th
                    className="border border-slate-300 dark:border-slate-600 p-2 font-extrabold bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border-t-2 border-t-amber-500 uppercase text-[10px]"
                    rowSpan={3}
                  >
                    KETERANGAN
                    <br />
                    HOP &lt; HOP MIN
                  </th>
                </React.Fragment>
              ))}

              <th
                className="border border-slate-300 dark:border-slate-600 p-2 font-extrabold bg-teal-100 text-teal-950 dark:bg-teal-950 dark:text-teal-200 border-t-2 border-t-teal-500 uppercase text-[10px]"
                colSpan={4 * numMonths}
              >
                REALISASI (SAP)
              </th>
              <th
                className="border border-slate-300 dark:border-slate-600 p-2 font-extrabold bg-indigo-100 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-200 border-t-2 border-t-indigo-500 uppercase text-[10px]"
                colSpan={2 * numMonths}
              >
                RENOMINASI/KONFIRMASI
              </th>
              <th
                className="border border-slate-300 dark:border-slate-600 p-2 font-extrabold bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-200 border-t-2 border-t-rose-500 uppercase text-[10px]"
                colSpan={2 * numMonths}
              >
                DELTA (REAL - KONF)
              </th>
              <th
                className="border border-slate-300 dark:border-slate-600 p-2 font-extrabold bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-200 border-t-2 border-t-sky-500 uppercase text-[10px]"
                colSpan={2 * numMonths}
              >
                NOMINASI
              </th>
              <th
                className="border border-slate-200 p-2 font-bold uppercase text-[10px]"
                rowSpan={3}
              >
                POLA OPERASI
              </th>
              <th
                className="border border-slate-200 p-2 font-bold uppercase text-[10px]"
                colSpan={2 * numMonths}
              >
                KETERANGAN
              </th>
            </tr>

            {/* Row 2 */}
            <tr className="bg-slate-50 text-slate-700 uppercase text-[10px]">
              {/* TBBM Children */}
              <th
                className="border border-slate-200 p-2 font-bold bg-slate-100"
                rowSpan={2}
              >
                NAMA
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-slate-100"
                rowSpan={2}
              >
                JARAK
                <br />
                (km)
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-slate-100"
                colSpan={1}
              >
                Estimasi Pengiriman
              </th>
              {/* Tangki Timbun Children */}
              <th
                className="border border-slate-200 p-2 font-bold bg-slate-100"
                rowSpan={2}
              >
                KAP.
                <br />
                (kL)
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-slate-100"
                rowSpan={2}
              >
                PEMAKAIAN RATA2
                <br />
                BULAN-1
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-slate-100"
                rowSpan={2}
              >
                FREIGHT COST
                <br />
                (Rp)
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-slate-100"
                rowSpan={2}
              >
                HOP
                <br />
                (Hari)
              </th>

              {/* Realisasi Children */}
              <th
                className="border border-slate-200 p-2 font-bold bg-teal-50/50 text-teal-800"
                colSpan={numMonths}
              >
                TERIMA (kL)
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-teal-50/50 text-teal-800"
                colSpan={numMonths}
              >
                PEMAKAIAN (kL)
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-teal-50/50 text-teal-800"
                colSpan={numMonths}
              >
                STOK AKHIR BULAN (kL)
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-teal-50/50 text-teal-800"
                colSpan={numMonths}
              >
                SHOP AKHIR BULAN (Hari)
              </th>

              {/* Renominasi Children */}
              <th
                className="border border-slate-200 p-2 font-bold bg-indigo-50/50 text-indigo-800"
                colSpan={numMonths}
              >
                PESAN (kL)
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-indigo-50/50 text-indigo-800"
                colSpan={numMonths}
              >
                PROYEKSI SHOP AKHIR BULAN (Hari)
              </th>

              {/* Delta Children */}
              <th
                className="border border-slate-200 p-2 font-bold bg-rose-50/50 text-rose-800"
                colSpan={numMonths}
              >
                DELTA TERIMA (kL)
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-rose-50/50 text-rose-800"
                colSpan={numMonths}
              >
                PENCAPAIAN (%)
              </th>

              {/* Rencana Children */}
              <th
                className="border border-slate-200 p-2 font-bold bg-sky-50/50 text-sky-800"
                colSpan={numMonths}
              >
                PESAN (kL)
              </th>
              <th
                className="border border-slate-200 p-2 font-bold bg-sky-50/50 text-sky-800"
                colSpan={numMonths}
              >
                HOP (Hari)
              </th>

              {/* Keterangan Children */}
              <th
                className="border border-slate-200 p-2 font-bold"
                colSpan={numMonths}
              >
                KETERANGAN
              </th>
              <th
                className="border border-slate-200 p-2 font-bold"
                colSpan={numMonths}
              >
                DETAIL KETERANGAN
              </th>
            </tr>

            {/* Row 3 */}
            <tr className="bg-slate-50 text-slate-600 uppercase text-[9px]">
              {/* TBBM Hari */}
              <th className="border border-slate-200 p-1 font-semibold bg-slate-100">
                Hari
              </th>

              {/* Realisasi Months */}
              {displayedMonths.map((m, i) => (
                <th
                  key={`r-t-${i}`}
                  className="border border-slate-200 p-1 bg-teal-50/30 text-teal-700"
                >
                  {m}
                </th>
              ))}
              {displayedMonths.map((m, i) => (
                <th
                  key={`r-p-${i}`}
                  className="border border-slate-200 p-1 bg-teal-50/30 text-teal-700"
                >
                  {m}
                </th>
              ))}
              {displayedMonths.map((m, i) => (
                <th
                  key={`r-sa-${i}`}
                  className="border border-slate-200 p-1 bg-teal-50/30 text-teal-700"
                >
                  {m}
                </th>
              ))}
              {displayedMonths.map((m, i) => (
                <th
                  key={`r-sh-${i}`}
                  className="border border-slate-200 p-1 bg-teal-50/30 text-teal-700"
                >
                  {m}
                </th>
              ))}

              {/* Renominasi Months */}
              {displayedMonths.map((m, i) => (
                <th
                  key={`rn-p-${i}`}
                  className="border border-slate-200 p-1 bg-indigo-50/30 text-indigo-700"
                >
                  {m}
                </th>
              ))}
              {displayedMonths.map((m, i) => (
                <th
                  key={`rn-pr-${i}`}
                  className="border border-slate-200 p-1 bg-indigo-50/30 text-indigo-700"
                >
                  {m}
                </th>
              ))}

              {/* Delta Months */}
              {displayedMonths.map((m, i) => (
                <th
                  key={`d-t-${i}`}
                  className="border border-slate-200 p-1 bg-rose-50/30 text-rose-700"
                >
                  {m}
                </th>
              ))}
              {displayedMonths.map((m, i) => (
                <th
                  key={`d-p-${i}`}
                  className="border border-slate-200 p-1 bg-rose-50/30 text-rose-700"
                >
                  {m}
                </th>
              ))}

              {/* Rencana Months */}
              {displayedMonths.map((m, i) => (
                <th
                  key={`rc-p-${i}`}
                  className="border border-slate-200 p-1 bg-sky-50/30 text-sky-700"
                >
                  {m}
                </th>
              ))}
              {displayedMonths.map((m, i) => (
                <th
                  key={`rc-h-${i}`}
                  className="border border-slate-200 p-1 bg-sky-50/30 text-sky-700"
                >
                  {m}
                </th>
              ))}

              {/* Keterangan Months */}
              {displayedMonths.map((m, i) => (
                <th key={`k-k-${i}`} className="border border-slate-200 p-1">
                  {m}
                </th>
              ))}
              {displayedMonths.map((m, i) => (
                <th key={`k-d-${i}`} className="border border-slate-200 p-1">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {Object.entries(
              displayedTemplates.reduce(
                (acc, t) => {
                  const site = t.upk_name || "Unknown UPK";
                  if (!acc[site]) acc[site] = [];
                  acc[site].push(t);
                  return acc;
                },
                {} as Record<string, typeof displayedTemplates>,
              ),
            ).map(([upkName, siteTemplates]) => {
              const productsInSite = Array.from(
                new Set(
                  siteTemplates.map((t) => t.product_name || "Unknown Product"),
                ),
              );

              const getSum = (
                arr: typeof displayedTemplates,
                m: string,
                field: keyof RecordKertasKerja,
              ) => {
                const sum = arr.reduce(
                  (s, t) =>
                    s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0),
                  0,
                );
                return sum === 0 ? "-" : sum;
              };

              const getAvg = (
                arr: typeof displayedTemplates,
                m: string,
                field: keyof RecordKertasKerja,
              ) => {
                const sum = arr.reduce(
                  (s, t) =>
                    s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0),
                  0,
                );
                if (arr.length === 0 || sum === 0) return "-";
                const average = sum / arr.length;
                return isKertasKerjaDayField(field)
                  ? Math.round(average)
                  : Number(average.toFixed(2));
              };

              return (
                <React.Fragment key={`group-${upkName}`}>
                  {siteTemplates.map((template, idx) => {
                    globalIdx++;
                    const rowSurface =
                      template.is_active === false
                        ? "bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/70"
                        : idx % 2 === 0
                          ? "bg-[#ffffff] dark:bg-[#111827] hover:bg-[#e2e8f0] dark:hover:bg-[#25334a]"
                          : "bg-[#f1f5f9] dark:bg-[#1b2638] hover:bg-[#e2e8f0] dark:hover:bg-[#25334a]";
                    const stickySurface =
                      template.is_active === false
                        ? "bg-amber-100 dark:bg-amber-950"
                        : idx % 2 === 0
                          ? "bg-[#ffffff] dark:bg-[#111827]"
                          : "bg-[#f1f5f9] dark:bg-[#1b2638]";

                    return (
                      <tr
                        key={template.id}
                        className={`border-b border-slate-300 dark:border-slate-600 transition-colors ${rowSurface}`}
                      >
                        <td
                          className={`border-r border-slate-300 dark:border-slate-600 p-1 sticky left-0 z-10 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.18)] ${stickySurface}`}
                        >
                          <InputCell
                            defaultValue={globalIdx}
                            readOnly
                            className="text-center font-semibold"
                          />
                        </td>
                        <td
                          className={`border-r border-slate-300 dark:border-slate-600 p-1 sticky left-[40px] z-10 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.18)] ${stickySurface}`}
                        >
                          <InputCell
                            defaultValue={template.upk_name || "-"}
                            readOnly
                            className="text-left font-semibold"
                          />
                        </td>
                        <td
                          className={`border-r border-slate-300 dark:border-slate-600 p-1 sticky left-[190px] z-10 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.18)] ${stickySurface}`}
                        >
                          <InputCell
                            defaultValue={template.kit_name || "-"}
                            readOnly
                            className="text-left"
                          />
                        </td>
                        <td
                          className={`border-r border-slate-300 dark:border-slate-600 p-1 sticky left-[280px] z-10 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.18)] ${stickySurface}`}
                        >
                          <InputCell
                            defaultValue={template.site_name || "-"}
                            readOnly
                            className="text-left font-semibold text-slate-800"
                          />
                        </td>
                        <td className="border-r border-slate-200 p-1">
                          <InputCell
                            defaultValue={template.product_name || "-"}
                            readOnly
                            className="text-center w-[80px]"
                          />
                        </td>
                        <td className="border border-gray-200 p-1">
                          <InputCell
                            defaultValue={template.moda_name || "-"}
                            readOnly
                            className="text-center w-[80px]"
                          />
                        </td>

                        <td className="border border-gray-200 p-1">
                          <InputCell
                            defaultValue={template.supplier_name || "-"}
                            readOnly
                            className="text-left w-[150px]"
                          />
                        </td>
                        <td className="border border-gray-200 p-1">
                          <InputCell
                            defaultValue={template.distance}
                            readOnly
                            className="text-center"
                          />
                        </td>
                        <td className="border border-gray-200 p-1">
                          <InputCell
                            defaultValue={template.estimated_delivery_time}
                            readOnly
                            className="text-center"
                          />
                        </td>

                        <td className="border border-gray-200 p-1">
                          <InputCell
                            defaultValue={template.site_capacity ?? "-"}
                            readOnly
                            className="text-right"
                          />
                        </td>
                        <td className="border border-gray-200 p-1">
                          <InputCell
                            defaultValue={template.average_usage ?? "-"}
                            readOnly
                            className="text-right"
                          />
                        </td>
                        <td className="border border-gray-200 p-1">
                          <InputCell
                            defaultValue={
                              template.freight_costs !== null &&
                              template.freight_costs !== undefined
                                ? new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                  }).format(template.freight_costs)
                                : "-"
                            }
                            readOnly
                            className="text-right"
                          />
                        </td>
                        <td className="border border-gray-200 p-1">
                          <InputCell
                            defaultValue={
                              template.site_capacity && template.average_usage
                                ? Math.round(
                                    template.site_capacity /
                                      template.average_usage,
                                  )
                                : "-"
                            }
                            readOnly
                            className="text-right text-gray-700"
                          />
                        </td>
                        <td
                          className={`border border-gray-200 p-1 ${template.is_active === false ? "" : "bg-green-50"}`}
                        >
                          <InputCell
                            defaultValue={roundKertasKerjaDayValue(
                              template.hop_minimum,
                            )}
                            readOnly
                            roundToInteger
                            className="text-center font-bold text-green-700 bg-transparent"
                          />
                        </td>

                        {displayedMonths.map((m) => {
                          const rec = localRecords[`${template.id}_${m}`];
                          return (
                            <React.Fragment key={`g1-${m}`}>
                              <td className="border border-gray-200 p-1 bg-amber-50/50 dark:bg-amber-950/20">
                                <InputCell
                                  defaultValue={rec?.stock}
                                  onBlur={(v) =>
                                    handleRecordChange(
                                      template.id,
                                      m,
                                      "stock",
                                      v,
                                    )
                                  }
                                  className="text-right"
                                />
                              </td>
                              <td className="border border-gray-200 p-1 bg-amber-50/50 dark:bg-amber-950/20">
                                <InputCell
                                  defaultValue={
                                    rec?.stock && template.site_capacity
                                      ? (
                                          (Number(rec.stock) /
                                            template.site_capacity) *
                                          100
                                        ).toFixed(2)
                                      : "-"
                                  }
                                  readOnly
                                  className="text-right text-gray-700"
                                />
                              </td>
                              <td className="border border-gray-200 p-1 bg-amber-50/50 dark:bg-amber-950/20">
                                <InputCell
                                  defaultValue={rec?.hop}
                                  onBlur={(v) =>
                                    handleRecordChange(template.id, m, "hop", v)
                                  }
                                  className="text-right"
                                  bgColorClass={getHopColor(rec?.hop)}
                                  roundToInteger
                                />
                              </td>
                              <td className="border border-gray-200 p-1 bg-amber-50/50 dark:bg-amber-950/20">
                                <InputCell
                                  defaultValue={rec?.keterangan_hop_less_than_5}
                                  valueType="text"
                                  onBlur={(v) =>
                                    handleRecordChange(
                                      template.id,
                                      m,
                                      "keterangan_hop_less_than_5",
                                      v,
                                    )
                                  }
                                />
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {displayedMonths.map((m) => (
                          <td
                            key={`r-t-${m}`}
                            className="border border-gray-200 p-1 bg-teal-50/50 dark:bg-teal-950/20"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]?.terima
                              }
                              onBlur={(v) =>
                                handleRecordChange(template.id, m, "terima", v)
                              }
                              className="text-right"
                            />
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`r-p-${m}`}
                            className="border border-gray-200 p-1 bg-teal-50/50 dark:bg-teal-950/20"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]?.pemakaian
                              }
                              onBlur={(v) =>
                                handleRecordChange(
                                  template.id,
                                  m,
                                  "pemakaian",
                                  v,
                                )
                              }
                              className="text-right"
                            />
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`r-s-${m}`}
                            className="border border-gray-200 p-1 bg-teal-50/50 dark:bg-teal-950/20"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]
                                  ?.stock_akhir_bulan
                              }
                              onBlur={(v) =>
                                handleRecordChange(
                                  template.id,
                                  m,
                                  "stock_akhir_bulan",
                                  v,
                                )
                              }
                              className="text-right"
                            />
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`r-sh-${m}`}
                            className="border border-gray-200 p-1 bg-teal-50/50 dark:bg-teal-950/20"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]
                                  ?.shop_akhir_bulan
                              }
                              onBlur={(v) =>
                                handleRecordChange(
                                  template.id,
                                  m,
                                  "shop_akhir_bulan",
                                  v,
                                )
                              }
                              className="text-right"
                              bgColorClass={getHopColor(
                                localRecords[`${template.id}_${m}`]
                                  ?.shop_akhir_bulan,
                              )}
                              roundToInteger
                            />
                          </td>
                        ))}

                        {displayedMonths.map((m) => (
                          <td
                            key={`rn-p-${m}`}
                            className="border border-gray-200 p-1 bg-indigo-50/50 dark:bg-indigo-950/20"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]
                                  ?.renominasi_pesan
                              }
                              onBlur={(v) =>
                                handleRecordChange(
                                  template.id,
                                  m,
                                  "renominasi_pesan",
                                  v,
                                )
                              }
                              className="text-right"
                            />
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`rn-pr-${m}`}
                            className="border border-gray-200 p-1 bg-indigo-50/50 dark:bg-indigo-950/20"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]
                                  ?.renominaso_proyeksi_akhir_bulan
                              }
                              onBlur={(v) =>
                                handleRecordChange(
                                  template.id,
                                  m,
                                  "renominaso_proyeksi_akhir_bulan",
                                  v,
                                )
                              }
                              className="text-right"
                              roundToInteger
                            />
                          </td>
                        ))}

                        {displayedMonths.map((m) => (
                          <td
                            key={`d-t-${m}`}
                            className="border border-gray-200 p-1 bg-rose-50/50 dark:bg-rose-950/20"
                            title="Otomatis: Realisasi Terima dikurangi Nominasi Pesan pada bulan yang sama"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]
                                  ?.delta_terima
                              }
                              readOnly
                              className="text-right font-semibold text-rose-700"
                            />
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`d-p-${m}`}
                            className="border border-gray-200 p-1 bg-rose-50/50 dark:bg-rose-950/20"
                            title="Otomatis: Realisasi Terima dibagi Nominasi Pesan pada bulan yang sama, dikali 100%"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]?.pencapaian
                              }
                              readOnly
                              className="text-right font-semibold text-rose-700"
                            />
                          </td>
                        ))}

                        {displayedMonths.map((m) => (
                          <td
                            key={`rc-p-${m}`}
                            className="border border-gray-200 p-1 bg-sky-50/50 dark:bg-sky-950/20"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]
                                  ?.rencana_pesan
                              }
                              onBlur={(v) =>
                                handleRecordChange(
                                  template.id,
                                  m,
                                  "rencana_pesan",
                                  v,
                                )
                              }
                              className="text-right"
                            />
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`rc-h-${m}`}
                            className="border border-gray-200 p-1 bg-sky-50/50 dark:bg-sky-950/20"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]?.rencana_hop
                              }
                              onBlur={(v) =>
                                handleRecordChange(
                                  template.id,
                                  m,
                                  "rencana_hop",
                                  v,
                                )
                              }
                              className="text-right"
                              bgColorClass={getHopColor(
                                localRecords[`${template.id}_${m}`]
                                  ?.rencana_hop,
                              )}
                              roundToInteger
                            />
                          </td>
                        ))}

                        <td className="border border-gray-200 p-1 text-center">
                          <select
                            aria-label={`Pola operasi ${template.site_name || template.id}`}
                            aria-disabled={!canUpdate}
                            className="w-full min-w-[100px] px-1 py-1 text-xs font-medium border border-transparent hover:border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary rounded outline-none transition-all bg-transparent focus:bg-white text-gray-900 disabled:cursor-default disabled:text-gray-700 disabled:hover:border-transparent"
                            value={
                              localRecords[
                                `${template.id}_${displayedMonths[0]}`
                              ]?.master_pola_id || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              displayedMonths.forEach((m) => {
                                handleRecordChange(
                                  template.id,
                                  m,
                                  "master_pola_id",
                                  val,
                                );
                              });
                            }}
                            disabled={!canUpdate}
                          >
                            <option value="">-</option>
                            {polaOperasiList.map((pola) => (
                              <option key={pola.id} value={pola.id}>
                                {pola.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {displayedMonths.map((m) => (
                          <td
                            key={`k-k-${m}`}
                            className="border border-gray-200 p-1"
                          >
                            <select
                              value={
                                localRecords[`${template.id}_${m}`]
                                  ?.keterangan || ""
                              }
                              onChange={(event) =>
                                handleRecordChange(
                                  template.id,
                                  m,
                                  "keterangan",
                                  event.target.value,
                                )
                              }
                              disabled={!canUpdate}
                              aria-disabled={!canUpdate}
                              aria-label={`Keterangan ${template.site_name || template.id} ${m}`}
                              className="w-full min-w-[150px] rounded border border-transparent bg-transparent px-1 py-1 text-left text-xs font-medium text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary disabled:cursor-default disabled:text-gray-700"
                            >
                              <option value="">-</option>
                              <option value="Keterbatasan BBM">
                                Keterbatasan BBM
                              </option>
                              <option value="Lainnya">Lainnya</option>
                            </select>
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`k-d-${m}`}
                            className="border border-gray-200 p-1"
                          >
                            <InputCell
                              defaultValue={
                                localRecords[`${template.id}_${m}`]
                                  ?.detail_keterangan
                              }
                              valueType="text"
                              onBlur={(v) =>
                                handleRecordChange(
                                  template.id,
                                  m,
                                  "detail_keterangan",
                                  v,
                                )
                              }
                              className="text-left w-full min-w-[120px]"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                  {/* Total per Product */}
                  {productsInSite.map((product, pIdx) => {
                    const productTemplates = siteTemplates.filter(
                      (t) => (t.product_name || "Unknown Product") === product,
                    );
                    return (
                      <tr
                        key={`tot-${upkName}-${product}`}
                        className="bg-teal-50/50 text-teal-900 font-bold border-b border-teal-200"
                      >
                        <td className="border-r border-teal-200 p-1.5 sticky left-0 z-10 bg-teal-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] text-center">
                          {String.fromCharCode(65 + pIdx)}
                        </td>
                        <td
                          className="border-r border-teal-200 p-1.5 sticky left-[40px] z-10 bg-teal-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] text-left"
                          colSpan={3}
                        >
                          TOTAL {product} {upkName}
                        </td>
                        <td
                          className="border-r border-teal-200 p-1.5 text-center"
                          colSpan={10}
                        >
                          -
                        </td>

                        {displayedMonths.map((m) => (
                          <React.Fragment key={`tot-g1-${m}`}>
                            <td className="border-r border-teal-200 p-1.5 text-right tabular-nums">
                              {getSum(productTemplates, m, "stock")}
                            </td>
                            <td className="border-r border-teal-200 p-1.5 text-right tabular-nums">
                              {getAvg(productTemplates, m, "keterisian_tanki")}
                            </td>
                            <td
                              className={`border-r border-teal-200 p-1.5 text-right tabular-nums ${getHopColor(getAvg(productTemplates, m, "hop"))}`}
                            >
                              {getAvg(productTemplates, m, "hop")}
                            </td>
                            <td className="border-r border-teal-200 p-1.5 text-center">
                              -
                            </td>
                          </React.Fragment>
                        ))}

                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-rt-${m}`}
                            className="border-r border-teal-200 p-1.5 text-right tabular-nums"
                          >
                            {getSum(productTemplates, m, "terima")}
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-rp-${m}`}
                            className="border-r border-teal-200 p-1.5 text-right tabular-nums"
                          >
                            {getSum(productTemplates, m, "pemakaian")}
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-rs-${m}`}
                            className="border-r border-teal-200 p-1.5 text-right tabular-nums"
                          >
                            {getSum(productTemplates, m, "stock_akhir_bulan")}
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-rsh-${m}`}
                            className={`border-r border-teal-200 p-1.5 text-right tabular-nums ${getHopColor(getAvg(productTemplates, m, "shop_akhir_bulan"))}`}
                          >
                            {getAvg(productTemplates, m, "shop_akhir_bulan")}
                          </td>
                        ))}

                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-rnp-${m}`}
                            className="border-r border-teal-200 p-1.5 text-right tabular-nums"
                          >
                            {getSum(productTemplates, m, "renominasi_pesan")}
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-rnpr-${m}`}
                            className="border-r border-teal-200 p-1.5 text-right tabular-nums"
                          >
                            {getAvg(
                              productTemplates,
                              m,
                              "renominaso_proyeksi_akhir_bulan",
                            )}
                          </td>
                        ))}

                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-dt-${m}`}
                            className="border-r border-teal-200 p-1.5 text-right tabular-nums"
                          >
                            {getSum(productTemplates, m, "delta_terima")}
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-dp-${m}`}
                            className="border-r border-teal-200 p-1.5 text-right tabular-nums"
                          >
                            {getAvg(productTemplates, m, "pencapaian")}
                          </td>
                        ))}

                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-rcp-${m}`}
                            className="border-r border-teal-200 p-1.5 text-right tabular-nums"
                          >
                            {getSum(productTemplates, m, "rencana_pesan")}
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-rch-${m}`}
                            className={`border-r border-teal-200 p-1.5 text-right tabular-nums ${getHopColor(getAvg(productTemplates, m, "rencana_hop"))}`}
                          >
                            {getAvg(productTemplates, m, "rencana_hop")}
                          </td>
                        ))}

                        <td className="border-r border-teal-200 p-1.5 text-center">
                          -
                        </td>

                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-kk-${m}`}
                            className="border-r border-teal-200 p-1.5 text-center"
                          >
                            -
                          </td>
                        ))}
                        {displayedMonths.map((m) => (
                          <td
                            key={`tot-kd-${m}`}
                            className="border-r border-teal-200 p-1.5 text-center"
                          >
                            -
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                  {/* Total Site (All Products) */}
                  <tr className="bg-amber-50/80 text-amber-900 font-bold border-b-2 border-amber-300">
                    <td className="border-r border-amber-300 p-1.5 sticky left-0 z-10 bg-amber-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] text-center">
                      {String.fromCharCode(65 + productsInSite.length)}
                    </td>
                    <td
                      className="border-r border-amber-300 p-1.5 sticky left-[40px] z-10 bg-amber-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] text-left"
                      colSpan={3}
                    >
                      TOTAL BBM {upkName}
                    </td>
                    <td
                      className="border-r border-amber-300 p-1.5 text-center"
                      colSpan={10}
                    >
                      -
                    </td>

                    {displayedMonths.map((m) => (
                      <React.Fragment key={`tota-g1-${m}`}>
                        <td className="border-r border-amber-300 p-1.5 text-right tabular-nums">
                          {getSum(siteTemplates, m, "stock")}
                        </td>
                        <td className="border-r border-amber-300 p-1.5 text-right tabular-nums">
                          {getAvg(siteTemplates, m, "keterisian_tanki")}
                        </td>
                        <td
                          className={`border-r border-amber-300 p-1.5 text-right tabular-nums ${getHopColor(getAvg(siteTemplates, m, "hop"))}`}
                        >
                          {getAvg(siteTemplates, m, "hop")}
                        </td>
                        <td className="border-r border-amber-300 p-1.5 text-center">
                          -
                        </td>
                      </React.Fragment>
                    ))}

                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-rt-${m}`}
                        className="border-r border-amber-300 p-1.5 text-right tabular-nums"
                      >
                        {getSum(siteTemplates, m, "terima")}
                      </td>
                    ))}
                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-rp-${m}`}
                        className="border-r border-amber-300 p-1.5 text-right tabular-nums"
                      >
                        {getSum(siteTemplates, m, "pemakaian")}
                      </td>
                    ))}
                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-rs-${m}`}
                        className="border-r border-amber-300 p-1.5 text-right tabular-nums"
                      >
                        {getSum(siteTemplates, m, "stock_akhir_bulan")}
                      </td>
                    ))}
                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-rsh-${m}`}
                        className={`border-r border-amber-300 p-1.5 text-right tabular-nums ${getHopColor(getAvg(siteTemplates, m, "shop_akhir_bulan"))}`}
                      >
                        {getAvg(siteTemplates, m, "shop_akhir_bulan")}
                      </td>
                    ))}

                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-rnp-${m}`}
                        className="border-r border-amber-300 p-1.5 text-right tabular-nums"
                      >
                        {getSum(siteTemplates, m, "renominasi_pesan")}
                      </td>
                    ))}
                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-rnpr-${m}`}
                        className="border-r border-amber-300 p-1.5 text-right tabular-nums"
                      >
                        {getAvg(
                          siteTemplates,
                          m,
                          "renominaso_proyeksi_akhir_bulan",
                        )}
                      </td>
                    ))}

                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-dt-${m}`}
                        className="border-r border-amber-300 p-1.5 text-right tabular-nums"
                      >
                        {getSum(siteTemplates, m, "delta_terima")}
                      </td>
                    ))}
                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-dp-${m}`}
                        className="border-r border-amber-300 p-1.5 text-right tabular-nums"
                      >
                        {getAvg(siteTemplates, m, "pencapaian")}
                      </td>
                    ))}

                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-rcp-${m}`}
                        className="border-r border-amber-300 p-1.5 text-right tabular-nums"
                      >
                        {getSum(siteTemplates, m, "rencana_pesan")}
                      </td>
                    ))}
                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-rch-${m}`}
                        className={`border-r border-amber-300 p-1.5 text-right tabular-nums ${getHopColor(getAvg(siteTemplates, m, "rencana_hop"))}`}
                      >
                        {getAvg(siteTemplates, m, "rencana_hop")}
                      </td>
                    ))}

                    <td className="border-r border-amber-300 p-1.5 text-center">
                      -
                    </td>

                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-kk-${m}`}
                        className="border-r border-amber-300 p-1.5 text-center"
                      >
                        -
                      </td>
                    ))}
                    {displayedMonths.map((m) => (
                      <td
                        key={`tota-kd-${m}`}
                        className="border-r border-amber-300 p-1.5 text-center"
                      >
                        -
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              );
            })}

            {displayedTemplates.length === 0 && !isLoading && (
              <tr>
                <td colSpan={20} className="p-8 text-center text-gray-500">
                  Tidak ada data template kertas kerja.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Tabs */}
      {availableUnits.length > 0 && (
        <div className="flex bg-gray-100 border-t border-gray-200 overflow-x-auto rounded-b-lg px-2 pt-2 gap-1 relative z-20">
          {availableUnits.map((unitName, idx) => {
            const isActive = activeUnitTab === unitName;
            return (
              <button
                key={unitName}
                onClick={() => setActiveUnitTab(unitName)}
                className={`relative px-6 py-2.5 text-sm font-medium rounded-t-xl transition-all duration-300 min-w-max group flex items-center gap-2 ${
                  isActive
                    ? "bg-white text-primary shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border border-b-0 border-gray-200 z-10"
                    : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-200/80 border border-transparent border-b-0"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary rounded-t-xl" />
                )}
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-gray-200 text-gray-500 group-hover:bg-gray-300 group-hover:text-gray-700"
                  }`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                {unitName}

                {/* Hides the bottom border of the container when active to create a seamless connection */}
                {isActive && (
                  <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalState !== null}
        onClose={() => {
          if (!isRefreshing) setModalState(null);
        }}
        maxWidth="max-w-md"
        showCloseButton={modalState?.type !== "refresh-confirm"}
        title={
          modalState?.type === "refresh-confirm"
            ? "Refresh Data Kertas Kerja"
            : modalState?.title
        }
      >
        {modalState?.type === "refresh-confirm" ? (
          <div>
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-amber-900">
              <AlertCircle
                className="mt-0.5 h-6 w-6 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <p className="text-sm leading-6">
                Perubahan yang belum disimpan akan dibuang. Tetap refresh data
                dari server?
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalState(null)}
                disabled={isRefreshing}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setModalState(null);
                  await performRefresh({ discardUnsaved: true });
                }}
                disabled={isRefreshing}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-90 disabled:opacity-60"
              >
                <RefreshCw size={16} aria-hidden="true" />
                Refresh Data
              </button>
            </div>
          </div>
        ) : modalState?.type === "message" ? (
          <div>
            <div className="flex flex-col items-center px-2 py-3 text-center">
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                  modalState.status === "success"
                    ? "bg-emerald-100 text-emerald-600"
                    : modalState.status === "error"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                }`}
              >
                {modalState.status === "success" ? (
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                ) : modalState.status === "error" ? (
                  <AlertCircle className="h-8 w-8" aria-hidden="true" />
                ) : (
                  <Info className="h-8 w-8" aria-hidden="true" />
                )}
              </div>
              <p className="text-sm leading-6 text-gray-600">
                {modalState.message}
              </p>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setModalState(null)}
                className="min-w-28 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:brightness-90"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

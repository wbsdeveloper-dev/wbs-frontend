import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  X,
  Upload,
  Plus,
  Play,
  Save,
  RotateCcw,
  BarChart2,
} from "lucide-react";
import { useSites } from "@/hooks/service/site-api";
import {
  useUploadTransportirExcel,
  type TransportirExcelConfig,
  type TransportirUploadError,
  type UploadTransportirExcelResponse,
} from "@/hooks/service/transportir-api";
import FilterAutocomplete from "@/app/components/FilterAutocomplete";

type Props = {
  setOpenModal: (value: boolean) => void;
};

type InspectedColumn = {
  column: string;
  hasData: boolean;
  samples: string[];
};

type KeywordInspection = {
  group: "Hulu" | "Hilir" | "Stock";
  keyword: string;
  searchColumn: string;
  startRow: number;
  cells: string[];
  cellsOutsideSearchRange: string[];
};

type WorkbookColumnInspection = {
  requestedSheet: string;
  actualSheet: string | null;
  exists: boolean;
  hulu: {
    search: InspectedColumn;
    mmscf: InspectedColumn;
    mmbtu: InspectedColumn;
  };
  hilir: {
    search: InspectedColumn;
    mmscf: InspectedColumn;
    mmbtu: InspectedColumn;
  };
  stock: {
    search: InspectedColumn;
    values: InspectedColumn[];
  };
  keywords: KeywordInspection[];
};

type WorkbookInspection = {
  sheetNames: string[];
  configSignature: string;
  sheets: WorkbookColumnInspection[];
};

const DEFAULT_CONFIG: TransportirExcelConfig = {
  sheets: ["01", "02", "03", "04", "05"],
  report_date_prefix: "2026-06-",
  hulu: {
    search_column: "B",
    start_row: 10,
    col_mmscf: "C",
    col_mmbtu: "D",
    keywords: [
      { label: "PT. PLN EPI HCML 2M", upstream_id: "" },
      { label: "PT PLN EPI HCML MAC", upstream_id: "" },
      { label: "PT PLN EPI TSB", upstream_id: "" },
    ],
  },
  hilir: {
    search_column: "E",
    start_row: 10,
    col_mmscf: "G",
    col_mmbtu: "H",
    keywords: [
      {
        label: "PT PLN EPI (NP GRESIK - HCML 2M)",
        upstream_id: "",
        downstream_id: "",
      },
      {
        label: "PT PLN EPI (NP GRESIK - TSB)",
        upstream_id: "",
        downstream_id: "",
      },
      {
        label: "PT PLN EPI (NP GRESIK - HCML MAC)",
        upstream_id: "",
        downstream_id: "",
      },
      {
        label: "PT PLN EPI (IP GRATI - TSB)",
        upstream_id: "",
        downstream_id: "",
      },
      {
        label: "PT PLN EPI (IP GRATI - HCML MAC)",
        upstream_id: "",
        downstream_id: "",
      },
      {
        label: "PT PLN EPI (IP GRATI - HCML 2M)",
        upstream_id: "",
        downstream_id: "",
      },
    ],
  },
  stock: {
    search_column: "B",
    keyword: "PLN EPI",
    col_start: "C",
    col_end: "I",
    key_mapping: [
      "opening_stock",
      "supply_stock",
      "delivered_stock",
      "own_use",
      "stock_transfer",
      "discrepancy",
      "closing_stock",
    ],
  },
};

const EXCEL_FILE_PATTERN = /\.(xlsx|xls)$/i;
const EXCEL_COLUMN_PATTERN = /^[A-Z]+$/i;

function cloneConfig(config: TransportirExcelConfig): TransportirExcelConfig {
  return {
    ...config,
    sheets: [...config.sheets],
    hulu: {
      ...config.hulu,
      keywords: config.hulu.keywords.map((keyword) => ({ ...keyword })),
    },
    hilir: {
      ...config.hilir,
      keywords: config.hilir.keywords.map((keyword) => ({ ...keyword })),
    },
    stock: {
      ...config.stock,
      key_mapping: [...config.stock.key_mapping],
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStoredConfig(value: unknown): value is TransportirExcelConfig {
  if (!isRecord(value) || !Array.isArray(value.sheets)) return false;
  if (!isRecord(value.hulu) || !isRecord(value.hilir) || !isRecord(value.stock)) {
    return false;
  }

  const hasStringFields = (record: Record<string, unknown>, fields: string[]) =>
    fields.every((field) => typeof record[field] === "string");
  const hasOptionalBoolean = (record: Record<string, unknown>, field: string) =>
    record[field] === undefined || typeof record[field] === "boolean";

  return (
    value.sheets.every((sheet) => typeof sheet === "string") &&
    hasStringFields(value.hulu, ["search_column", "col_mmscf", "col_mmbtu"]) &&
    Number.isInteger(value.hulu.start_row) &&
    Array.isArray(value.hulu.keywords) &&
    value.hulu.keywords.every(
      (keyword) =>
        isRecord(keyword) &&
        typeof keyword.label === "string" &&
        typeof keyword.upstream_id === "string",
    ) &&
    hasOptionalBoolean(value.hulu, "convert_mmscf") &&
    hasOptionalBoolean(value.hulu, "convert_mmbtu") &&
    hasStringFields(value.hilir, ["search_column", "col_mmscf", "col_mmbtu"]) &&
    Number.isInteger(value.hilir.start_row) &&
    Array.isArray(value.hilir.keywords) &&
    value.hilir.keywords.every(
      (keyword) =>
        isRecord(keyword) &&
        typeof keyword.label === "string" &&
        typeof keyword.upstream_id === "string" &&
        typeof keyword.downstream_id === "string",
    ) &&
    hasOptionalBoolean(value.hilir, "convert_mmscf") &&
    hasOptionalBoolean(value.hilir, "convert_mmbtu") &&
    hasStringFields(value.stock, [
      "search_column",
      "keyword",
      "col_start",
      "col_end",
    ]) &&
    Array.isArray(value.stock.key_mapping) &&
    value.stock.key_mapping.every((key) => typeof key === "string") &&
    hasOptionalBoolean(value.stock, "convert_bbtu") &&
    (value.report_date_prefix === undefined ||
      typeof value.report_date_prefix === "string")
  );
}

function readSavedConfig(): TransportirExcelConfig {
  if (typeof window === "undefined") return cloneConfig(DEFAULT_CONFIG);

  const saved = localStorage.getItem("excel_upload_config_default");
  if (!saved) return cloneConfig(DEFAULT_CONFIG);

  try {
    const parsed: unknown = JSON.parse(saved);
    if (isStoredConfig(parsed)) return cloneConfig(parsed);
  } catch (error) {
    console.error("Failed to parse saved config", error);
  }

  localStorage.removeItem("excel_upload_config_default");
  return cloneConfig(DEFAULT_CONFIG);
}

function normalizeConfig(config: TransportirExcelConfig): TransportirExcelConfig {
  return {
    ...cloneConfig(config),
    report_date_prefix: config.report_date_prefix?.trim(),
    sheets: Array.from(
      new Set(config.sheets.map((sheet) => sheet.trim()).filter(Boolean)),
    ),
    hulu: {
      ...config.hulu,
      search_column: config.hulu.search_column.trim().toUpperCase(),
      col_mmscf: config.hulu.col_mmscf.trim().toUpperCase(),
      col_mmbtu: config.hulu.col_mmbtu.trim().toUpperCase(),
      keywords: config.hulu.keywords.map((keyword) => ({
        ...keyword,
        label: keyword.label.trim(),
      })),
    },
    hilir: {
      ...config.hilir,
      search_column: config.hilir.search_column.trim().toUpperCase(),
      col_mmscf: config.hilir.col_mmscf.trim().toUpperCase(),
      col_mmbtu: config.hilir.col_mmbtu.trim().toUpperCase(),
      keywords: config.hilir.keywords.map((keyword) => ({
        ...keyword,
        label: keyword.label.trim(),
      })),
    },
    stock: {
      ...config.stock,
      search_column: config.stock.search_column.trim().toUpperCase(),
      keyword: config.stock.keyword.trim(),
      col_start: config.stock.col_start.trim().toUpperCase(),
      col_end: config.stock.col_end.trim().toUpperCase(),
      key_mapping: config.stock.key_mapping
        .map((key) => key.trim())
        .filter(Boolean),
    },
  };
}

function validateConfig(config: TransportirExcelConfig) {
  if (config.sheets.length === 0) return "Tambahkan minimal satu nama sheet.";

  const columns = [
    ["kolom pencarian Hulu", config.hulu.search_column],
    ["kolom FLOWRATE Hulu", config.hulu.col_mmscf],
    ["kolom ENERGY Hulu", config.hulu.col_mmbtu],
    ["kolom pencarian Hilir", config.hilir.search_column],
    ["kolom FLOWRATE Hilir", config.hilir.col_mmscf],
    ["kolom ENERGY Hilir", config.hilir.col_mmbtu],
    ["kolom pencarian Stock", config.stock.search_column],
    ["kolom awal Stock", config.stock.col_start],
    ["kolom akhir Stock", config.stock.col_end],
  ] as const;
  const invalidColumn = columns.find(([, column]) =>
    !EXCEL_COLUMN_PATTERN.test(column),
  );
  if (invalidColumn) {
    return `${invalidColumn[0]} harus berupa huruf kolom Excel, misalnya A atau AA.`;
  }

  if (!Number.isInteger(config.hulu.start_row) || config.hulu.start_row < 1) {
    return "Baris awal Hulu harus berupa bilangan bulat minimal 1.";
  }
  if (!Number.isInteger(config.hilir.start_row) || config.hilir.start_row < 1) {
    return "Baris awal Hilir harus berupa bilangan bulat minimal 1.";
  }
  if (!config.stock.keyword) return "Keyword Stock tidak boleh kosong.";

  const stockStart = XLSX.utils.decode_col(config.stock.col_start);
  const stockEnd = XLSX.utils.decode_col(config.stock.col_end);
  if (stockEnd < stockStart) {
    return "Kolom akhir Stock tidak boleh berada sebelum kolom awal.";
  }

  const stockColumnCount = stockEnd - stockStart + 1;
  if (config.stock.key_mapping.length !== stockColumnCount) {
    return `Mapping Stock harus berisi ${stockColumnCount} key untuk rentang ${config.stock.col_start}–${config.stock.col_end}.`;
  }

  if (
    config.report_date_prefix &&
    !/^\d{4}-(0[1-9]|1[0-2])-$/.test(config.report_date_prefix)
  ) {
    return "Prefix tanggal laporan harus berformat YYYY-MM-, misalnya 2026-06-.";
  }

  return null;
}

function normalizeExcelText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getCellText(cell: XLSX.CellObject | undefined) {
  if (!cell || cell.v === undefined || cell.v === null) return "";
  return String(cell.v).trim();
}

function inspectColumn(
  sheet: XLSX.WorkSheet | undefined,
  column: string,
  startRow: number,
  limit = 8,
): InspectedColumn {
  const normalizedColumn = column.trim().toUpperCase();
  if (!sheet?.["!ref"] || !EXCEL_COLUMN_PATTERN.test(normalizedColumn)) {
    return { column: normalizedColumn, hasData: false, samples: [] };
  }

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const columnIndex = XLSX.utils.decode_col(normalizedColumn);
  const samples: string[] = [];
  let hasData = false;

  if (columnIndex < range.s.c || columnIndex > range.e.c) {
    return { column: normalizedColumn, hasData: false, samples: [] };
  }

  for (let row = Math.max(startRow - 1, range.s.r); row <= range.e.r; row += 1) {
    const text = getCellText(
      sheet[XLSX.utils.encode_cell({ r: row, c: columnIndex })],
    );
    if (!text) continue;

    hasData = true;
    if (samples.length < limit && !samples.includes(text)) samples.push(text);
  }

  return { column: normalizedColumn, hasData, samples };
}

function isKeywordMatch(value: unknown, keyword: string) {
  const normalizedValue = normalizeExcelText(value);
  const normalizedKeyword = normalizeExcelText(keyword);

  // The workbook may prefix labels with row numbers (for example "4. ..."),
  // but a short cell value such as "TSB" must not match a longer keyword.
  return Boolean(
    normalizedValue &&
    normalizedKeyword &&
    normalizedValue.includes(normalizedKeyword),
  );
}

function hasWorksheetData(sheet: XLSX.WorkSheet | undefined) {
  if (!sheet) return false;

  return Object.entries(sheet).some(
    ([address, cell]) =>
      !address.startsWith("!") &&
      cell.v !== undefined &&
      String(cell.v).trim() !== "",
  );
}

function findKeywordCells(
  sheet: XLSX.WorkSheet,
  keyword: string,
  options: { column?: string; startRow?: number; limit?: number } = {},
) {
  const normalizedKeyword = keyword.trim();
  if (!sheet["!ref"] || !normalizedKeyword) return [];

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const limit = options.limit ?? 3;
  const requestedColumn = options.column?.trim().toUpperCase();
  const columnIndex = requestedColumn
    ? XLSX.utils.decode_col(requestedColumn)
    : undefined;
  const startColumn = columnIndex ?? range.s.c;
  const endColumn = columnIndex ?? range.e.c;
  const startRow = Math.max((options.startRow ?? 1) - 1, range.s.r);
  const matches: string[] = [];

  if (startColumn < range.s.c || startColumn > range.e.c) return [];

  for (let row = startRow; row <= range.e.r; row += 1) {
    for (let column = startColumn; column <= endColumn; column += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      if (isKeywordMatch(sheet[address]?.v, normalizedKeyword)) {
        matches.push(address);
        if (matches.length >= limit) return matches;
      }
    }
  }

  return matches;
}

function normalizeSheetName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function resolveSheetName(sheetNames: string[], requestedSheet: string) {
  if (sheetNames.includes(requestedSheet)) return requestedSheet;

  const normalizedRequested = normalizeSheetName(requestedSheet);
  return (
    sheetNames.find(
      (sheetName) => normalizeSheetName(sheetName) === normalizedRequested,
    ) ?? null
  );
}

function inspectKeyword(
  sheet: XLSX.WorkSheet,
  group: KeywordInspection["group"],
  keyword: string,
  searchColumn: string,
  startRow: number,
): KeywordInspection {
  const normalizedSearchColumn = searchColumn.trim().toUpperCase();
  const searchColumnIndex = XLSX.utils.decode_col(normalizedSearchColumn);
  const cells = findKeywordCells(sheet, keyword, {
    column: normalizedSearchColumn,
    startRow,
  });
  const cellsOutsideSearchRange = findKeywordCells(sheet, keyword, { limit: 20 })
    .filter((address) => {
      const cell = XLSX.utils.decode_cell(address);
      return cell.c !== searchColumnIndex || cell.r < startRow - 1;
    })
    .slice(0, 3);

  return {
    group,
    keyword,
    searchColumn,
    startRow,
    cells,
    cellsOutsideSearchRange,
  };
}

function findKeywordValueInColumn(
  sheet: XLSX.WorkSheet,
  column: string,
  startRow: number,
  keyword: string,
) {
  if (!sheet["!ref"]) return null;

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const columnIndex = XLSX.utils.decode_col(column.toUpperCase());

  for (let row = Math.max(startRow - 1, range.s.r); row <= range.e.r; row += 1) {
    const value = sheet[XLSX.utils.encode_cell({ r: row, c: columnIndex })]?.v;
    if (isKeywordMatch(value, keyword)) return String(value).trim();
  }

  return null;
}

function formatUploadError(error: TransportirUploadError, index: number) {
  if (typeof error === "string") return error;

  const context = [
    error.sheet ? `Sheet ${error.sheet}` : "",
    error.row ? `baris ${error.row}` : "",
    error.group ? `kelompok ${error.group.toUpperCase()}` : "",
    error.keyword ? `keyword “${error.keyword}”` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const reason = error.reason === "keyword not found"
    ? "keyword tidak ditemukan pada kolom pencarian"
    : error.reason === "Stock keyword not found"
      ? "keyword stock tidak ditemukan"
      : error.reason;
  const message = error.message || error.error || reason;

  if (context && message) return `${context}: ${message}`;
  if (message) return message;
  if (context) return context;

  try {
    return JSON.stringify(error);
  } catch {
    return `Kesalahan pemrosesan ke-${index + 1}`;
  }
}

export default function UploadKonfigurasiModal({ setOpenModal }: Props) {
  const { data: sitesData } = useSites();
  const sites = sitesData || [];

  // Filter sites for dropdowns: only show GAS PIPA or LNG
  const filteredSites = sites.filter(s => s.commodity === 'GAS PIPA' || s.commodity === 'LNG');

  // For Hilir dropdown: only show if site_type is PEMBANGKIT
  const filteredHilirSites = filteredSites.filter(s => s.site_type === 'PEMBANGKIT');

  const [config, setConfig] = useState<TransportirExcelConfig>(() =>
    cloneConfig(DEFAULT_CONFIG),
  );
  const [newSheet, setNewSheet] = useState("");
  const [newHuluKw, setNewHuluKw] = useState("");
  const [newHilirKw, setNewHilirKw] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inspectionRequestRef = useRef(0);

  const uploadMutation = useUploadTransportirExcel();
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadResult, setUploadResult] =
    useState<UploadTransportirExcelResponse | null>(null);
  const [workbookInspection, setWorkbookInspection] =
    useState<WorkbookInspection | null>(null);
  const [inspectionError, setInspectionError] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    setConfig(readSavedConfig());

    return () => {
      inspectionRequestRef.current += 1;
    };
  }, []);

  const handleSaveDefault = () => {
    const normalizedConfig = normalizeConfig(config);
    const validationError = validateConfig(normalizedConfig);
    if (validationError) {
      alert(validationError);
      return;
    }

    setConfig(normalizedConfig);
    localStorage.setItem(
      "excel_upload_config_default",
      JSON.stringify(normalizedConfig),
    );
    alert("Konfigurasi berhasil disimpan sebagai default!");
  };

  const handleResetDefault = () => {
    setConfig(readSavedConfig());
    setSuccessMsg("");
    setUploadResult(null);
    setWorkbookInspection(null);
    setInspectionError("");
  };

  const inspectWorkbook = async (
    selectedFile: File,
    sourceConfig: TransportirExcelConfig = config,
  ) => {
    const requestId = inspectionRequestRef.current + 1;
    inspectionRequestRef.current = requestId;
    const inspectionConfig = normalizeConfig(sourceConfig);
    const validationError = validateConfig(inspectionConfig);

    setWorkbookInspection(null);
    setInspectionError("");
    if (validationError) {
      setInspectionError(`Konfigurasi tidak valid: ${validationError}`);
      setIsInspecting(false);
      return;
    }

    setIsInspecting(true);

    try {
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), {
        type: "array",
      });
      const emptyColumn = (column: string): InspectedColumn => ({
        column,
        hasData: false,
        samples: [],
      });
      const stockStartColumn = XLSX.utils.decode_col(
        inspectionConfig.stock.col_start,
      );
      const stockEndColumn = XLSX.utils.decode_col(inspectionConfig.stock.col_end);
      const stockColumns = Array.from(
        { length: stockEndColumn - stockStartColumn + 1 },
        (_, index) => XLSX.utils.encode_col(stockStartColumn + index),
      );

      const sheets = inspectionConfig.sheets.map((requestedSheet) => {
        const actualSheet = resolveSheetName(
          workbook.SheetNames,
          requestedSheet,
        );
        const sheet = actualSheet ? workbook.Sheets[actualSheet] : undefined;

        if (!sheet) {
          return {
            requestedSheet,
            actualSheet: null,
            exists: false,
            hulu: {
              search: emptyColumn(inspectionConfig.hulu.search_column),
              mmscf: emptyColumn(inspectionConfig.hulu.col_mmscf),
              mmbtu: emptyColumn(inspectionConfig.hulu.col_mmbtu),
            },
            hilir: {
              search: emptyColumn(inspectionConfig.hilir.search_column),
              mmscf: emptyColumn(inspectionConfig.hilir.col_mmscf),
              mmbtu: emptyColumn(inspectionConfig.hilir.col_mmbtu),
            },
            stock: {
              search: emptyColumn(inspectionConfig.stock.search_column),
              values: stockColumns.map(emptyColumn),
            },
            keywords: [],
          } satisfies WorkbookColumnInspection;
        }

        const keywords = [
          ...inspectionConfig.hulu.keywords
            .filter((keyword) => keyword.label)
            .map((keyword) =>
              inspectKeyword(
                sheet,
                "Hulu",
                keyword.label,
                inspectionConfig.hulu.search_column,
                inspectionConfig.hulu.start_row,
              ),
            ),
          ...inspectionConfig.hilir.keywords
            .filter((keyword) => keyword.label)
            .map((keyword) =>
              inspectKeyword(
                sheet,
                "Hilir",
                keyword.label,
                inspectionConfig.hilir.search_column,
                inspectionConfig.hilir.start_row,
              ),
            ),
          inspectKeyword(
            sheet,
            "Stock",
            inspectionConfig.stock.keyword,
            inspectionConfig.stock.search_column,
            1,
          ),
        ];

        return {
          requestedSheet,
          actualSheet,
          exists: true,
          hulu: {
            search: inspectColumn(
              sheet,
              inspectionConfig.hulu.search_column,
              inspectionConfig.hulu.start_row,
            ),
            mmscf: inspectColumn(
              sheet,
              inspectionConfig.hulu.col_mmscf,
              inspectionConfig.hulu.start_row,
            ),
            mmbtu: inspectColumn(
              sheet,
              inspectionConfig.hulu.col_mmbtu,
              inspectionConfig.hulu.start_row,
            ),
          },
          hilir: {
            search: inspectColumn(
              sheet,
              inspectionConfig.hilir.search_column,
              inspectionConfig.hilir.start_row,
            ),
            mmscf: inspectColumn(
              sheet,
              inspectionConfig.hilir.col_mmscf,
              inspectionConfig.hilir.start_row,
            ),
            mmbtu: inspectColumn(
              sheet,
              inspectionConfig.hilir.col_mmbtu,
              inspectionConfig.hilir.start_row,
            ),
          },
          stock: {
            search: inspectColumn(
              sheet,
              inspectionConfig.stock.search_column,
              1,
            ),
            values: stockColumns.map((column) =>
              inspectColumn(sheet, column, 1, 3),
            ),
          },
          keywords,
        } satisfies WorkbookColumnInspection;
      });

      if (inspectionRequestRef.current === requestId) {
        setWorkbookInspection({
          sheetNames: workbook.SheetNames,
          configSignature: JSON.stringify(inspectionConfig),
          sheets,
        });
      }
    } catch (error) {
      if (inspectionRequestRef.current === requestId) {
        setWorkbookInspection(null);
        setInspectionError(
          error instanceof Error
            ? error.message
            : "File Excel tidak dapat dianalisis",
        );
      }
    } finally {
      if (inspectionRequestRef.current === requestId) {
        setIsInspecting(false);
      }
    }
  };

  const selectFile = (selectedFile: File) => {
    if (!EXCEL_FILE_PATTERN.test(selectedFile.name)) {
      inspectionRequestRef.current += 1;
      setFile(null);
      setSuccessMsg("");
      setUploadResult(null);
      setWorkbookInspection(null);
      setInspectionError("Pilih file Excel dengan format .xlsx atau .xls.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
    setSuccessMsg("");
    setUploadResult(null);
    setWorkbookInspection(null);
    void inspectWorkbook(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      selectFile(e.target.files[0]);
    }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Pilih file Excel terlebih dahulu");
      return;
    }

    if (!EXCEL_FILE_PATTERN.test(file.name)) {
      alert("File harus berformat .xlsx atau .xls.");
      return;
    }

    const normalizedConfig = normalizeConfig(config);
    const validationError = validateConfig(normalizedConfig);
    if (validationError) {
      alert(validationError);
      return;
    }

    const mappedHuluKeywords = normalizedConfig.hulu.keywords.filter(
      (keyword) => keyword.label && keyword.upstream_id,
    );
    const mappedHilirKeywords = normalizedConfig.hilir.keywords.filter(
      (keyword) =>
        keyword.label && keyword.upstream_id && keyword.downstream_id,
    );
    const skippedKeywordCount =
      normalizedConfig.hulu.keywords.filter((keyword) => keyword.label).length -
      mappedHuluKeywords.length +
      normalizedConfig.hilir.keywords.filter((keyword) => keyword.label).length -
      mappedHilirKeywords.length;

    if (mappedHuluKeywords.length + mappedHilirKeywords.length === 0) {
      alert(
        "Belum ada mapping rekonsiliasi yang lengkap. Isi minimal satu mapping Hulu atau satu pasangan mapping Hulu–Hilir.",
      );
      return;
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    } catch (error) {
      alert(
        error instanceof Error
          ? `File Excel tidak dapat dibaca: ${error.message}`
          : "File Excel tidak dapat dibaca",
      );
      return;
    }

    const populatedSheets = normalizedConfig.sheets.filter((sheetName) =>
      hasWorksheetData(workbook.Sheets[sheetName]),
    );
    const skippedSheetCount =
      normalizedConfig.sheets.length - populatedSheets.length;

    if (populatedSheets.length === 0) {
      alert(
        "Tidak ada sheet konfigurasi yang berisi data. Periksa daftar sheet atau isi file Excel.",
      );
      return;
    }

    const resolveKeywordLabel = (
      keyword: string,
      column: string,
      startRow: number,
    ) => {
      for (const sheetName of populatedSheets) {
        const matchedValue = findKeywordValueInColumn(
          workbook.Sheets[sheetName],
          column,
          startRow,
          keyword,
        );
        if (matchedValue) return matchedValue;
      }
      return keyword;
    };

    const resolvedHuluKeywords = mappedHuluKeywords.map((keyword) => ({
      ...keyword,
      label: resolveKeywordLabel(
        keyword.label,
        normalizedConfig.hulu.search_column,
        normalizedConfig.hulu.start_row,
      ),
    }));
    const resolvedHilirKeywords = mappedHilirKeywords.map((keyword) => ({
      ...keyword,
      label: resolveKeywordLabel(
        keyword.label,
        normalizedConfig.hilir.search_column,
        normalizedConfig.hilir.start_row,
      ),
    }));

    const uploadConfig: TransportirExcelConfig = {
      ...normalizedConfig,
      sheets: populatedSheets,
      hulu: {
        ...normalizedConfig.hulu,
        keywords: resolvedHuluKeywords,
      },
      hilir: {
        ...normalizedConfig.hilir,
        keywords: resolvedHilirKeywords,
      },
    };

    if (isDebugMode) {
      console.log("=== DEBUG MODE: PAYLOAD ===");
      console.log("File:", file.name, "size:", file.size);
      console.log("Config JSON:", JSON.stringify(uploadConfig, null, 2));
      console.log("Keyword tidak lengkap yang dilewati:", skippedKeywordCount);
      console.log("Sheet kosong/tidak tersedia yang dilewati:", skippedSheetCount);
      alert(
        `Mode Debug aktif.\nPayload JSON dicetak ke console (F12).\n${skippedKeywordCount} keyword tanpa mapping lengkap dilewati.\n${skippedSheetCount} sheet kosong/tidak tersedia dilewati.\n\nConfig:\n${JSON.stringify(uploadConfig, null, 2).slice(0, 500)}...`,
      );
      return;
    }

    try {
      setSuccessMsg("");
      setUploadResult(null);
      const res = await uploadMutation.mutateAsync({
        file,
        config: uploadConfig,
      });
      const sheetsProcessed = res.summary?.sheets_processed ?? 0;
      const reconciliationInserted = res.summary?.reconciliation_inserted ?? 0;
      const errorCount = res.summary?.errors?.length ?? 0;

      const skippedMessage = [
        skippedKeywordCount
          ? `${skippedKeywordCount} keyword tanpa mapping lengkap dilewati`
          : "",
        skippedSheetCount
          ? `${skippedSheetCount} sheet kosong/tidak tersedia dilewati`
          : "",
      ]
        .filter(Boolean)
        .join(". ");
      const skippedSuffix = skippedMessage ? ` ${skippedMessage}.` : "";

      setUploadResult(res);
      setSuccessMsg(
        reconciliationInserted > 0
          ? `Berhasil! ${sheetsProcessed} sheet diproses. ${reconciliationInserted} data direkonsiliasi${errorCount ? `, dengan ${errorCount} kesalahan` : ""}.${skippedSuffix}`
          : `${sheetsProcessed} sheet selesai diproses, tetapi tidak ada data rekonsiliasi yang tersimpan.${skippedSuffix} Periksa kecocokan keyword, kolom, nilai Excel, dan detail kesalahan di bawah.`,
      );
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses data",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpenModal(false)}
      />
      <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col z-10 max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start p-5 sm:p-6 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="text-primary" size={24} />
              Upload & Konfigurasi Excel
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Tentukan sumber data dan keyword pencarian untuk setiap kelompok
              data
            </p>
          </div>
          <button
            onClick={() => setOpenModal(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {successMsg && (
            <div
              className={`p-4 rounded-lg border font-medium ${(uploadResult?.summary?.reconciliation_inserted ?? 0) > 0
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
            >
              <p>{successMsg}</p>
              {(uploadResult?.summary?.errors?.length ?? 0) > 0 && (
                <div className="mt-3 border-t border-current/20 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide">
                    Detail kesalahan ({uploadResult?.summary?.errors.length})
                  </p>
                  <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs font-normal">
                    {uploadResult?.summary?.errors.map((error, index) => (
                      <li key={index}>{formatUploadError(error, index)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              className="text-gray-900 hidden"
              accept=".xlsx, .xls"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Upload
              className="text-gray-400 group-hover:text-primary transition-colors mb-3"
              size={32}
            />
            <p className="text-sm text-gray-700 font-medium">
              {file ? (
                file.name
              ) : (
                <>
                  Klik untuk pilih file{" "}
                  <span className="font-normal text-gray-500">
                    atau drag & drop di sini
                  </span>
                </>
              )}
            </p>
            {!file && (
              <p className="text-xs text-gray-400 mt-1">
                Format yang didukung: .xlsx, .xls
              </p>
            )}
          </div>

          {file && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-blue-900">Analisis isi Excel</p>
                  <p className="mt-0.5 text-xs text-blue-700">
                    Membandingkan isi file dengan sheet, kolom, dan keyword pada konfigurasi saat ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void inspectWorkbook(file)}
                  disabled={isInspecting}
                  className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  {isInspecting ? "Menganalisis..." : "Analisis ulang"}
                </button>
              </div>

              {inspectionError && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                  {inspectionError}
                </p>
              )}

              {workbookInspection && (
                <div className="mt-3 space-y-3">
                  {workbookInspection.configSignature !==
                    JSON.stringify(normalizeConfig(config)) && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        Konfigurasi berubah setelah analisis terakhir. Klik{" "}
                        <span className="font-semibold">Analisis ulang</span> untuk
                        memperbarui hasil.
                      </div>
                    )}

                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-lg bg-white p-2.5">
                      <p className="text-gray-500">Sheet dikonfigurasi</p>
                      <p className="mt-0.5 font-bold text-gray-900">
                        {workbookInspection.sheets.length}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2.5">
                      <p className="text-emerald-700">Sheet ditemukan</p>
                      <p className="mt-0.5 font-bold text-emerald-900">
                        {workbookInspection.sheets.filter((sheet) => sheet.exists).length}
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2.5">
                      <p className="text-red-700">Sheet tidak ditemukan</p>
                      <p className="mt-0.5 font-bold text-red-900">
                        {workbookInspection.sheets.filter((sheet) => !sheet.exists).length}
                      </p>
                    </div>
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer font-semibold text-blue-800">
                      Lihat semua sheet dalam file ({workbookInspection.sheetNames.length})
                    </summary>
                    <p className="mt-2 max-h-24 overflow-y-auto rounded-lg bg-white p-2 text-gray-600">
                      {workbookInspection.sheetNames.join(", ") || "Tidak ada sheet"}
                    </p>
                  </details>

                  <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                    {workbookInspection.sheets.map((sheet) => (
                      <div
                        key={sheet.requestedSheet}
                        className={`rounded-lg border bg-white p-3 text-xs ${sheet.exists ? "border-blue-100" : "border-red-200"
                          }`}
                      >
                        <p className="font-bold text-gray-900">
                          Sheet {sheet.requestedSheet}{" "}
                          {!sheet.exists ? (
                            <span className="font-normal text-red-600">
                              — tidak ditemukan
                            </span>
                          ) : sheet.actualSheet !== sheet.requestedSheet ? (
                            <span className="font-normal text-amber-700">
                              — cocok dengan “{sheet.actualSheet}”
                            </span>
                          ) : (
                            <span className="font-normal text-emerald-700">
                              — ditemukan
                            </span>
                          )}
                        </p>

                        {sheet.exists && (
                          <div className="mt-3 space-y-3">
                            <div>
                              <p className="mb-1.5 font-semibold text-gray-700">
                                Pemeriksaan kolom
                              </p>
                              <div className="grid gap-1.5 sm:grid-cols-2">
                                {[
                                  { label: "Hulu · pencarian", info: sheet.hulu.search },
                                  { label: "Hulu · FLOWRATE", info: sheet.hulu.mmscf },
                                  { label: "Hulu · ENERGY", info: sheet.hulu.mmbtu },
                                  { label: "Hilir · pencarian", info: sheet.hilir.search },
                                  { label: "Hilir · FLOWRATE", info: sheet.hilir.mmscf },
                                  { label: "Hilir · ENERGY", info: sheet.hilir.mmbtu },
                                  { label: "Stock · pencarian", info: sheet.stock.search },
                                  ...sheet.stock.values.map((info) => ({
                                    label: "Stock · nilai",
                                    info,
                                  })),
                                ].map(({ label, info }) => (
                                  <div
                                    key={`${label}-${info.column}`}
                                    className={`rounded-md px-2 py-1.5 ${info.hasData
                                        ? "bg-emerald-50 text-emerald-800"
                                        : "bg-red-50 text-red-700"
                                      }`}
                                    title={info.samples.join(" | ")}
                                  >
                                    <span className="font-semibold">{label} {info.column}</span>
                                    {info.hasData ? " — ada data" : " — kosong/tidak ditemukan"}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="mb-1.5 font-semibold text-gray-700">
                                Pemeriksaan keyword
                              </p>
                              <div className="space-y-1.5">
                                {sheet.keywords.map((match) => {
                                  const found = match.cells.length > 0;
                                  const foundElsewhere =
                                    !found && match.cellsOutsideSearchRange.length > 0;

                                  return (
                                    <div
                                      key={`${match.group}-${match.keyword}`}
                                      className={`rounded-md px-2 py-1.5 ${found
                                          ? "bg-emerald-50 text-emerald-800"
                                          : foundElsewhere
                                            ? "bg-amber-50 text-amber-800"
                                            : "bg-red-50 text-red-700"
                                        }`}
                                    >
                                      <span className="font-semibold">
                                        {match.group} “{match.keyword}”
                                      </span>{" "}
                                      {found
                                        ? `— ditemukan di ${match.cells.join(", ")}`
                                        : foundElsewhere
                                          ? `— ditemukan di ${match.cellsOutsideSearchRange.join(", ")}, tetapi bukan pada kolom ${match.searchColumn} mulai baris ${match.startRow}`
                                          : `— tidak ditemukan pada kolom ${match.searchColumn} mulai baris ${match.startRow}`}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sheet yang diproses */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Pengaturan Sheet & Tanggal Laporan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Prefix Tanggal Laporan (contoh: 2026-06-)
                </label>
                <input
                  type="text"
                  value={config.report_date_prefix || ""}
                  onChange={(e) =>
                    setConfig({ ...config, report_date_prefix: e.target.value })
                  }
                  placeholder="2026-06-"
                  className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <p className="block text-xs text-gray-500 mb-1">Daftar Sheet</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {config.sheets.map((sheet, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium"
                >
                  {sheet}
                  <button
                    onClick={() =>
                      setConfig({
                        ...config,
                        sheets: config.sheets.filter((s) => s !== sheet),
                      })
                    }
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nama sheet, mis: 06 Jun"
                value={newSheet}
                onChange={(e) => setNewSheet(e.target.value)}
                className="text-gray-900 flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                onClick={() => {
                  if (newSheet) {
                    setConfig({
                      ...config,
                      sheets: [...config.sheets, newSheet],
                    });
                    setNewSheet("");
                  }
                }}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Plus size={16} /> Tambah sheet
              </button>
            </div>
          </div>

          {/* Kelompok data 1 */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Kelompok data 1 — Data Hulu (Shipper)
            </h4>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Cari keyword di kolom
                  </label>
                  <input
                    type="text"
                    value={config.hulu.search_column}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hulu: { ...config.hulu, search_column: e.target.value },
                      })
                    }
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Mulai dari baris
                  </label>
                  <input
                    type="number"
                    value={config.hulu.start_row}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hulu: {
                          ...config.hulu,
                          start_row: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-4 mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    Keyword baris yang diambil
                  </p>
                </div>
                <div className="space-y-3 mb-3">
                  {config.hulu.keywords.map((kw, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={kw.label}
                          onChange={(e) => {
                            const label = e.target.value;
                            setConfig((current) => ({
                              ...current,
                              hulu: {
                                ...current.hulu,
                                keywords: current.hulu.keywords.map(
                                  (keyword, index) =>
                                    index === i ? { ...keyword, label } : keyword,
                                ),
                              },
                            }));
                          }}
                          className="text-gray-900 flex-1 px-3 py-1.5 bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded text-sm outline-none transition-all"
                        />
                        <button
                          onClick={() =>
                            setConfig({
                              ...config,
                              hulu: {
                                ...config.hulu,
                                keywords: config.hulu.keywords.filter(
                                  (_, idx) => idx !== i,
                                ),
                              },
                            })
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="mt-1">
                        <FilterAutocomplete
                          label="Hulu"
                          options={filteredSites.map(s => s.name)}
                          value={filteredSites.find(s => s.id === kw.upstream_id)?.name || ""}
                          onChange={(val) => {
                            const site = filteredSites.find(s => s.name === val);
                            const upstreamId = site?.id ?? "";
                            setConfig((current) => ({
                              ...current,
                              hulu: {
                                ...current.hulu,
                                keywords: current.hulu.keywords.map(
                                  (keyword, index) =>
                                    index === i
                                      ? { ...keyword, upstream_id: upstreamId }
                                      : keyword,
                                ),
                              },
                            }));
                          }}
                          placeholder="-- Pilih Hulu --"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHuluKw}
                    onChange={(e) => setNewHuluKw(e.target.value)}
                    placeholder="Tambah keyword baru..."
                    className="text-gray-900 flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newHuluKw) {
                        setConfig({
                          ...config,
                          hulu: {
                            ...config.hulu,
                            keywords: [
                              ...config.hulu.keywords,
                              { label: newHuluKw, upstream_id: "" },
                            ],
                          },
                        });
                        setNewHuluKw("");
                      }
                    }}
                    className="px-3 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Plus size={16} /> Tambah
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Kolom nilai yang diambil
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      FLOWRATE&rarr;
                    </span>
                    <input
                      type="text"
                      value={config.hulu.col_mmscf}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hulu: { ...config.hulu, col_mmscf: e.target.value },
                        })
                      }
                      className="text-gray-900 w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center bg-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm">
                      <input
                        type="checkbox"
                        checked={config.hulu.convert_mmscf || false}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            hulu: {
                              ...config.hulu,
                              convert_mmscf: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Konversi ke MMSCF
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">ENERGY &rarr;</span>
                    <input
                      type="text"
                      value={config.hulu.col_mmbtu}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hulu: { ...config.hulu, col_mmbtu: e.target.value },
                        })
                      }
                      className="text-gray-900 w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center bg-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm">
                      <input
                        type="checkbox"
                        checked={config.hulu.convert_mmbtu || false}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            hulu: {
                              ...config.hulu,
                              convert_mmbtu: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Konversi ke BBTU
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kelompok data 2 */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Kelompok data 2 — Data Hilir (Pelanggan Shipper)
            </h4>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Cari keyword di kolom
                  </label>
                  <input
                    type="text"
                    value={config.hilir.search_column}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hilir: {
                          ...config.hilir,
                          search_column: e.target.value,
                        },
                      })
                    }
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Mulai dari baris
                  </label>
                  <input
                    type="number"
                    value={config.hilir.start_row}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hilir: {
                          ...config.hilir,
                          start_row: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    Keyword baris yang diambil
                  </p>
                </div>
                <div className="space-y-3 mb-3">
                  {config.hilir.keywords.map((kw, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={kw.label}
                          onChange={(e) => {
                            const label = e.target.value;
                            setConfig((current) => ({
                              ...current,
                              hilir: {
                                ...current.hilir,
                                keywords: current.hilir.keywords.map(
                                  (keyword, index) =>
                                    index === i ? { ...keyword, label } : keyword,
                                ),
                              },
                            }));
                          }}
                          className="text-gray-900 flex-1 px-3 py-1.5 bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded text-sm outline-none transition-all"
                        />
                        <button
                          onClick={() =>
                            setConfig({
                              ...config,
                              hilir: {
                                ...config.hilir,
                                keywords: config.hilir.keywords.filter(
                                  (_, idx) => idx !== i,
                                ),
                              },
                            })
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <FilterAutocomplete
                            label="Hulu"
                            options={filteredSites.map(s => s.name)}
                            value={filteredSites.find(s => s.id === kw.upstream_id)?.name || ""}
                            onChange={(val) => {
                              const site = filteredSites.find(s => s.name === val);
                              const upstreamId = site?.id ?? "";
                              setConfig((current) => ({
                                ...current,
                                hilir: {
                                  ...current.hilir,
                                  keywords: current.hilir.keywords.map(
                                    (keyword, index) =>
                                      index === i
                                        ? { ...keyword, upstream_id: upstreamId }
                                        : keyword,
                                  ),
                                },
                              }));
                            }}
                            placeholder="-- Pilih Hulu --"
                          />
                        </div>
                        <div>
                          <FilterAutocomplete
                            label="Hilir"
                            options={filteredHilirSites.map(s => s.name)}
                            value={filteredHilirSites.find(s => s.id === kw.downstream_id)?.name || ""}
                            onChange={(val) => {
                              const site = filteredHilirSites.find(s => s.name === val);
                              const downstreamId = site?.id ?? "";
                              setConfig((current) => ({
                                ...current,
                                hilir: {
                                  ...current.hilir,
                                  keywords: current.hilir.keywords.map(
                                    (keyword, index) =>
                                      index === i
                                        ? { ...keyword, downstream_id: downstreamId }
                                        : keyword,
                                  ),
                                },
                              }));
                            }}
                            placeholder="-- Pilih Hilir --"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHilirKw}
                    onChange={(e) => setNewHilirKw(e.target.value)}
                    placeholder="Tambah keyword baru..."
                    className="text-gray-900 flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newHilirKw) {
                        setConfig({
                          ...config,
                          hilir: {
                            ...config.hilir,
                            keywords: [
                              ...config.hilir.keywords,
                              {
                                label: newHilirKw,
                                upstream_id: "",
                                downstream_id: "",
                              },
                            ],
                          },
                        });
                        setNewHilirKw("");
                      }
                    }}
                    className="px-3 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Plus size={16} /> Tambah
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Kolom nilai yang diambil
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      FLOWRATE &rarr;
                    </span>
                    <input
                      type="text"
                      value={config.hilir.col_mmscf}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hilir: { ...config.hilir, col_mmscf: e.target.value },
                        })
                      }
                      className="text-gray-900 w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center bg-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm">
                      <input
                        type="checkbox"
                        checked={config.hilir.convert_mmscf || false}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            hilir: {
                              ...config.hilir,
                              convert_mmscf: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Konversi ke MMSCF
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">ENERGY &rarr;</span>
                    <input
                      type="text"
                      value={config.hilir.col_mmbtu}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hilir: { ...config.hilir, col_mmbtu: e.target.value },
                        })
                      }
                      className="text-gray-900 w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center bg-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm">
                      <input
                        type="checkbox"
                        checked={config.hilir.convert_mmbtu || false}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            hilir: {
                              ...config.hilir,
                              convert_mmbtu: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Konversi ke BBTU
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kelompok data 3 */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Kelompok data 3 — Stock (Tabel Terpisah)
            </h4>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-4">
                <p className="text-sm font-medium text-gray-700">
                  Pencarian &amp; rentang kolom nilai
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Cari keyword di kolom
                    </label>
                    <input
                      type="text"
                      value={config.stock.search_column}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          stock: {
                            ...config.stock,
                            search_column: e.target.value,
                          },
                        })
                      }
                      className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Keyword
                    </label>
                    <input
                      type="text"
                      value={config.stock.keyword}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          stock: { ...config.stock, keyword: e.target.value },
                        })
                      }
                      className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Kolom nilai mulai
                    </label>
                    <input
                      type="text"
                      value={config.stock.col_start}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          stock: { ...config.stock, col_start: e.target.value },
                        })
                      }
                      className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Kolom nilai akhir
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={config.stock.col_end}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            stock: { ...config.stock, col_end: e.target.value },
                          })
                        }
                        className="text-gray-900 flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={config.stock.convert_bbtu || false}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              stock: {
                                ...config.stock,
                                convert_bbtu: e.target.checked,
                              },
                            })
                          }
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        Konversi ke BBTU
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Mapping nama key (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={config.stock.key_mapping.join(", ")}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        stock: {
                          ...config.stock,
                          key_mapping: e.target.value
                            .split(",")
                            .map((k) => k.trim()),
                        },
                      })
                    }
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-mono text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Kolom C &rarr; I otomatis dipetakan ke nama key di atas
                    secara berurutan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <button
            onClick={handleSaveDefault}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-4 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
          >
            <Save size={16} /> Simpan sebagai default
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mr-2">
              <input
                type="checkbox"
                checked={isDebugMode}
                onChange={(e) => setIsDebugMode(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Debug Mode
            </label>
            <button
              onClick={handleResetDefault}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-4 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={16} /> Reset ke default
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploadMutation.isPending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-bold text-white bg-primary px-6 py-2.5 rounded-lg shadow-md hover:bg-[#0d4a5c] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} className="fill-current" />
              {uploadMutation.isPending ? "Memproses..." : "Proses"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

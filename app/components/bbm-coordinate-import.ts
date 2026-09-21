import type { BbmCoordinateCommitDetail, Site } from "@/hooks/service/site-api";

export type BbmCoordinateMatchStatus =
  | "CHANGED"
  | "UNCHANGED"
  | "CREATE"
  | "AMBIGUOUS";

export interface ParsedBbmCoordinateRow {
  rowNumber: number;
  sourceCode: string;
  sourceName: string;
  normalizedName: string;
  latitude: number;
  longitude: number;
  overriddenRowNumbers: number[];
}

export interface ClassifiedBbmCoordinateRow {
  row: ParsedBbmCoordinateRow;
  status: BbmCoordinateMatchStatus;
  site: Site | null;
  candidates: Site[];
  reason: string;
}

export type BbmCoordinateNoteCategory =
  | "CREATE"
  | "CREATED"
  | "AMBIGUOUS"
  | "DUPLICATE";

export interface BbmCoordinateNote {
  category: BbmCoordinateNoteCategory;
  categoryLabel: string;
  rowNumber: number;
  sourceCode: string;
  sourceName: string;
  latitude: number;
  longitude: number;
  reason: string;
  overriddenRowNumbers: number[];
  candidates: string[];
}

export interface BbmCoordinateNoteExportRow {
  Kategori: string;
  "Baris Terpilih": number;
  "Kode Sentral (Diabaikan)": string;
  "Nama Sentral Excel": string;
  Latitude: number;
  Longitude: number;
  Keterangan: string;
  "Baris Ditimpa": string;
  "Kandidat Site Server": string;
}

const NOTE_CATEGORY_LABEL: Record<BbmCoordinateNoteCategory, string> = {
  CREATE: "Akan Dibuat",
  CREATED: "Site Dibuat",
  AMBIGUOUS: "Ambigu",
  DUPLICATE: "Duplikat Excel",
};

const HEADER_ALIASES = {
  code: new Set(["kode_sentral", "kode sentral"]),
  name: new Set(["nama_sentral", "nama sentral", "site_name", "site name"]),
  latitude: new Set(["latitude", "lat"]),
  longitude: new Set(["longitude", "long", "lng"]),
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/\s+/g, " ");
}

export function normalizeCoordinateSiteName(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("id-ID");
}

function displayText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

function parseCoordinate(
  value: unknown,
  label: "latitude" | "longitude",
  rowNumber: number,
): number {
  const raw = displayText(value);
  if (!raw) throw new Error(`Baris ${rowNumber}: ${label} wajib diisi`);

  const normalized =
    raw.includes(",") && !raw.includes(".") ? raw.replace(",", ".") : raw;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Baris ${rowNumber}: ${label} bukan angka yang valid`);
  }

  const [minimum, maximum] = label === "latitude" ? [-90, 90] : [-180, 180];
  if (parsed < minimum || parsed > maximum) {
    throw new Error(
      `Baris ${rowNumber}: ${label} harus berada pada rentang ${minimum} sampai ${maximum}`,
    );
  }
  return Object.is(parsed, -0) ? 0 : parsed;
}

function findHeader(matrix: unknown[][]): {
  rowIndex: number;
  codeIndex?: number;
  nameIndex: number;
  latitudeIndex: number;
  longitudeIndex: number;
} {
  const scanLimit = Math.min(matrix.length, 100);
  for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
    const headers = (matrix[rowIndex] ?? []).map(normalizeHeader);
    const find = (aliases: Set<string>) =>
      headers.findIndex((header) => aliases.has(header));
    const codeIndex = find(HEADER_ALIASES.code);
    const nameIndex = find(HEADER_ALIASES.name);
    const latitudeIndex = find(HEADER_ALIASES.latitude);
    const longitudeIndex = find(HEADER_ALIASES.longitude);
    if (nameIndex >= 0 && latitudeIndex >= 0 && longitudeIndex >= 0) {
      return {
        rowIndex,
        ...(codeIndex >= 0 ? { codeIndex } : {}),
        nameIndex,
        latitudeIndex,
        longitudeIndex,
      };
    }
  }
  throw new Error(
    "Kolom wajib tidak ditemukan: nama_sentral, latitude, longitude. Kolom kode_sentral boleh ada tetapi akan diabaikan.",
  );
}

export function parseBbmCoordinateMatrix(
  matrix: unknown[][],
): ParsedBbmCoordinateRow[] {
  const { rowIndex, codeIndex, nameIndex, latitudeIndex, longitudeIndex } =
    findHeader(matrix);
  const parsedRows: ParsedBbmCoordinateRow[] = [];
  const errors: string[] = [];

  for (let index = rowIndex + 1; index < matrix.length; index += 1) {
    const source = matrix[index] ?? [];
    const rowNumber = index + 1;
    const rawName = source[nameIndex];
    const rawLatitude = source[latitudeIndex];
    const rawLongitude = source[longitudeIndex];
    if (
      [rawName, rawLatitude, rawLongitude].every(
        (value) =>
          value === null || value === undefined || displayText(value) === "",
      )
    ) {
      continue;
    }

    try {
      const sourceName = displayText(rawName);
      if (!sourceName) {
        throw new Error(`Baris ${rowNumber}: nama_sentral wajib diisi`);
      }
      parsedRows.push({
        rowNumber,
        sourceCode:
          codeIndex === undefined ? "" : displayText(source[codeIndex]),
        sourceName,
        normalizedName: normalizeCoordinateSiteName(sourceName),
        latitude: parseCoordinate(rawLatitude, "latitude", rowNumber),
        longitude: parseCoordinate(rawLongitude, "longitude", rowNumber),
        overriddenRowNumbers: [],
      });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (parsedRows.length === 0 && errors.length === 0) {
    errors.push("Worksheet tidak memiliki baris data koordinat");
  }
  if (errors.length > 0) {
    throw new Error(`Validasi worksheet gagal:\n- ${errors.join("\n- ")}`);
  }

  const uniqueRows = new Map<string, ParsedBbmCoordinateRow>();
  for (const row of parsedRows) {
    const previous = uniqueRows.get(row.normalizedName);
    if (previous) {
      row.overriddenRowNumbers = [
        ...previous.overriddenRowNumbers,
        previous.rowNumber,
      ];
    }
    // Baris paling bawah dianggap sebagai nilai terbaru.
    uniqueRows.set(row.normalizedName, row);
  }
  return [...uniqueRows.values()];
}

function coordinatesEqual(
  site: Site,
  latitude: number,
  longitude: number,
): boolean {
  if (site.lat == null || site.long == null) return false;
  const currentLatitude = Number(String(site.lat).trim());
  const currentLongitude = Number(String(site.long).trim());
  return (
    Number.isFinite(currentLatitude) &&
    Number.isFinite(currentLongitude) &&
    currentLatitude === latitude &&
    currentLongitude === longitude
  );
}

export function classifyBbmCoordinateRows(
  rows: ParsedBbmCoordinateRow[],
  sites: Site[],
): ClassifiedBbmCoordinateRow[] {
  const sitesByName = new Map<string, Site[]>();
  for (const site of sites) {
    if (
      !["PEMBANGKIT", "PEMASOK"].includes(site.site_type) ||
      site.commodity?.trim().toLocaleUpperCase("en-US") !== "BBM"
    ) {
      continue;
    }
    const key = normalizeCoordinateSiteName(site.name);
    sitesByName.set(key, [...(sitesByName.get(key) ?? []), site]);
  }

  return rows.map((row) => {
    const candidates = sitesByName.get(row.normalizedName) ?? [];
    if (candidates.length === 0) {
      return {
        row,
        status: "CREATE",
        site: null,
        candidates,
        reason: "Site baru akan dibuat sebagai Pembangkit BBM",
      };
    }
    if (candidates.length > 1) {
      return {
        row,
        status: "AMBIGUOUS",
        site: null,
        candidates,
        reason: `Nama cocok dengan ${candidates.length} site BBM di server`,
      };
    }

    const site = candidates[0];
    const unchanged = coordinatesEqual(site, row.latitude, row.longitude);
    return {
      row,
      status: unchanged ? "UNCHANGED" : "CHANGED",
      site,
      candidates,
      reason: unchanged
        ? "Koordinat server sudah sama"
        : "Koordinat akan diperbarui",
    };
  });
}

function appendCoordinateNotes(
  notes: BbmCoordinateNote[],
  source: {
    rowNumber: number;
    sourceCode?: string;
    sourceName: string;
    latitude: number;
    longitude: number;
    status: "CREATE" | "CREATED" | "AMBIGUOUS" | string;
    reason: string;
    overriddenRowNumbers?: number[];
    candidates?: string[];
  },
): void {
  const common = {
    rowNumber: source.rowNumber,
    sourceCode: source.sourceCode ?? "",
    sourceName: source.sourceName,
    latitude: source.latitude,
    longitude: source.longitude,
    overriddenRowNumbers: source.overriddenRowNumbers ?? [],
    candidates: source.candidates ?? [],
  };

  if (
    source.status === "CREATE" ||
    source.status === "CREATED" ||
    source.status === "AMBIGUOUS"
  ) {
    notes.push({
      ...common,
      category: source.status,
      categoryLabel: NOTE_CATEGORY_LABEL[source.status],
      reason: source.reason,
    });
  }
  if (common.overriddenRowNumbers.length > 0) {
    notes.push({
      ...common,
      category: "DUPLICATE",
      categoryLabel: NOTE_CATEGORY_LABEL.DUPLICATE,
      reason: `Menggunakan baris paling bawah; menimpa baris ${common.overriddenRowNumbers.join(", ")}`,
    });
  }
}

export function buildBbmCoordinateNotes(
  classifications: ClassifiedBbmCoordinateRow[],
): BbmCoordinateNote[] {
  const notes: BbmCoordinateNote[] = [];
  for (const item of classifications) {
    appendCoordinateNotes(notes, {
      rowNumber: item.row.rowNumber,
      sourceCode: item.row.sourceCode,
      sourceName: item.row.sourceName,
      latitude: item.row.latitude,
      longitude: item.row.longitude,
      status: item.status,
      reason: item.reason,
      overriddenRowNumbers: item.row.overriddenRowNumbers,
      candidates: item.candidates.map(
        (site) => `${site.name} (${site.site_type})`,
      ),
    });
  }
  return notes;
}

export function buildBbmCoordinateResultNotes(
  details: BbmCoordinateCommitDetail[],
): BbmCoordinateNote[] {
  const notes: BbmCoordinateNote[] = [];
  for (const detail of details) {
    appendCoordinateNotes(notes, {
      rowNumber: detail.rowNumber,
      sourceName: detail.sourceName,
      latitude: detail.latitude,
      longitude: detail.longitude,
      status: detail.status,
      reason: detail.reason,
      overriddenRowNumbers: detail.overriddenRowNumbers,
      candidates: detail.candidateNames,
    });
  }
  return notes;
}

export function toBbmCoordinateNoteExportRows(
  notes: BbmCoordinateNote[],
): BbmCoordinateNoteExportRow[] {
  return notes.map((note) => ({
    Kategori: note.categoryLabel,
    "Baris Terpilih": note.rowNumber,
    "Kode Sentral (Diabaikan)": note.sourceCode,
    "Nama Sentral Excel": note.sourceName,
    Latitude: note.latitude,
    Longitude: note.longitude,
    Keterangan: note.reason,
    "Baris Ditimpa": note.overriddenRowNumbers.join(", "),
    "Kandidat Site Server": note.candidates.join("; "),
  }));
}

export function toBbmCoordinateCommitRows(
  classifications: ClassifiedBbmCoordinateRow[],
) {
  return classifications.map(({ row }) => ({
    rowNumber: row.rowNumber,
    sourceName: row.sourceName,
    latitude: row.latitude,
    longitude: row.longitude,
    overriddenRowNumbers: row.overriddenRowNumbers,
  }));
}

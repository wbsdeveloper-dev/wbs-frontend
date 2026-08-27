import type { Site } from "@/hooks/service/site-api";

export type BbmImportSiteType = "PEMBANGKIT" | "PEMASOK";
export type ImportResolutionMode = "existing" | "create";

export interface MasterReference {
  id: string;
  name: string;
}

export interface ParsedBbmSiteRow {
  key: string;
  sheetName?: string;
  rowNumber: number;
  raw: {
    id: string;
    name: string;
    siteType: string;
    region: string;
    kit: string;
    upk: string;
    unit: string;
    capacity: string;
    capacityMw: string;
    status: string;
  };
  siteType: BbmImportSiteType | undefined;
  mode: ImportResolutionMode;
  siteId: string;
  createConfirmed: boolean;
  region: string | undefined;
  newRegionName: string | undefined;
  kitId: string | undefined;
  newKitName: string | undefined;
  upkId: string | undefined;
  newUpkName: string | undefined;
  unitId: string | undefined;
  newUnitName: string | undefined;
  capacity: number | undefined;
  capacityMw: number | undefined;
  isEnabled: boolean | undefined;
  errors: string[];
}

export interface BbmSiteCommitRow {
  sheetName?: string;
  rowNumber: number;
  mode: ImportResolutionMode;
  siteId?: string;
  name: string;
  siteType: BbmImportSiteType;
  region?: string;
  kitId?: string;
  kitName?: string;
  upkId?: string;
  upkName?: string;
  unitId?: string;
  unitName?: string;
  capacity?: number;
  capacityMw?: number;
  isEnabled?: boolean;
}

export type BbmReferenceType = "REGION" | "KIT" | "UPK" | "UNIT";

export interface BbmReferenceConfirmation {
  type: BbmReferenceType;
  name: string;
  confirmed: true;
}

export interface BbmPendingReference {
  key: string;
  type: BbmReferenceType;
  label: string;
  name: string;
}

const HEADER_ALIASES = {
  id: ["id", "id site"],
  name: ["nama site", "site", "nama"],
  siteType: ["tipe site", "jenis site", "jenis", "tipe"],
  region: ["region", "regional", "lokasi"],
  kit: ["jenis kit", "kit"],
  upk: ["unit pelaksana", "unit pelaksana pembangkitan", "upk", "pelaksana"],
  unit: ["unit"],
  capacity: [
    "kapasitas (kl)",
    "kapasitas kl",
    "kapasitas tangki",
    "kapasitas tanki",
    "tangki timbun",
    "kap. (kl)",
  ],
  capacityMw: [
    "kapasitas (mw)",
    "kapasitas mw",
    "kapasitas dmp (mw)",
    "kapasitas dmp mw",
    "daya mampu",
    "daya",
  ],
  status: ["status"],
} as const;

type HeaderKey = keyof typeof HEADER_ALIASES;

const SITE_CONFLICT_FIELDS = [
  "siteType",
  "region",
  "newRegionName",
  "kitId",
  "newKitName",
  "upkId",
  "newUpkName",
  "unitId",
  "newUnitName",
  "capacity",
  "capacityMw",
  "isEnabled",
] as const;

export function normalizeImportText(value: unknown): string {
  return String(value ?? "")
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

export function parseSpreadsheetNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const raw = displayText(value);
  if (!raw || raw === "-" || /^#(?:N\/A|VALUE!|DIV\/0!)$/i.test(raw)) {
    return undefined;
  }
  let normalized = raw.replace(/\s/g, "");
  if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(normalized)) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d+(?:,\d+)?$/.test(normalized)) {
    normalized = normalized.replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseCapacityMw(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const raw = displayText(value);
  if (!raw) return undefined;
  const multiplication = raw.match(
    /^\s*([\d.,]+)\s*[x×]\s*([\d.,]+)\s*(?:mw)?\s*$/i,
  );
  if (multiplication) {
    const count = parseSpreadsheetNumber(multiplication[1]);
    const perUnit = parseSpreadsheetNumber(multiplication[2]);
    if (count !== undefined && perUnit !== undefined) return count * perUnit;
  }
  return parseSpreadsheetNumber(raw.replace(/\s*mw\s*$/i, ""));
}

export function parseOptionalStatus(value: unknown): boolean | undefined {
  const normalized = normalizeImportText(value);
  if (!normalized) return undefined;
  if (["aktif", "active", "true", "yes", "ya", "1"].includes(normalized)) {
    return true;
  }
  if (
    [
      "nonaktif",
      "non-aktif",
      "tidak aktif",
      "inactive",
      "false",
      "no",
      "tidak",
      "0",
    ].includes(normalized)
  ) {
    return false;
  }
  return undefined;
}

export function parseBbmSiteType(
  value: unknown,
): BbmImportSiteType | undefined {
  const normalized = normalizeImportText(value);
  if (["pembangkit", "plant"].includes(normalized)) return "PEMBANGKIT";
  if (["pemasok", "tbbm", "supplier"].includes(normalized)) return "PEMASOK";
  return undefined;
}

function findHeaderIndex(
  headers: unknown[],
  key: HeaderKey,
): number | undefined {
  const index = headers.findIndex((header) => {
    const normalized = normalizeImportText(header);
    return HEADER_ALIASES[key].some((alias) => alias === normalized);
  });
  return index >= 0 ? index : undefined;
}

function findExactReference(
  value: string,
  references: MasterReference[],
): MasterReference | undefined {
  const normalized = normalizeImportText(value);
  if (!normalized) return undefined;
  return references.find(
    (reference) => normalizeImportText(reference.name) === normalized,
  );
}

function findExactSite(
  id: string,
  name: string,
  siteType: BbmImportSiteType | undefined,
  sites: Site[],
): Site | undefined {
  if (id) return sites.find((site) => site.id === id);
  if (!siteType) return undefined;
  const normalizedName = normalizeImportText(name);
  return sites.find(
    (site) =>
      site.site_type === siteType &&
      normalizeImportText(site.name) === normalizedName,
  );
}

export interface ParseBbmSiteOptions {
  sites: Site[];
  regions?: MasterReference[];
  kits: MasterReference[];
  upks: MasterReference[];
  units: MasterReference[];
  sheetName?: string;
}

export function parseBbmSiteMatrix(
  matrix: unknown[][],
  options: ParseBbmSiteOptions,
): ParsedBbmSiteRow[] {
  if (matrix.length < 2) return [];
  const headerRowIndex = matrix.findIndex((candidate, index) => {
    if (index >= 100) return false;
    return (
      findHeaderIndex(candidate ?? [], "name") !== undefined &&
      findHeaderIndex(candidate ?? [], "siteType") !== undefined
    );
  });
  if (headerRowIndex < 0) {
    const hasPairHeaders = matrix.slice(0, 100).some((candidate) => {
      const normalized = (candidate ?? []).map(normalizeImportText);
      return normalized.includes("pembangkit") && normalized.includes("tbbm");
    });
    if (hasPairHeaders) {
      throw new Error(
        "File menggunakan format pasangan lama. Download ulang template site terbaru dengan kolom Nama Site dan Tipe Site.",
      );
    }
    throw new Error("Kolom wajib tidak ditemukan: Nama Site, Tipe Site");
  }

  const headers = matrix[headerRowIndex] ?? [];
  const columns = Object.fromEntries(
    (Object.keys(HEADER_ALIASES) as HeaderKey[]).map((key) => [
      key,
      findHeaderIndex(headers, key),
    ]),
  ) as Record<HeaderKey, number | undefined>;
  const value = (row: unknown[], key: HeaderKey): unknown =>
    columns[key] === undefined ? "" : row[columns[key] as number];
  const read = (row: unknown[], key: HeaderKey) => displayText(value(row, key));

  const parsed: ParsedBbmSiteRow[] = [];
  for (let index = headerRowIndex + 1; index < matrix.length; index += 1) {
    const source = matrix[index] ?? [];
    if (source.every((cell) => !displayText(cell))) continue;
    const raw = {
      id: read(source, "id"),
      name: read(source, "name"),
      siteType: read(source, "siteType"),
      region: read(source, "region"),
      kit: read(source, "kit"),
      upk: read(source, "upk"),
      unit: read(source, "unit"),
      capacity: read(source, "capacity"),
      capacityMw: read(source, "capacityMw"),
      status: read(source, "status"),
    };
    if (!raw.id && !raw.name && !raw.siteType) continue;

    const siteType = parseBbmSiteType(raw.siteType);
    const existing = findExactSite(raw.id, raw.name, siteType, options.sites);
    const region = findExactReference(raw.region, options.regions ?? []);
    const kit = findExactReference(raw.kit, options.kits);
    const upk = findExactReference(raw.upk, options.upks);
    const unit = findExactReference(raw.unit, options.units);
    const capacity = parseSpreadsheetNumber(value(source, "capacity"));
    const capacityMw = parseCapacityMw(value(source, "capacityMw"));
    const isEnabled = parseOptionalStatus(raw.status);
    const errors: string[] = [];

    if (!raw.name) errors.push("Nama Site wajib diisi.");
    if (!siteType) {
      errors.push(
        `Tipe Site "${raw.siteType || "kosong"}" tidak valid; gunakan Pembangkit atau Pemasok/TBBM.`,
      );
    }
    if (raw.id && !existing)
      errors.push(`ID Site "${raw.id}" tidak ditemukan.`);
    if (existing && siteType && existing.site_type !== siteType) {
      errors.push(
        `Tipe Site tidak sesuai dengan site existing ${existing.name} (${existing.site_type}).`,
      );
    }
    if (raw.capacity && capacity === undefined) {
      errors.push(`Kapasitas kL "${raw.capacity}" tidak valid.`);
    }
    if (raw.capacityMw && capacityMw === undefined) {
      errors.push(`Kapasitas MW "${raw.capacityMw}" tidak valid.`);
    }
    if (raw.status && isEnabled === undefined) {
      errors.push(`Status "${raw.status}" tidak dikenali.`);
    }
    if (raw.region && !region && (options.regions?.length ?? 0) > 0) {
      errors.push(`Region "${raw.region}" belum dicocokkan.`);
    }
    if (
      siteType === "PEMASOK" &&
      (raw.kit || raw.upk || raw.unit || raw.capacity || raw.capacityMw)
    ) {
      errors.push(
        "Jenis Kit, Unit Pelaksana, Unit, kapasitas kL, dan kapasitas MW hanya berlaku untuk Pembangkit.",
      );
    }
    if (raw.kit && !kit)
      errors.push(`Jenis Kit "${raw.kit}" belum dicocokkan.`);
    if (raw.upk && !upk)
      errors.push(`Unit Pelaksana "${raw.upk}" belum dicocokkan.`);
    if (raw.unit && !unit) errors.push(`Unit "${raw.unit}" belum dicocokkan.`);

    parsed.push({
      key: `${options.sheetName ? `${options.sheetName}-` : ""}row-${index + 1}`,
      sheetName: options.sheetName,
      rowNumber: index + 1,
      raw,
      siteType,
      mode: existing ? "existing" : "create",
      siteId: existing?.id ?? "",
      createConfirmed: false,
      region: (region?.name ?? raw.region) || undefined,
      newRegionName: raw.region && !region ? raw.region : undefined,
      kitId: siteType === "PEMBANGKIT" ? kit?.id : undefined,
      newKitName:
        siteType === "PEMBANGKIT" && raw.kit && !kit ? raw.kit : undefined,
      upkId: siteType === "PEMBANGKIT" ? upk?.id : undefined,
      newUpkName:
        siteType === "PEMBANGKIT" && raw.upk && !upk ? raw.upk : undefined,
      unitId: siteType === "PEMBANGKIT" ? unit?.id : undefined,
      newUnitName:
        siteType === "PEMBANGKIT" && raw.unit && !unit ? raw.unit : undefined,
      capacity: siteType === "PEMBANGKIT" ? capacity : undefined,
      capacityMw: siteType === "PEMBANGKIT" ? capacityMw : undefined,
      isEnabled,
      errors,
    });
  }
  return parsed;
}

function resolutionKey(row: ParsedBbmSiteRow): string {
  return row.mode === "existing"
    ? `existing:${row.siteId}`
    : `create:${row.siteType}:${normalizeImportText(row.raw.name)}`;
}

export function getBbmSiteImportConflicts(
  rows: ParsedBbmSiteRow[],
): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  const groups = new Map<string, ParsedBbmSiteRow[]>();
  const append = (group: ParsedBbmSiteRow[], message: string) => {
    for (const row of group) {
      conflicts.set(row.key, [...(conflicts.get(row.key) ?? []), message]);
    }
  };

  for (const row of rows) {
    const key = resolutionKey(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  for (const group of groups.values()) {
    const names = new Set(
      group.map((row) => normalizeImportText(row.raw.name)),
    );
    if (group[0].mode === "existing" && names.size > 1) {
      append(group, "Beberapa nama mengarah ke site existing yang sama.");
      continue;
    }
    const hasConflict = SITE_CONFLICT_FIELDS.some((field) => {
      const values = new Set(
        group
          .map((row) => row[field])
          .filter((item) => item !== undefined)
          .map((item) =>
            JSON.stringify(
              typeof item === "string" ? normalizeImportText(item) : item,
            ),
          ),
      );
      return values.size > 1;
    });
    if (hasConflict) {
      append(group, "Site yang sama memiliki atribut berbeda pada baris lain.");
    }
  }
  return conflicts;
}

export function mergeBbmSiteImportRows(
  rows: ParsedBbmSiteRow[],
): ParsedBbmSiteRow[] {
  const groups = new Map<string, ParsedBbmSiteRow[]>();
  for (const row of rows) {
    const key = resolutionKey(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return rows.map((row) => {
    const group = groups.get(resolutionKey(row)) ?? [row];
    const merged = { ...row };
    for (const field of SITE_CONFLICT_FIELDS) {
      const supplied = group.find((item) => item[field] !== undefined);
      if (supplied)
        (merged as Record<string, unknown>)[field] = supplied[field];
    }
    return merged;
  });
}

export function bbmReferenceKey(type: BbmReferenceType, name: string): string {
  return `${type}:${normalizeImportText(name)}`;
}

export function getPendingBbmReferences(
  rows: ParsedBbmSiteRow[],
): BbmPendingReference[] {
  const references = new Map<string, BbmPendingReference>();
  const add = (type: BbmReferenceType, label: string, name?: string) => {
    if (!name) return;
    const key = bbmReferenceKey(type, name);
    if (!references.has(key)) references.set(key, { key, type, label, name });
  };
  for (const row of rows) {
    add("REGION", "Region", row.newRegionName);
    add("KIT", "Jenis Kit", row.newKitName);
    add("UPK", "Unit Pelaksana", row.newUpkName);
    add("UNIT", "Unit", row.newUnitName);
  }
  return [...references.values()];
}

export function toBbmSiteCommitRows(
  rows: ParsedBbmSiteRow[],
): BbmSiteCommitRow[] {
  return rows.map((row) => ({
    ...(row.sheetName ? { sheetName: row.sheetName } : {}),
    rowNumber: row.rowNumber,
    mode: row.mode,
    ...(row.mode === "existing" ? { siteId: row.siteId } : {}),
    name: row.raw.name,
    siteType: row.siteType as BbmImportSiteType,
    ...(row.region ? { region: row.region } : {}),
    ...(row.kitId ? { kitId: row.kitId } : {}),
    ...(row.newKitName ? { kitName: row.newKitName } : {}),
    ...(row.upkId ? { upkId: row.upkId } : {}),
    ...(row.newUpkName ? { upkName: row.newUpkName } : {}),
    ...(row.unitId ? { unitId: row.unitId } : {}),
    ...(row.newUnitName ? { unitName: row.newUnitName } : {}),
    ...(row.capacity !== undefined ? { capacity: row.capacity } : {}),
    ...(row.capacityMw !== undefined ? { capacityMw: row.capacityMw } : {}),
    ...(row.isEnabled !== undefined ? { isEnabled: row.isEnabled } : {}),
  }));
}

import type {
  BbmRelationCommitPayload,
  Site,
  SiteRelation,
} from "@/hooks/service/site-api";

export interface ParsedBbmRelationRow {
  key: string;
  rowNumber: number;
  relationId: string;
  sourceSiteId: string;
  sourceName: string;
  targetSiteId: string;
  targetName: string;
  transportMode: string;
  status: "ACTIVE" | "INACTIVE" | undefined;
  notes: string;
  existingRelation: SiteRelation | undefined;
  action:
    | "CREATE"
    | "UPDATE"
    | "REACTIVATE"
    | "DEACTIVATE"
    | "UNCHANGED"
    | "INVALID";
  errors: string[];
}

const HEADER_ALIASES = {
  relationId: ["id relasi", "relation id"],
  sourceSiteId: ["id tbbm", "id pemasok", "source site id"],
  targetSiteId: ["id pembangkit", "target site id"],
  sourceName: ["nama tbbm", "tbbm", "nama pemasok"],
  targetName: ["nama pembangkit", "pembangkit"],
  transportMode: ["moda angkutan", "transport mode", "moda"],
  status: ["status"],
  notes: ["catatan", "notes", "keterangan"],
} as const;

type HeaderKey = keyof typeof HEADER_ALIASES;

export function normalizeBbmRelationText(value: unknown): string {
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

function findHeader(headers: unknown[], key: HeaderKey): number | undefined {
  const index = headers.findIndex((header) =>
    HEADER_ALIASES[key].includes(normalizeBbmRelationText(header) as never),
  );
  return index < 0 ? undefined : index;
}

export function parseBbmRelationStatus(
  value: unknown,
): "ACTIVE" | "INACTIVE" | undefined {
  const normalized = normalizeBbmRelationText(value);
  if (["aktif", "active"].includes(normalized)) return "ACTIVE";
  if (
    ["tidak aktif", "tidak-aktif", "nonaktif", "inactive"].includes(normalized)
  ) {
    return "INACTIVE";
  }
  return undefined;
}

function eligibleSite(site: Site, type: "PEMASOK" | "PEMBANGKIT") {
  return (
    site.site_type === type &&
    site.is_enabled &&
    site.commodity?.trim().toUpperCase() === "BBM"
  );
}

function resolveSite(
  id: string,
  name: string,
  type: "PEMASOK" | "PEMBANGKIT",
  label: string,
  sites: Site[],
): { site?: Site; errors: string[] } {
  const errors: string[] = [];
  if (!name) errors.push(`${label} wajib diisi.`);
  const eligible = sites.filter((site) => eligibleSite(site, type));
  if (id) {
    const site = sites.find((candidate) => candidate.id === id);
    if (!site) return { errors: [`ID ${label} "${id}" tidak ditemukan.`] };
    if (!eligibleSite(site, type)) {
      errors.push(`${label} dari ID harus aktif dan terdaftar sebagai BBM.`);
    }
    if (
      name &&
      normalizeBbmRelationText(site.name) !== normalizeBbmRelationText(name)
    ) {
      errors.push(
        `ID dan nama ${label} tidak konsisten (ID adalah "${site.name}").`,
      );
    }
    return { site, errors };
  }
  if (!name) return { errors };
  const matches = eligible.filter(
    (site) =>
      normalizeBbmRelationText(site.name) === normalizeBbmRelationText(name),
  );
  if (matches.length === 0) errors.push(`${label} "${name}" tidak ditemukan.`);
  if (matches.length > 1)
    errors.push(`${label} "${name}" ambigu (${matches.length} data).`);
  return { site: matches.length === 1 ? matches[0] : undefined, errors };
}

function nullableText(value: string | null | undefined) {
  return value?.trim() || "";
}

function determineAction(
  existing: SiteRelation | undefined,
  status: "ACTIVE" | "INACTIVE" | undefined,
  transportMode: string,
  notes: string,
  errors: string[],
): ParsedBbmRelationRow["action"] {
  if (errors.length || !status) return "INVALID";
  if (!existing) return "CREATE";
  if (existing.status === "INACTIVE" && status === "ACTIVE")
    return "REACTIVATE";
  if (existing.status === "ACTIVE" && status === "INACTIVE")
    return "DEACTIVATE";
  if (
    nullableText(existing.transport_mode) !== nullableText(transportMode) ||
    nullableText(existing.notes) !== nullableText(notes) ||
    existing.priority !== 1 ||
    existing.commodity?.trim().toUpperCase() !== "BBM"
  ) {
    return "UPDATE";
  }
  return "UNCHANGED";
}

export function parseBbmRelationMatrix(
  matrix: unknown[][],
  options: { sites: Site[]; relations: SiteRelation[] },
): ParsedBbmRelationRow[] {
  const headerRowIndex = matrix.slice(0, 100).findIndex((candidate) => {
    const headers = candidate ?? [];
    return (
      findHeader(headers, "sourceName") !== undefined &&
      findHeader(headers, "targetName") !== undefined &&
      findHeader(headers, "status") !== undefined
    );
  });
  if (headerRowIndex < 0) {
    throw new Error(
      "Kolom wajib tidak ditemukan: Nama TBBM, Nama Pembangkit, Status",
    );
  }
  const headers = matrix[headerRowIndex] ?? [];
  const columns = Object.fromEntries(
    (Object.keys(HEADER_ALIASES) as HeaderKey[]).map((key) => [
      key,
      findHeader(headers, key),
    ]),
  ) as Record<HeaderKey, number | undefined>;
  const value = (source: unknown[], key: HeaderKey) =>
    columns[key] === undefined ? "" : source[columns[key] as number];
  const rows: ParsedBbmRelationRow[] = [];

  for (let index = headerRowIndex + 1; index < matrix.length; index += 1) {
    const source = matrix[index] ?? [];
    if (source.every((cell) => !displayText(cell))) continue;
    const rowNumber = index + 1;
    const relationId = displayText(value(source, "relationId"));
    const sourceSiteId = displayText(value(source, "sourceSiteId"));
    const targetSiteId = displayText(value(source, "targetSiteId"));
    const sourceName = displayText(value(source, "sourceName"));
    const targetName = displayText(value(source, "targetName"));
    const transportMode = displayText(value(source, "transportMode"));
    const rawStatus = displayText(value(source, "status"));
    const status = parseBbmRelationStatus(rawStatus);
    const notes = displayText(value(source, "notes"));
    if (
      !relationId &&
      !sourceSiteId &&
      !targetSiteId &&
      !sourceName &&
      !targetName &&
      !rawStatus
    ) {
      continue;
    }

    const sourceResolution = resolveSite(
      sourceSiteId,
      sourceName,
      "PEMASOK",
      "TBBM",
      options.sites,
    );
    const targetResolution = resolveSite(
      targetSiteId,
      targetName,
      "PEMBANGKIT",
      "Pembangkit",
      options.sites,
    );
    const errors = [...sourceResolution.errors, ...targetResolution.errors];
    if (!status)
      errors.push(
        `Status "${rawStatus || "kosong"}" tidak valid; gunakan AKTIF atau TIDAK AKTIF.`,
      );

    const relationFromId = relationId
      ? options.relations.find((relation) => relation.id === relationId)
      : undefined;
    if (relationId && !relationFromId)
      errors.push(`ID Relasi "${relationId}" tidak ditemukan.`);
    const pairRelation =
      sourceResolution.site && targetResolution.site
        ? options.relations.find(
            (relation) =>
              relation.source_site_id === sourceResolution.site?.id &&
              relation.target_site_id === targetResolution.site?.id &&
              relation.relation_type === "PEMASOK - PEMBANGKIT",
          )
        : undefined;
    if (
      relationFromId &&
      sourceResolution.site &&
      targetResolution.site &&
      (relationFromId.source_site_id !== sourceResolution.site.id ||
        relationFromId.target_site_id !== targetResolution.site.id ||
        relationFromId.relation_type !== "PEMASOK - PEMBANGKIT")
    ) {
      errors.push("ID Relasi dan pasangan TBBM–Pembangkit tidak konsisten.");
    }
    if (
      relationFromId &&
      pairRelation &&
      relationFromId.id !== pairRelation.id
    ) {
      errors.push("Pasangan sudah dimiliki ID Relasi lain (konflik unique).");
    }
    const existingRelation = relationFromId ?? pairRelation;
    if (!existingRelation && status === "INACTIVE") {
      errors.push("Relasi baru TIDAK AKTIF tidak diperbolehkan.");
    }

    rows.push({
      key: `row-${rowNumber}`,
      rowNumber,
      relationId,
      sourceSiteId: sourceResolution.site?.id ?? sourceSiteId,
      sourceName,
      targetSiteId: targetResolution.site?.id ?? targetSiteId,
      targetName,
      transportMode,
      status,
      notes,
      existingRelation,
      action: determineAction(
        existingRelation,
        status,
        transportMode,
        notes,
        errors,
      ),
      errors,
    });
  }

  if (rows.length > 5000)
    throw new Error("Maksimum 5.000 baris relasi per file.");
  const pairRows = new Map<string, ParsedBbmRelationRow[]>();
  for (const row of rows) {
    if (!row.sourceSiteId || !row.targetSiteId) continue;
    const key = `${row.sourceSiteId}:${row.targetSiteId}`;
    pairRows.set(key, [...(pairRows.get(key) ?? []), row]);
  }
  for (const duplicates of pairRows.values()) {
    if (duplicates.length < 2) continue;
    const numbers = duplicates.map((row) => row.rowNumber).join(", ");
    for (const row of duplicates) {
      row.errors.push(`Pasangan duplikat dalam file pada baris ${numbers}.`);
      row.action = "INVALID";
    }
  }
  return rows;
}

export function toBbmRelationCommitRows(
  rows: ParsedBbmRelationRow[],
): BbmRelationCommitPayload["rows"] {
  return rows.map((row) => ({
    rowNumber: row.rowNumber,
    ...(row.relationId ? { relationId: row.relationId } : {}),
    ...(row.sourceSiteId ? { sourceSiteId: row.sourceSiteId } : {}),
    sourceName: row.sourceName,
    ...(row.targetSiteId ? { targetSiteId: row.targetSiteId } : {}),
    targetName: row.targetName,
    ...(row.transportMode ? { transportMode: row.transportMode } : {}),
    status: row.status as "ACTIVE" | "INACTIVE",
    ...(row.notes ? { notes: row.notes } : {}),
  }));
}

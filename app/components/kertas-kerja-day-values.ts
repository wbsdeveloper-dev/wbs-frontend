export const KERTAS_KERJA_DAY_FIELDS = [
  "hop",
  "shop_akhir_bulan",
  "renominaso_proyeksi_akhir_bulan",
  "rencana_hop",
] as const;

export type KertasKerjaDayField = (typeof KERTAS_KERJA_DAY_FIELDS)[number];

const DAY_FIELD_SET = new Set<string>(KERTAS_KERJA_DAY_FIELDS);

export function isKertasKerjaDayField(
  field: string,
): field is KertasKerjaDayField {
  return DAY_FIELD_SET.has(field);
}

/**
 * Rounds day-based values to the nearest whole day while preserving empty and
 * non-numeric values. Examples: 8.2 -> 8, 8.5 -> 9, null -> null.
 */
export function roundKertasKerjaDayValue<T>(value: T): T | number {
  if (value === null || value === undefined || value === "") return value;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.round(numericValue) : value;
}

export function roundKertasKerjaDayFields<T extends object>(record: T): T {
  const rounded = { ...record } as unknown as Record<string, unknown>;
  for (const field of KERTAS_KERJA_DAY_FIELDS) {
    if (field in rounded) {
      rounded[field] = roundKertasKerjaDayValue(rounded[field]);
    }
  }
  return rounded as unknown as T;
}

import type { RecordKertasKerja } from "@/hooks/service/kertas-kerja-api";

export interface KertasKerjaDeltaCalculation {
  delta_terima: number | null;
  pencapaian: number | null;
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates Delta (Real - Nominasi) and Pencapaian for one record/month.
 *
 * Delta Terima = Realisasi Terima - Nominasi Pesan
 * Pencapaian (%) = Realisasi Terima / Nominasi Pesan * 100
 */
export function calculateKertasKerjaDelta(
  record: Pick<RecordKertasKerja, "terima" | "rencana_pesan">,
): KertasKerjaDeltaCalculation {
  const realization = toFiniteNumber(record.terima);
  const nomination = toFiniteNumber(record.rencana_pesan);

  if (realization === null || nomination === null) {
    return { delta_terima: null, pencapaian: null };
  }

  return {
    delta_terima: roundToTwoDecimals(realization - nomination),
    pencapaian:
      nomination === 0
        ? null
        : roundToTwoDecimals((realization / nomination) * 100),
  };
}

export function withCalculatedKertasKerjaDelta<T extends RecordKertasKerja>(
  record: T,
): T {
  return {
    ...record,
    ...calculateKertasKerjaDelta(record),
  };
}

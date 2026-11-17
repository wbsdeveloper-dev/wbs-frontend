import assert from "node:assert/strict";
import test from "node:test";
import {
  buildKertasKerjaHeaderGroups,
  findKertasKerjaMonthColumn,
  getKertasKerjaSubcategoryColumns,
} from "./kertas-kerja-header-mapper.ts";
import { normalizeKertasKerjaMonth } from "./kertas-kerja-month-normalizer.ts";

function createHeaders() {
  const groupHeader: unknown[] = [];
  const subcategoryHeader: unknown[] = [];
  const monthHeader: unknown[] = [];

  groupHeader[10] = "REALISASI (SAP)";
  groupHeader[14] = "RENOMINASI/KONFIRMASI";
  groupHeader[18] = "NOMINASI";
  groupHeader[22] = "KETERANGAN";

  subcategoryHeader[10] = "TERIMA (kL)";
  subcategoryHeader[14] = "PESAN (kL)";
  subcategoryHeader[16] = "PROYEKSI SHOP AKHIR BULAN (Hari)";
  subcategoryHeader[18] = "PESAN (kL)";
  subcategoryHeader[20] = "HOP (Hari)";

  monthHeader[10] = "JAN '26";
  monthHeader[11] = "FEB '26";
  monthHeader[14] = "JAN '26";
  monthHeader[15] = "FEB '26";
  monthHeader[16] = "JAN '26";
  monthHeader[17] = "FEB '26";
  monthHeader[18] = "JAN '26";
  monthHeader[19] = "FEB '26";
  monthHeader[20] = "JAN '26";
  monthHeader[21] = "FEB '26";

  return { groupHeader, subcategoryHeader, monthHeader };
}

test("maps NOMINASI PESAN and HOP without matching RENOMINASI", () => {
  const { groupHeader, subcategoryHeader, monthHeader } = createHeaders();
  const groups = buildKertasKerjaHeaderGroups(groupHeader, 24);
  const pesanColumns = getKertasKerjaSubcategoryColumns(
    groups,
    subcategoryHeader,
    ["NOMINASI", "RENCANA"],
    "PESAN",
  );
  const hopColumns = getKertasKerjaSubcategoryColumns(
    groups,
    subcategoryHeader,
    ["NOMINASI", "RENCANA"],
    "HOP",
  );

  assert.deepEqual(pesanColumns, [18, 19]);
  assert.deepEqual(hopColumns, [20, 21]);
  assert.equal(
    findKertasKerjaMonthColumn(
      pesanColumns,
      monthHeader,
      subcategoryHeader,
      "Jan '26",
      normalizeKertasKerjaMonth,
    ),
    18,
  );
  assert.equal(
    findKertasKerjaMonthColumn(
      hopColumns,
      monthHeader,
      subcategoryHeader,
      "Jan '26",
      normalizeKertasKerjaMonth,
    ),
    20,
  );
});

test("uses legacy RENCANA only when NOMINASI is absent", () => {
  const groupHeader: unknown[] = [];
  const subcategoryHeader: unknown[] = [];
  const monthHeader: unknown[] = [];

  groupHeader[4] = "RENCANA (PROGNOSA)";
  groupHeader[8] = "KETERANGAN";
  subcategoryHeader[4] = "PESAN (kL)";
  subcategoryHeader[6] = "HOP (Hari)";
  monthHeader[4] = "JAN '26";
  monthHeader[5] = "FEB '26";
  monthHeader[6] = "JAN '26";
  monthHeader[7] = "FEB '26";

  const groups = buildKertasKerjaHeaderGroups(groupHeader, 10);
  assert.deepEqual(
    getKertasKerjaSubcategoryColumns(
      groups,
      subcategoryHeader,
      ["NOMINASI", "RENCANA"],
      "PESAN",
    ),
    [4, 5],
  );
  assert.deepEqual(
    getKertasKerjaSubcategoryColumns(
      groups,
      subcategoryHeader,
      ["NOMINASI", "RENCANA"],
      "HOP",
    ),
    [6, 7],
  );
});

test("does not fall back to a matching month outside the requested group", () => {
  const { groupHeader, subcategoryHeader, monthHeader } = createHeaders();
  const groups = buildKertasKerjaHeaderGroups(groupHeader, 24);
  const nominasiPesanColumns = getKertasKerjaSubcategoryColumns(
    groups,
    subcategoryHeader,
    ["NOMINASI"],
    "PESAN",
  );

  assert.equal(
    findKertasKerjaMonthColumn(
      nominasiPesanColumns,
      monthHeader,
      subcategoryHeader,
      "Mar '26",
      normalizeKertasKerjaMonth,
    ),
    -1,
  );
});

test("prefers NOMINASI over RENCANA when both groups exist", () => {
  const groupHeader: unknown[] = [];
  const subcategoryHeader: unknown[] = [];

  groupHeader[2] = "RENCANA (PROGNOSA)";
  groupHeader[4] = "NOMINASI";
  groupHeader[6] = "KETERANGAN";
  subcategoryHeader[2] = "PESAN (kL)";
  subcategoryHeader[4] = "PESAN (kL)";

  const groups = buildKertasKerjaHeaderGroups(groupHeader, 8);
  assert.deepEqual(
    getKertasKerjaSubcategoryColumns(
      groups,
      subcategoryHeader,
      ["NOMINASI", "RENCANA"],
      "PESAN",
    ),
    [4, 5],
  );
});

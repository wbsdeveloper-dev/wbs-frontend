import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateKertasKerjaDelta,
  withCalculatedKertasKerjaDelta,
} from "./kertas-kerja-calculations.ts";

test("calculates same-month Delta Terima and Pencapaian", () => {
  assert.deepEqual(
    calculateKertasKerjaDelta({ terima: 120, rencana_pesan: 100 }),
    {
      delta_terima: 20,
      pencapaian: 120,
    },
  );
});

test("keeps negative Delta Terima when realization is below nomination", () => {
  assert.deepEqual(
    calculateKertasKerjaDelta({ terima: 75, rencana_pesan: 100 }),
    {
      delta_terima: -25,
      pencapaian: 75,
    },
  );
});

test("rounds calculated decimal values to two decimal places", () => {
  assert.deepEqual(
    calculateKertasKerjaDelta({ terima: 100, rencana_pesan: 30 }),
    {
      delta_terima: 70,
      pencapaian: 333.33,
    },
  );
});

test("returns empty calculated values when either source value is missing", () => {
  assert.deepEqual(
    calculateKertasKerjaDelta({ terima: undefined, rencana_pesan: 100 }),
    {
      delta_terima: null,
      pencapaian: null,
    },
  );
  assert.deepEqual(
    calculateKertasKerjaDelta({ terima: 100, rencana_pesan: undefined }),
    {
      delta_terima: null,
      pencapaian: null,
    },
  );
});

test("calculates Delta but leaves Pencapaian empty for zero nomination", () => {
  assert.deepEqual(
    calculateKertasKerjaDelta({ terima: 100, rencana_pesan: 0 }),
    {
      delta_terima: 100,
      pencapaian: null,
    },
  );
});

test("overwrites stale stored calculations on a complete monthly record", () => {
  assert.deepEqual(
    withCalculatedKertasKerjaDelta({
      template_kertas_kerja_id: "template-1",
      month_work: "Nov '26",
      terima: 90,
      rencana_pesan: 120,
      delta_terima: 999,
      pencapaian: 999,
    }),
    {
      template_kertas_kerja_id: "template-1",
      month_work: "Nov '26",
      terima: 90,
      rencana_pesan: 120,
      delta_terima: -30,
      pencapaian: 75,
    },
  );
});

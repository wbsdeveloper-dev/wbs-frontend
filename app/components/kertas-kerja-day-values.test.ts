import assert from "node:assert/strict";
import test from "node:test";
import {
  isKertasKerjaDayField,
  roundKertasKerjaDayFields,
  roundKertasKerjaDayValue,
} from "./kertas-kerja-day-values.ts";

test("rounds SHOP and HOP values to the nearest whole day", () => {
  assert.equal(roundKertasKerjaDayValue(8.2), 8);
  assert.equal(roundKertasKerjaDayValue(8.5), 9);
  assert.equal(roundKertasKerjaDayValue("10.6"), 11);
  assert.equal(roundKertasKerjaDayValue(null), null);
  assert.equal(roundKertasKerjaDayValue(undefined), undefined);
  assert.equal(roundKertasKerjaDayValue("-"), "-");
});

test("rounds only day-based Kertas Kerja record fields", () => {
  const record = roundKertasKerjaDayFields({
    hop: 8.2,
    shop_akhir_bulan: 10.6,
    renominaso_proyeksi_akhir_bulan: 9.5,
    rencana_hop: 12.1,
    stock: 362.15,
    pencapaian: 92.44,
  });

  assert.deepEqual(record, {
    hop: 8,
    shop_akhir_bulan: 11,
    renominaso_proyeksi_akhir_bulan: 10,
    rencana_hop: 12,
    stock: 362.15,
    pencapaian: 92.44,
  });
});

test("identifies all configured day fields", () => {
  assert.equal(isKertasKerjaDayField("hop"), true);
  assert.equal(isKertasKerjaDayField("shop_akhir_bulan"), true);
  assert.equal(isKertasKerjaDayField("renominaso_proyeksi_akhir_bulan"), true);
  assert.equal(isKertasKerjaDayField("rencana_hop"), true);
  assert.equal(isKertasKerjaDayField("stock"), false);
});

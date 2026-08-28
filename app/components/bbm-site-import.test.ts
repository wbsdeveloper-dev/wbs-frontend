import assert from "node:assert/strict";
import test from "node:test";
import type { Site } from "@/hooks/service/site-api";
import {
  getBbmSiteImportConflicts,
  getPendingBbmReferences,
  mergeBbmSiteImportRows,
  parseBbmSiteMatrix,
  parseBbmSiteType,
  parseCapacityMw,
  parseOptionalStatus,
  parseSpreadsheetNumber,
  toBbmSiteCommitRows,
} from "./bbm-site-import";

const plant: Site = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "PLTD Bawean",
  site_type: "PEMBANGKIT",
  region: "Jamali",
  capacity: 400,
  capacity_mw: 10,
  commodity: "BBM",
  is_enabled: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const supplier: Site = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "TBBM Perak",
  site_type: "PEMASOK",
  region: "Jamali",
  commodity: "BBM",
  is_enabled: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const options = {
  sites: [plant, supplier],
  regions: [{ id: "region-1", name: "Jamali" }],
  units: [{ id: "unit-1", name: "PLN IP" }],
  upks: [{ id: "upk-1", name: "UID Jatim" }],
  kits: [{ id: "kit-1", name: "PLTD" }],
};

test("parses site types, multiplied MW, Indonesian numbers, and template statuses", () => {
  assert.equal(parseBbmSiteType("Pembangkit"), "PEMBANGKIT");
  assert.equal(parseBbmSiteType("TBBM"), "PEMASOK");
  assert.equal(parseBbmSiteType("Pemasok"), "PEMASOK");
  assert.equal(parseCapacityMw("2x710"), 1420);
  assert.equal(parseCapacityMw(2.155), 2.155);
  assert.equal(parseSpreadsheetNumber("1.250,5"), 1250.5);
  assert.equal(parseOptionalStatus("Aktif"), true);
  assert.equal(parseOptionalStatus("Tidak Aktif"), false);
});

test("blank optional values remain undefined", () => {
  assert.equal(parseOptionalStatus(""), undefined);
  const [row] = parseBbmSiteMatrix(
    [
      ["Nama Site", "Tipe Site", "Region", "Kapasitas (MW)", "Status"],
      ["PLTD Bawean", "Pembangkit", "", "", ""],
    ],
    options,
  );
  assert.equal(row.region, undefined);
  assert.equal(row.capacityMw, undefined);
  assert.equal(row.isEnabled, undefined);
});

test("matches an existing site by exact normalized name and type", () => {
  const [row] = parseBbmSiteMatrix(
    [
      [
        "Nama Site",
        "Tipe Site",
        "Region",
        "Jenis Kit",
        "Unit Pelaksana",
        "Unit",
        "Kapasitas (kL)",
        "Kapasitas (MW)",
        "Status",
      ],
      [
        "  PLTD   Bawean ",
        "Pembangkit",
        "Jamali",
        "PLTD",
        "UID Jatim",
        "PLN IP",
        400,
        "2x710",
        "Aktif",
      ],
    ],
    options,
  );

  assert.equal(row.mode, "existing");
  assert.equal(row.siteId, plant.id);
  assert.equal(row.siteType, "PEMBANGKIT");
  assert.equal(row.capacity, 400);
  assert.equal(row.capacityMw, 1420);
  assert.equal(row.rowNumber, 2);
});

test("matches by ID and rejects a mismatched type", () => {
  const [row] = parseBbmSiteMatrix(
    [
      ["ID", "Nama Site", "Tipe Site"],
      [plant.id, plant.name, "TBBM"],
    ],
    options,
  );
  assert.equal(row.siteId, plant.id);
  assert.match(row.errors.join(" "), /Tipe Site tidak sesuai/);
});

test("new sites require explicit create confirmation", () => {
  const [row] = parseBbmSiteMatrix(
    [
      ["Nama Site", "Tipe Site"],
      ["TBBM Baru", "TBBM"],
    ],
    options,
  );
  assert.equal(row.mode, "create");
  assert.equal(row.siteType, "PEMASOK");
  assert.equal(row.createConfirmed, false);
});

test("supplier rows reject Pembangkit-only attributes", () => {
  const [row] = parseBbmSiteMatrix(
    [
      ["Nama Site", "Tipe Site", "Jenis Kit", "Kapasitas (MW)"],
      ["TBBM Perak", "Pemasok", "PLTD", 10],
    ],
    options,
  );
  assert.match(row.errors.join(" "), /hanya berlaku untuk Pembangkit/);
});

test("pair-format files request the new independent-site template", () => {
  assert.throws(
    () =>
      parseBbmSiteMatrix(
        [
          ["Pembangkit", "TBBM", "Moda Angkutan"],
          ["PLTD Bawean", "TBBM Perak", "Shipping"],
        ],
        options,
      ),
    /format pasangan lama.*Nama Site dan Tipe Site/,
  );
});

test("complementary duplicate values merge without conflict", () => {
  const rows = parseBbmSiteMatrix(
    [
      ["Nama Site", "Tipe Site", "Kapasitas (kL)", "Kapasitas (MW)"],
      ["PLTD Bawean", "Pembangkit", 400, ""],
      ["PLTD Bawean", "Pembangkit", "", "2x710"],
    ],
    options,
  );
  assert.equal(getBbmSiteImportConflicts(rows).size, 0);
  const merged = mergeBbmSiteImportRows(rows);
  assert.equal(merged[0].capacity, 400);
  assert.equal(merged[0].capacityMw, 1420);
  assert.equal(merged[1].capacity, 400);
  assert.equal(merged[1].capacityMw, 1420);
});

test("unmatched master values are preserved and deduplicated for confirmation", () => {
  const rows = parseBbmSiteMatrix(
    [
      [
        "Nama Site",
        "Tipe Site",
        "Region",
        "Jenis Kit",
        "Unit Pelaksana",
        "Unit",
      ],
      [
        "PLTD Bawean",
        "Pembangkit",
        "Region Baru",
        "PLTMG",
        "UPK Baru",
        "UIW Baru",
      ],
      [
        "PLTD Bawean",
        "Pembangkit",
        " region  baru ",
        "PLTMG",
        "UPK Baru",
        "UIW Baru",
      ],
    ],
    options,
  );

  assert.equal(rows[0].region, "Region Baru");
  assert.equal(rows[0].newRegionName, "Region Baru");
  assert.equal(rows[0].newKitName, "PLTMG");
  assert.equal(rows[0].newUpkName, "UPK Baru");
  assert.equal(rows[0].newUnitName, "UIW Baru");
  assert.deepEqual(
    getPendingBbmReferences(rows).map(({ type, name }) => ({ type, name })),
    [
      { type: "REGION", name: "Region Baru" },
      { type: "KIT", name: "PLTMG" },
      { type: "UPK", name: "UPK Baru" },
      { type: "UNIT", name: "UIW Baru" },
    ],
  );
  const [payload] = toBbmSiteCommitRows(rows);
  assert.equal(payload.region, "Region Baru");
  assert.equal(payload.kitName, "PLTMG");
  assert.equal(payload.upkName, "UPK Baru");
  assert.equal(payload.unitName, "UIW Baru");
});

test("distinct supplied values for the same site conflict", () => {
  const rows = parseBbmSiteMatrix(
    [
      ["Nama Site", "Tipe Site", "Kapasitas (kL)"],
      ["PLTD Bawean", "Pembangkit", 400],
      ["PLTD Bawean", "Pembangkit", 500],
    ],
    options,
  );
  assert.equal(getBbmSiteImportConflicts(rows).size, 2);
});

test("commit rows contain sites only and no relation properties", () => {
  const rows = parseBbmSiteMatrix(
    [
      ["Nama Site", "Tipe Site", "Region", "Status"],
      ["TBBM Perak", "TBBM", "Jamali", "Aktif"],
    ],
    options,
  );
  const [payload] = toBbmSiteCommitRows(rows);
  assert.equal(payload.siteType, "PEMASOK");
  assert.equal(payload.siteId, supplier.id);
  assert.equal("supplier" in payload, false);
  assert.equal("transportMode" in payload, false);
});

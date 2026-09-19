import assert from "node:assert/strict";
import test from "node:test";
import type { Site, SiteRelation } from "@/hooks/service/site-api";
import {
  parseBbmRelationMatrix,
  parseBbmRelationStatus,
  toBbmRelationCommitRows,
} from "./bbm-relation-import";

const supplier: Site = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "TBBM Perak",
  site_type: "PEMASOK",
  region: "Jamali",
  commodity: "BBM",
  is_enabled: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};
const plant: Site = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "PLTD Bawean",
  site_type: "PEMBANGKIT",
  region: "Jamali",
  commodity: "BBM",
  is_enabled: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};
const relation: SiteRelation = {
  id: "33333333-3333-4333-8333-333333333333",
  source_site_id: supplier.id,
  source_site_name: supplier.name,
  target_site_id: plant.id,
  target_site_name: plant.name,
  relation_type: "PEMASOK - PEMBANGKIT",
  status: "ACTIVE",
  priority: 1,
  commodity: "BBM",
  transport_mode: "Kapal",
  notes: "Utama",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};
const headers = [
  "ID Relasi",
  "ID TBBM",
  "ID Pembangkit",
  "Nama TBBM",
  "Nama Pembangkit",
  "Moda Angkutan",
  "Status",
  "Catatan",
];

function parse(
  dataRows: unknown[][],
  sites = [supplier, plant],
  relations = [relation],
) {
  return parseBbmRelationMatrix([headers, ...dataRows], { sites, relations });
}

test("parses Indonesian relation statuses", () => {
  assert.equal(parseBbmRelationStatus("AKTIF"), "ACTIVE");
  assert.equal(parseBbmRelationStatus("Tidak Aktif"), "INACTIVE");
  assert.equal(parseBbmRelationStatus("unknown"), undefined);
});

test("existing template row matches hidden IDs and is unchanged", () => {
  const [row] = parse([
    [
      relation.id,
      supplier.id,
      plant.id,
      supplier.name,
      plant.name,
      "Kapal",
      "AKTIF",
      "Utama",
    ],
  ]);
  assert.equal(row.existingRelation?.id, relation.id);
  assert.equal(row.action, "UNCHANGED");
  assert.deepEqual(row.errors, []);
});

test("new active row resolves exact normalized names without IDs", () => {
  const [row] = parse(
    [["", "", "", "  TBBM  Perak ", "PLTD BAWEAN", "Truk", "AKTIF", ""]],
    [supplier, plant],
    [],
  );
  assert.equal(row.sourceSiteId, supplier.id);
  assert.equal(row.targetSiteId, plant.id);
  assert.equal(row.action, "CREATE");
  assert.deepEqual(row.errors, []);
  const [commit] = toBbmRelationCommitRows([row]);
  assert.equal(commit.sourceSiteId, supplier.id);
  assert.equal(commit.status, "ACTIVE");
  assert.equal("priority" in commit, false);
  assert.equal("commodity" in commit, false);
  assert.equal("relationType" in commit, false);
  assert.equal("validFrom" in commit, false);
});

test("ID and name mismatch is rejected", () => {
  const [row] = parse([
    [
      relation.id,
      supplier.id,
      plant.id,
      "TBBM Lain",
      plant.name,
      "Kapal",
      "AKTIF",
      "",
    ],
  ]);
  assert.equal(row.action, "INVALID");
  assert.match(row.errors.join(" "), /ID dan nama TBBM tidak konsisten/);
});

test("ambiguous normalized site name is rejected", () => {
  const duplicate = { ...supplier, id: "44444444-4444-4444-8444-444444444444" };
  const [row] = parse(
    [["", "", "", supplier.name, plant.name, "", "AKTIF", ""]],
    [supplier, duplicate, plant],
    [],
  );
  assert.equal(row.action, "INVALID");
  assert.match(row.errors.join(" "), /TBBM.*ambigu/);
});

test("new inactive relation is rejected", () => {
  const [row] = parse(
    [["", "", "", supplier.name, plant.name, "", "TIDAK AKTIF", ""]],
    [supplier, plant],
    [],
  );
  assert.equal(row.action, "INVALID");
  assert.match(row.errors.join(" "), /Relasi baru TIDAK AKTIF/);
});

test("duplicate pair rows are both rejected", () => {
  const rows = parse(
    [
      ["", "", "", supplier.name, plant.name, "Kapal", "AKTIF", ""],
      ["", "", "", supplier.name, plant.name, "Truk", "AKTIF", ""],
    ],
    [supplier, plant],
    [],
  );
  assert.equal(rows.length, 2);
  assert.equal(
    rows.every((row) => row.action === "INVALID"),
    true,
  );
  assert.match(rows[0].errors.join(" "), /baris 2, 3/);
});

test("inactive or non-BBM sites are rejected even when hidden ID is present", () => {
  const disabledSupplier = { ...supplier, is_enabled: false };
  const [row] = parse(
    [["", supplier.id, plant.id, supplier.name, plant.name, "", "AKTIF", ""]],
    [disabledSupplier, plant],
    [],
  );
  assert.equal(row.action, "INVALID");
  assert.match(row.errors.join(" "), /harus aktif dan terdaftar sebagai BBM/);
});

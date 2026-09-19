import assert from "node:assert/strict";
import test from "node:test";
import type { Site } from "@/hooks/service/site-api";
import {
  buildBbmCoordinateNotes,
  buildBbmCoordinateResultNotes,
  classifyBbmCoordinateRows,
  normalizeCoordinateSiteName,
  parseBbmCoordinateMatrix,
  toBbmCoordinateCommitRows,
  toBbmCoordinateNoteExportRows,
} from "./bbm-coordinate-import";

const plant: Site = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "PLTD Tanah Merah",
  site_type: "PEMBANGKIT",
  region: "Kalimantan",
  lat: "3.7",
  long: "117.5",
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
  lat: "-7.21",
  long: "112.73",
  commodity: "BBM",
  is_enabled: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

test("parses attached column layout and ignores kode_sentral", () => {
  const rows = parseBbmCoordinateMatrix([
    ["Laporan koordinat"],
    ["kode_sentral", "nama_sentral", "latitude", "longitude"],
    [21443040102, "  PLTD   Tanah Merah ", "3,727528", 117.568111],
  ]);

  assert.deepEqual(rows, [
    {
      rowNumber: 3,
      sourceCode: "21443040102",
      sourceName: "PLTD Tanah Merah",
      normalizedName: "pltd tanah merah",
      latitude: 3.727528,
      longitude: 117.568111,
      overriddenRowNumbers: [],
    },
  ]);
  assert.equal(
    normalizeCoordinateSiteName(" PLTD  TANAH MERAH "),
    "pltd tanah merah",
  );
});

test("accepts aliases and requires valid coordinate ranges", () => {
  assert.equal(
    parseBbmCoordinateMatrix([
      ["site_name", "lat", "lng"],
      ["TBBM Perak", -7.21, 112.73],
    ])[0].sourceCode,
    "",
  );
  assert.throws(
    () =>
      parseBbmCoordinateMatrix([
        ["nama_sentral", "latitude", "longitude"],
        ["SITE A", 91, 106],
        ["SITE B", -7, 181],
        ["SITE C", "abc", 110],
      ]),
    /rentang -90 sampai 90[\s\S]*rentang -180 sampai 180[\s\S]*bukan angka/,
  );
  assert.throws(
    () => parseBbmCoordinateMatrix([["kode_sentral", "nama_sentral"]]),
    /Kolom wajib tidak ditemukan/,
  );
});

test("bottom-most duplicate wins and records overridden rows", () => {
  const rows = parseBbmCoordinateMatrix([
    ["kode_sentral", "nama_sentral", "latitude", "longitude"],
    ["1", "PLTD Tanah Merah", 3.7, 117.5],
    ["2", " pltd  tanah merah ", 3.8, 117.6],
    ["3", "PLTD TANAH MERAH", 3.9, 117.7],
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].rowNumber, 4);
  assert.equal(rows[0].sourceCode, "3");
  assert.equal(rows[0].latitude, 3.9);
  assert.deepEqual(rows[0].overriddenRowNumbers, [2, 3]);
});

test("classifies changed, unchanged, create, and ambiguous across both BBM site types", () => {
  const rows = parseBbmCoordinateMatrix([
    ["nama_sentral", "latitude", "longitude"],
    ["pltd tanah merah", 3.727528, 117.568111],
    ["TBBM PERAK", -7.21, 112.73],
    ["Tidak Ada", -6, 106],
    ["Site Duplikat", -5, 105],
  ]);
  const duplicate = (id: string): Site => ({
    ...plant,
    id,
    name: "Site Duplikat",
  });
  const classifications = classifyBbmCoordinateRows(rows, [
    plant,
    supplier,
    duplicate("33333333-3333-4333-8333-333333333333"),
    duplicate("44444444-4444-4444-8444-444444444444"),
    {
      ...plant,
      id: "55555555-5555-4555-8555-555555555555",
      name: "Tidak Ada",
      commodity: "GAS PIPA",
    },
  ]);

  assert.deepEqual(
    classifications.map((item) => item.status),
    ["CHANGED", "UNCHANGED", "CREATE", "AMBIGUOUS"],
  );
  assert.equal(classifications[0].site?.site_type, "PEMBANGKIT");
  assert.equal(classifications[1].site?.site_type, "PEMASOK");
  assert.equal(classifications[3].candidates.length, 2);

  const payload = toBbmCoordinateCommitRows(classifications);
  assert.deepEqual(payload[0], {
    rowNumber: 2,
    sourceName: "pltd tanah merah",
    latitude: 3.727528,
    longitude: 117.568111,
    overriddenRowNumbers: [],
  });
  assert.equal("sourceCode" in payload[0], false);
});

test("groups notes by create, ambiguous, and duplicate categories for export", () => {
  const parsedRows = parseBbmCoordinateMatrix([
    ["kode_sentral", "nama_sentral", "latitude", "longitude"],
    ["OLD", "Tidak Ada", -6.1, 106.1],
    ["NEW", " tidak  ada ", -6.2, 106.2],
    ["DUP", "Site Duplikat", -5, 105],
  ]);
  const duplicate = (id: string): Site => ({
    ...plant,
    id,
    name: "Site Duplikat",
  });
  const classifications = classifyBbmCoordinateRows(parsedRows, [
    duplicate("33333333-3333-4333-8333-333333333333"),
    duplicate("44444444-4444-4444-8444-444444444444"),
  ]);

  const notes = buildBbmCoordinateNotes(classifications);
  assert.deepEqual(
    notes.map((note) => note.category),
    ["CREATE", "DUPLICATE", "AMBIGUOUS"],
  );
  assert.equal(notes[0].sourceCode, "NEW");
  assert.deepEqual(notes[1].overriddenRowNumbers, [2]);

  const exported = toBbmCoordinateNoteExportRows(notes);
  assert.equal(exported[0].Kategori, "Akan Dibuat");
  assert.equal(exported[0]["Nama Sentral Excel"], "tidak ada");
  assert.equal(exported[1]["Baris Ditimpa"], "2");
  assert.match(exported[2]["Kandidat Site Server"], /Site Duplikat/);
});

test("builds categorized notes from server result details", () => {
  const notes = buildBbmCoordinateResultNotes([
    {
      rowNumber: 8,
      sourceName: "Tidak Ada",
      latitude: -6,
      longitude: 106,
      overriddenRowNumbers: [5],
      status: "CREATED",
      reason: "Site berhasil dibuat sebagai Pembangkit BBM",
      siteId: "55555555-5555-4555-8555-555555555555",
      siteName: "Tidak Ada",
      siteType: "PEMBANGKIT",
      previousLatitude: null,
      previousLongitude: null,
      candidateNames: [],
    },
  ]);
  assert.deepEqual(
    notes.map((note) => note.category),
    ["CREATED", "DUPLICATE"],
  );
  assert.equal(
    notes[1].reason,
    "Menggunakan baris paling bawah; menimpa baris 5",
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  buildKertasKerjaOrganizationAssignments,
  calculateNameSimilarity,
  canonicalKertasKerjaUnitName,
  canonicalKertasKerjaUpkName,
  filterBbmReferences,
  findKertasKerjaTemplateByReferences,
  mergeSavedKertasKerjaTemplates,
  resolveNamedReference,
  type NamedReference,
} from "./kertas-kerja-auto-resolution";
import {
  normalizeKertasKerjaModa,
  normalizeKertasKerjaSite,
} from "./kertas-kerja-template-matcher";

const sites: NamedReference[] = [
  { id: "siantan", name: "PLTD Siantan" },
  { id: "sintang", name: "PLTD Sintang" },
  { id: "sanggau", name: "PLTD Sanggau" },
];

test("keeps only BBM references for Kertas Kerja upload", () => {
  const references = filterBbmReferences([
    { id: "bbm", name: "PLTG Tarahan", commodity: "BBM" },
    { id: "bbm-spaced", name: "TBBM Panjang", commodity: " bbm " },
    { id: "gas", name: "Pemasok Gas", commodity: "GAS PIPA" },
    { id: "lng", name: "Pemasok LNG", commodity: "LNG" },
    { id: "empty", name: "Tanpa Komoditas", commodity: null },
  ]);

  assert.deepEqual(
    references.map((reference) => reference.id),
    ["bbm", "bbm-spaced"],
  );
});

test("keeps a saved template when the reload response does not contain it yet", () => {
  const savedTemplate = {
    id: "template-new",
    site_id: "site-1",
    supplier_id: "supplier-1",
    product_id: "product-1",
    moda_id: "moda-1",
  };
  const merged = mergeSavedKertasKerjaTemplates([savedTemplate], []);

  assert.equal(merged.length, 1);
  assert.equal(
    findKertasKerjaTemplateByReferences(merged, {
      site_id: "site-1",
      supplier_id: "supplier-1",
      product_id: "product-1",
      moda_id: "moda-1",
    })?.id,
    "template-new",
  );
});

test("prefers the bulk save result over a duplicate loaded template", () => {
  const references = {
    site_id: "site-1",
    supplier_id: "supplier-1",
    product_id: "product-1",
    moda_id: "moda-1",
  };
  const merged = mergeSavedKertasKerjaTemplates(
    [{ id: "template-1", ...references, is_active: true }],
    [{ id: "template-1", ...references, is_active: false }],
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].is_active, true);
});

test("calculates normalized Levenshtein similarity", () => {
  assert.equal(calculateNameSimilarity("truck", "truck"), 1);
  assert.ok(calculateNameSimilarity("siantan", "siantn") > 0.85);
  assert.ok(calculateNameSimilarity("siantan", "pontianak") < 0.5);
});

test("resolves a controlled alias before fuzzy matching", () => {
  const result = resolveNamedReference(
    [{ id: "truck", name: "Truck" }],
    "Trucking",
    normalizeKertasKerjaModa,
    { threshold: 0.82, margin: 0.1, minimumLength: 4 },
  );

  assert.equal(result.status, "matched");
  if (result.status !== "matched") return;
  assert.equal(result.reference.id, "truck");
  assert.equal(result.strategy, "exact");
  assert.equal(result.score, 1);
});

test("accepts an unambiguous high-confidence typo", () => {
  const result = resolveNamedReference(
    sites.filter((site) => site.id !== "sintang"),
    "PLTD Siantann",
    normalizeKertasKerjaSite,
    { threshold: 0.9, margin: 0.08 },
  );

  assert.equal(result.status, "matched");
  if (result.status !== "matched") return;
  assert.equal(result.reference.id, "siantan");
  assert.equal(result.strategy, "fuzzy");
  assert.ok(result.score >= 0.9);
});

test("rejects a close result when the best candidates are ambiguous", () => {
  const result = resolveNamedReference(
    [
      { id: "siantan", name: "Siantan" },
      { id: "sintan", name: "Sintang" },
    ],
    "Sintan",
    normalizeKertasKerjaSite,
    { threshold: 0.8, margin: 0.1 },
  );

  assert.equal(result.status, "ambiguous");
  if (result.status !== "ambiguous") return;
  assert.deepEqual(
    result.candidates.map((candidate) => candidate.id),
    ["siantan", "sintan"],
  );
});

test("does not fuzzy-match unrelated locations", () => {
  const result = resolveNamedReference(
    sites,
    "TBBM Pontianak",
    normalizeKertasKerjaSite,
    { threshold: 0.9, margin: 0.08 },
  );

  assert.equal(result.status, "missing");
});

test("returns every exact duplicate so the user can choose the PLTG Tarahan master", () => {
  const result = resolveNamedReference(
    [
      { id: "bbm-site", name: "PLTG Tarahan" },
      { id: "other-site", name: "  PLTG   TARAHAN " },
      { id: "combined-site", name: "PLTG TARAHAN, PLTD TARAHAN" },
    ],
    "PLTG Tarahan",
    normalizeKertasKerjaSite,
    { threshold: 0.9, margin: 0.08 },
  );

  assert.equal(result.status, "ambiguous");
  if (result.status !== "ambiguous") return;
  assert.deepEqual(
    result.candidates.map((candidate) => candidate.id),
    ["bbm-site", "other-site"],
  );
});

test("does not select arbitrarily when normalized names are duplicated", () => {
  const result = resolveNamedReference(
    [
      { id: "truck-1", name: "Truck" },
      { id: "truck-2", name: "Trucking" },
    ],
    "Truk",
    normalizeKertasKerjaModa,
    { threshold: 0.82, margin: 0.1, minimumLength: 4 },
  );

  assert.equal(result.status, "ambiguous");
  if (result.status !== "ambiguous") return;
  assert.deepEqual(
    result.candidates.map((candidate) => candidate.id),
    ["truck-1", "truck-2"],
  );
});

test("derives a canonical Unit name from a numbered worksheet name", () => {
  assert.equal(canonicalKertasKerjaUnitName("01. KALTIMRA"), "KALTIMRA");
  assert.equal(canonicalKertasKerjaUnitName("12 - UID JAYA"), "UID JAYA");
  assert.equal(canonicalKertasKerjaUnitName("TELUK MELANO"), "TELUK MELANO");
});

test("normalizes Unit Pelaksana whitespace without changing its label", () => {
  assert.equal(canonicalKertasKerjaUpkName("  UPK   MAHAKAM  "), "UPK MAHAKAM");
});

test("deduplicates organization assignments for the same Pembangkit", () => {
  const assignments = buildKertasKerjaOrganizationAssignments([
    {
      siteId: "site-1",
      siteName: "PLTD Melak",
      unitName: "01. KALTIMRA",
      upkName: "UPK Mahakam",
      sheetName: "01. KALTIMRA",
      rowNumber: 7,
    },
    {
      siteId: "site-1",
      siteName: "PLTD Melak",
      unitName: "KALTIMRA",
      upkName: "  UPK Mahakam ",
      sheetName: "01. KALTIMRA",
      rowNumber: 8,
    },
  ]);

  assert.deepEqual(assignments, [
    {
      siteId: "site-1",
      siteName: "PLTD Melak",
      unitName: "KALTIMRA",
      upkName: "UPK Mahakam",
      sheetName: "01. KALTIMRA",
      rowNumber: 7,
    },
  ]);
});

test("uses the last Excel organization mapping for one Pembangkit", () => {
  const assignments = buildKertasKerjaOrganizationAssignments([
    {
      siteId: "site-1",
      siteName: "Tanjung Batu",
      unitName: "PIP",
      upkName: "UPK PIP",
      sheetName: "02. PIP",
      rowNumber: 13,
    },
    {
      siteId: "site-1",
      siteName: "Tanjung Batu",
      unitName: "UID Kaltimra",
      upkName: "UPK Kaltimra",
      sheetName: "04. UID Kaltimra",
      rowNumber: 32,
    },
  ]);

  assert.deepEqual(assignments, [
    {
      siteId: "site-1",
      siteName: "Tanjung Batu",
      unitName: "UID Kaltimra",
      upkName: "UPK Kaltimra",
      sheetName: "04. UID Kaltimra",
      rowNumber: 32,
    },
  ]);
});

test("blank organization cells do not erase the previous Excel mapping", () => {
  const assignments = buildKertasKerjaOrganizationAssignments([
    {
      siteId: "site-1",
      siteName: "Tanjung Batu",
      unitName: "UID Kaltimra",
      upkName: "UPK Kaltimra",
      sheetName: "04. UID Kaltimra",
      rowNumber: 32,
    },
    {
      siteId: "site-1",
      siteName: "Tanjung Batu",
      unitName: "",
      upkName: "",
      sheetName: "04. UID Kaltimra",
      rowNumber: 33,
    },
  ]);

  assert.equal(assignments[0].unitName, "UID Kaltimra");
  assert.equal(assignments[0].upkName, "UPK Kaltimra");
});

test("does not fuzzy-match names shorter than the configured minimum", () => {
  const result = resolveNamedReference(
    [{ id: "mfo", name: "MFO" }],
    "MFA",
    (value) => String(value).toLowerCase(),
    { threshold: 0.6, margin: 0.1, minimumLength: 4 },
  );

  assert.equal(result.status, "missing");
});

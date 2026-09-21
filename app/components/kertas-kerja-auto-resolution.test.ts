import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateNameSimilarity,
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

test("does not fuzzy-match names shorter than the configured minimum", () => {
  const result = resolveNamedReference(
    [{ id: "mfo", name: "MFO" }],
    "MFA",
    (value) => String(value).toLowerCase(),
    { threshold: 0.6, margin: 0.1, minimumLength: 4 },
  );

  assert.equal(result.status, "missing");
});

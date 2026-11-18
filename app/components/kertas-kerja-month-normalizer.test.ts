import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeKertasKerjaMonth,
  parseKertasKerjaMonth,
  reconcileKertasKerjaMonthTimeline,
} from "./kertas-kerja-month-normalizer.ts";

const primaryTimeline = [
  "04 DES 2025",
  "04 JAN 2026",
  "4 FEB 2026",
  "03 MAR 2026",
  "02 APR 2026",
  "04 MEI 2026",
  "03 JUN 2025",
  "02 Juli 2026",
  "3 Agus 2026",
  "2 SEPT 2026",
  "2 OKT 2025",
  "4 NOV 2026",
  "02 DES 2026",
  "05 JAN 2027",
];

const canonicalTimeline = [
  "Des '25",
  "Jan '26",
  "Feb '26",
  "Mar '26",
  "Apr '26",
  "Mei '26",
  "Jun '26",
  "Jul '26",
  "Agu '26",
  "Sep '26",
  "Okt '26",
  "Nov '26",
  "Des '26",
  "Jan '27",
];

test("normalizes Indonesian and English month aliases", () => {
  assert.equal(normalizeKertasKerjaMonth("Ket Juni 2026"), "Jun '26");
  assert.equal(normalizeKertasKerjaMonth("AGU'26"), "Agu '26");
  assert.equal(normalizeKertasKerjaMonth("September 2026"), "Sep '26");
  assert.deepEqual(parseKertasKerjaMonth("05 JAN 2027"), {
    monthIndex: 0,
    year: 2027,
    canonical: "Jan '27",
  });
});

test("normalizes Jamali Excel serial, ISO, and Date month headers", () => {
  assert.equal(normalizeKertasKerjaMonth(46023), "Jan '26");
  assert.equal(normalizeKertasKerjaMonth(46357), "Des '26");
  assert.equal(normalizeKertasKerjaMonth("2027-01-01"), "Jan '27");
  assert.equal(
    normalizeKertasKerjaMonth(new Date("2026-08-01T00:00:00.000Z")),
    "Agu '26",
  );
  assert.equal(normalizeKertasKerjaMonth(12), "12");
});

test("corrects isolated year typos using header consensus and chronology", () => {
  const supportingHeaders = [
    ...canonicalTimeline,
    ...canonicalTimeline,
    ...canonicalTimeline,
    ...primaryTimeline,
  ];

  const result = reconcileKertasKerjaMonthTimeline(
    primaryTimeline,
    supportingHeaders,
  );

  assert.equal(result.confidence, "high");
  assert.deepEqual(result.months, canonicalTimeline);
  assert.deepEqual(
    result.corrections.map((correction) => ({
      originalMonth: correction.originalMonth,
      correctedMonth: correction.correctedMonth,
    })),
    [
      { originalMonth: "Jun '25", correctedMonth: "Jun '26" },
      { originalMonth: "Okt '25", correctedMonth: "Okt '26" },
    ],
  );
  assert.ok(
    result.corrections.every((correction) => correction.supportingHeaders >= 3),
  );
});

test("corrects the duplicated final January in the Jamali primary timeline", () => {
  const jamaliPrimaryTimeline = [
    "04 DES 2025",
    "04 JAN 2026",
    "4 FEB 2026",
    "2 MAR 2026",
    "01 APR 2026",
    "03 MEI 2026",
    "02 JUNI 2026",
    "02 JULI 2026",
    "3 AGUSTUS 2026",
    "1 SEPT 2026",
    "4 OKT 2026",
    "4 NOV 2026",
    "03 DES 2026",
    "05 JAN 2026",
  ];
  const excelMonthHeaders = [
    46023, 46054, 46082, 46113, 46143, 46174, 46204, 46235, 46266, 46296, 46327,
    46357,
  ];
  const supportingHeaders = [
    ...excelMonthHeaders,
    ...excelMonthHeaders,
    ...canonicalTimeline,
    ...canonicalTimeline,
  ];

  const result = reconcileKertasKerjaMonthTimeline(
    jamaliPrimaryTimeline,
    supportingHeaders,
  );

  assert.deepEqual(result.months, canonicalTimeline);
  assert.ok(
    result.corrections.some(
      (correction) =>
        correction.originalMonth === "Jan '26" &&
        correction.correctedMonth === "Jan '27",
    ),
  );
});

test("preserves valid periods before and after the majority year", () => {
  const result = reconcileKertasKerjaMonthTimeline(canonicalTimeline, [
    ...canonicalTimeline,
    ...canonicalTimeline,
  ]);

  assert.deepEqual(result.months, canonicalTimeline);
  assert.deepEqual(result.corrections, []);
  assert.equal(result.months[0], "Des '25");
  assert.equal(result.months.at(-1), "Jan '27");
});

test("does not guess when supporting headers have no clear consensus", () => {
  const conflictingTimeline = ["Mei '26", "Jun '25", "Jul '26"];
  const result = reconcileKertasKerjaMonthTimeline(conflictingTimeline, [
    "Mei '26",
    "Jun '25",
    "Jun '26",
    "Jul '26",
  ]);

  assert.equal(result.confidence, "low");
  assert.deepEqual(result.months, conflictingTimeline);
  assert.deepEqual(result.corrections, []);
});

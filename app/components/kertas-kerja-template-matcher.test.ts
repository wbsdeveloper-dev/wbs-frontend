import assert from "node:assert/strict";
import test from "node:test";
import {
  buildKertasKerjaUnmatchedKey,
  canonicalKertasKerjaModaName,
  matchKertasKerjaTemplate,
  normalizeKertasKerjaModa,
  normalizeKertasKerjaProduct,
  normalizeKertasKerjaSite,
  normalizeKertasKerjaSupplier,
  type KertasKerjaTemplateIdentity,
} from "./kertas-kerja-template-matcher";

const b40Template: KertasKerjaTemplateIdentity = {
  id: "template-b40-pontianak",
  site_name: "Siantan",
  product_name: "B40",
  supplier_name: "TBBM PERTAMINA PONTIANAK",
  moda_name: "Truck",
};

test("normalizes formatting without changing the site identity", () => {
  assert.equal(normalizeKertasKerjaSite("  PLTD   Siantan  "), "pltd siantan");
  assert.notEqual(
    normalizeKertasKerjaSite("Siantan"),
    normalizeKertasKerjaSite("Sintang"),
  );
});

test("maps controlled Biosolar aliases to B40", () => {
  assert.equal(normalizeKertasKerjaProduct("Biosolar"), "b40");
  assert.equal(normalizeKertasKerjaProduct("Bio Solar"), "b40");
  assert.equal(normalizeKertasKerjaProduct("B-40"), "b40");
  assert.equal(normalizeKertasKerjaProduct("MFO"), "mfo");
});

test("maps controlled transport aliases to canonical master names", () => {
  assert.equal(normalizeKertasKerjaModa("Trucking"), "truck");
  assert.equal(normalizeKertasKerjaModa("Truk"), "truck");
  assert.equal(canonicalKertasKerjaModaName("Trucking"), "Truck");
  assert.equal(normalizeKertasKerjaModa("Kapal"), "shipping");
});

test("ignores optional PERTAMINA token in supplier identity", () => {
  assert.equal(
    normalizeKertasKerjaSupplier("TBBM PERTAMINA PONTIANAK"),
    normalizeKertasKerjaSupplier("TBBM Pontianak"),
  );
  assert.notEqual(
    normalizeKertasKerjaSupplier("TBBM Pontianak"),
    normalizeKertasKerjaSupplier("TBBM Sintang"),
  );
});

test("groups equivalent unmatched identities but keeps different transport modes separate", () => {
  const first = buildKertasKerjaUnmatchedKey({
    siteName: " Siantan ",
    productName: "Biosolar",
    supplierName: "TBBM Pontianak",
    modaName: "Trucking",
  });
  const equivalent = buildKertasKerjaUnmatchedKey({
    siteName: "SIANTAN",
    productName: "B40",
    supplierName: "TBBM PERTAMINA PONTIANAK",
    modaName: "trucking",
  });
  const differentModa = buildKertasKerjaUnmatchedKey({
    siteName: "Siantan",
    productName: "B40",
    supplierName: "TBBM Pontianak",
    modaName: "Shipping",
  });

  assert.equal(first, equivalent);
  assert.notEqual(first, differentModa);
});

test("matches Biosolar, shortened supplier, and Trucking to the B40 template", () => {
  const result = matchKertasKerjaTemplate([b40Template], {
    siteName: "Siantan",
    productName: "Biosolar",
    supplierName: "TBBM Pontianak",
    modaName: "Trucking",
  });

  assert.equal(result.status, "matched");
  if (result.status !== "matched") return;
  assert.equal(result.template.id, b40Template.id);
  assert.equal(result.strategy, "normalized");
});

test("prefers an exact normalized-text match before alias matching", () => {
  const biosolarTemplate: KertasKerjaTemplateIdentity = {
    ...b40Template,
    id: "template-biosolar-pontianak",
    product_name: "Biosolar",
    supplier_name: "TBBM Pontianak",
  };

  const result = matchKertasKerjaTemplate([b40Template, biosolarTemplate], {
    siteName: " SIANTAN ",
    productName: "BIOSOLAR",
    supplierName: "TBBM  PONTIANAK",
    modaName: "TRUCK",
  });

  assert.equal(result.status, "matched");
  if (result.status !== "matched") return;
  assert.equal(result.template.id, biosolarTemplate.id);
  assert.equal(result.strategy, "exact");
});

test("rejects a normalized identity that matches multiple templates", () => {
  const duplicate: KertasKerjaTemplateIdentity = {
    ...b40Template,
    id: "template-b40-pontianak-duplicate",
    product_name: "Biosolar",
    supplier_name: "TBBM Pontianak",
  };

  const result = matchKertasKerjaTemplate([b40Template, duplicate], {
    siteName: "Siantan",
    productName: "Bio Solar",
    supplierName: "TBBM-Pontianak",
    modaName: "Truk",
  });

  assert.equal(result.status, "ambiguous");
  if (result.status !== "ambiguous") return;
  assert.deepEqual(
    result.candidates.map((candidate) => candidate.id),
    [b40Template.id, duplicate.id],
  );
});

test("does not match a different site or supplier", () => {
  assert.equal(
    matchKertasKerjaTemplate([b40Template], {
      siteName: "Sintang",
      productName: "Biosolar",
      supplierName: "TBBM Pontianak",
      modaName: "Truck",
    }).status,
    "unmatched",
  );

  assert.equal(
    matchKertasKerjaTemplate([b40Template], {
      siteName: "Siantan",
      productName: "Biosolar",
      supplierName: "TBBM Sintang",
      modaName: "Truck",
    }).status,
    "unmatched",
  );
  assert.equal(
    matchKertasKerjaTemplate([b40Template], {
      siteName: "Siantan",
      productName: "Biosolar",
      supplierName: "TBBM Pontianak",
      modaName: "Shipping",
    }).status,
    "unmatched",
  );
});

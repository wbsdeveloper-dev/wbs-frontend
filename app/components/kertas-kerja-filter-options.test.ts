import assert from "node:assert/strict";
import test from "node:test";
import type {
  MasterGeneric,
  TemplateKertasKerja,
} from "@/hooks/service/kertas-kerja-api";
import { getActiveKertasKerjaRegions } from "./kertas-kerja-filter-options";

const region = (id: string, name: string): MasterGeneric => ({
  id,
  name,
  comodity: "BBM",
  created_at: "2026-01-01",
});

const template = (
  id: string,
  siteRegion: string,
  isActive?: boolean,
): TemplateKertasKerja => ({
  id,
  site_id: `site-${id}`,
  supplier_id: `supplier-${id}`,
  product_id: `product-${id}`,
  moda_id: `moda-${id}`,
  hop_minimum: 5,
  created_at: "2026-01-01",
  site_region: siteRegion,
  ...(isActive === undefined ? {} : { is_active: isActive }),
});

test("returns only Regions referenced by active working-paper templates", () => {
  const regions = [
    region("region-1", "Jamali"),
    region("region-2", "Sulmapana"),
    region("region-3", "Kalteng"),
  ];
  const templates = [
    template("1", "Jamali", true),
    template("2", "Sulmapana", false),
  ];

  assert.deepEqual(
    getActiveKertasKerjaRegions(regions, templates).map((item) => item.name),
    ["Jamali"],
  );
});

test("keeps a Region when it has both active and inactive templates", () => {
  const regions = [region("region-1", "Jamali")];
  const templates = [
    template("1", "Jamali", false),
    template("2", "Jamali", true),
  ];

  assert.deepEqual(getActiveKertasKerjaRegions(regions, templates), regions);
});

test("treats legacy templates without is_active as active", () => {
  const regions = [region("region-1", "Jamali")];

  assert.deepEqual(
    getActiveKertasKerjaRegions(regions, [template("1", "Jamali")]),
    regions,
  );
});

test("matches normalized names and removes duplicate Region options", () => {
  const regions = [
    region("region-1", "Jamali"),
    region("region-2", "  JAMALI  "),
  ];

  assert.deepEqual(
    getActiveKertasKerjaRegions(regions, [
      template("1", "  jamali ", true),
    ]).map((item) => item.id),
    ["region-1"],
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import type { MasterGeneric } from "@/hooks/service/kertas-kerja-api";
import { getBbmMasterRegionOptions } from "./bbm-chart-filter-options";

const region = (id: string, name: string): MasterGeneric => ({
  id,
  name,
  comodity: "BBM",
  created_at: "2026-01-01",
});

test("returns only names supplied by Master Region", () => {
  const masterRegions = [
    region("region-1", "SUMATERA"),
    region("region-2", "JAMALI"),
  ];

  assert.deepEqual(getBbmMasterRegionOptions(masterRegions), [
    "JAMALI",
    "SUMATERA",
  ]);
});

test("trims names and removes duplicate Master Region options", () => {
  const masterRegions = [
    region("region-1", " SUMATERA "),
    region("region-2", "SUMATERA"),
    region("region-3", ""),
  ];

  assert.deepEqual(getBbmMasterRegionOptions(masterRegions), ["SUMATERA"]);
});

test("returns no options while Master Region data is unavailable", () => {
  assert.deepEqual(getBbmMasterRegionOptions(undefined), []);
});

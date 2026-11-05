import type { MasterGeneric } from "@/hooks/service/kertas-kerja-api";

export function getBbmMasterRegionOptions(
  masterRegions: MasterGeneric[] | undefined,
): string[] {
  if (!masterRegions) return [];

  return Array.from(
    new Set(
      masterRegions
        .map((region) => region.name?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ).sort((a, b) => a.localeCompare(b, "id"));
}

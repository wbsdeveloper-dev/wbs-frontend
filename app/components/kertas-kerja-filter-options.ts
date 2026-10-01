import type {
  MasterGeneric,
  TemplateKertasKerja,
} from "@/hooks/service/kertas-kerja-api";

function normalizeRegionName(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("id-ID");
}

/**
 * Returns unique Region master records that are referenced by active BBM
 * working-paper templates. An undefined is_active value is treated as active to
 * preserve compatibility with records created before the status column existed.
 */
export function getActiveKertasKerjaRegions(
  regions: MasterGeneric[],
  templates: TemplateKertasKerja[],
): MasterGeneric[] {
  const activeRegionNames = new Set(
    templates
      .filter((template) => template.is_active !== false)
      .map((template) => normalizeRegionName(template.site_region))
      .filter(Boolean),
  );
  const seen = new Set<string>();

  return regions.filter((region) => {
    const key = normalizeRegionName(region.name);
    if (!key || !activeRegionNames.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

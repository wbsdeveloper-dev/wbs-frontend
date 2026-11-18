export interface KertasKerjaHeaderGroup {
  name: string;
  start: number;
  end: number;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function matchesGroupAlias(groupName: string, alias: string): boolean {
  const normalizedGroup = normalizeHeader(groupName);
  const normalizedAlias = normalizeHeader(alias);
  if (!normalizedAlias) return false;

  if (normalizedGroup === normalizedAlias) return true;

  const qualifier = normalizedGroup.charAt(normalizedAlias.length);
  return (
    normalizedGroup.startsWith(normalizedAlias) &&
    [" ", "(", "/", "-"].includes(qualifier)
  );
}

export function buildKertasKerjaHeaderGroups(
  groupHeader: unknown[],
  columnCount = groupHeader.length,
): KertasKerjaHeaderGroup[] {
  const groups: KertasKerjaHeaderGroup[] = [];
  let previousGroup: KertasKerjaHeaderGroup | undefined;

  for (let column = 0; column < columnCount; column++) {
    const name = normalizeHeader(groupHeader[column]);
    if (!name) continue;

    if (previousGroup) previousGroup.end = column - 1;
    previousGroup = { name, start: column, end: columnCount - 1 };
    groups.push(previousGroup);
  }

  return groups;
}

/**
 * Returns only the columns belonging to a requested group and subcategory.
 * It deliberately has no global fallback: taking a same-named month from a
 * different group would silently corrupt the imported metric.
 */
export function getKertasKerjaSubcategoryColumns(
  groups: KertasKerjaHeaderGroup[],
  subcategoryHeader: unknown[],
  groupAliases: string[],
  subcategoryName: string,
  options: { exact?: boolean } = {},
): number[] {
  const matchedGroups =
    groupAliases
      .map((alias) =>
        groups.filter((group) => matchesGroupAlias(group.name, alias)),
      )
      .find((matches) => matches.length > 0) ?? [];
  const normalizedSubcategory = normalizeHeader(subcategoryName);
  const columns: number[] = [];
  const matchesSubcategory = (header: string): boolean => {
    if (!options.exact) return header.includes(normalizedSubcategory);

    const withoutUnit = header.replace(/\s*\((?:KL|HARI|%)\)\s*$/i, "");
    return withoutUnit === normalizedSubcategory;
  };

  for (const group of matchedGroups) {
    // Some source workbooks start a merged parent group a few columns after
    // its first subcategory (Jamali RENCANA starts at MEI while PESAN starts at
    // JAN). Include that immediately preceding subcategory when it matches.
    let effectiveStart = group.start;
    for (let column = group.start; column >= 0; column--) {
      const precedingHeader = normalizeHeader(subcategoryHeader[column]);
      if (!precedingHeader) continue;
      if (matchesSubcategory(precedingHeader)) effectiveStart = column;
      break;
    }

    let isInsideSubcategory = false;
    for (let column = effectiveStart; column <= group.end; column++) {
      const currentHeader = normalizeHeader(subcategoryHeader[column]);
      if (currentHeader) {
        isInsideSubcategory = matchesSubcategory(currentHeader);
      }
      if (isInsideSubcategory) columns.push(column);
    }
  }

  return columns;
}

export function findKertasKerjaMonthColumn(
  columns: number[],
  primaryMonthHeader: unknown[],
  secondaryMonthHeader: unknown[],
  targetMonth: string,
  normalizeMonth: (value: unknown) => string,
): number {
  const target = normalizeMonth(targetMonth);

  for (const column of columns) {
    const primary = primaryMonthHeader[column];
    if (
      primary !== undefined &&
      primary !== null &&
      normalizeMonth(primary) === target
    ) {
      return column;
    }

    const secondary = secondaryMonthHeader[column];
    if (
      secondary !== undefined &&
      secondary !== null &&
      normalizeMonth(secondary) === target
    ) {
      return column;
    }
  }

  return -1;
}

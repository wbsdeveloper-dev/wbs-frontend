const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

const MONTH_ALIASES: Record<string, number> = {
  jan: 0,
  janu: 0,
  january: 0,
  januari: 0,
  feb: 1,
  peb: 1,
  february: 1,
  februari: 1,
  pebruari: 1,
  mar: 2,
  maret: 2,
  march: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  juni: 5,
  june: 5,
  jul: 6,
  juli: 6,
  july: 6,
  agu: 7,
  agus: 7,
  agustus: 7,
  ags: 7,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  okt: 9,
  oct: 9,
  oktober: 9,
  october: 9,
  nov: 10,
  nop: 10,
  november: 10,
  nopember: 10,
  des: 11,
  dec: 11,
  desember: 11,
  december: 11,
};

export interface ParsedMonthWork {
  monthIndex: number;
  year: number;
  canonical: string;
}

export interface KertasKerjaMonthCorrection {
  index: number;
  originalLabel: string;
  originalMonth: string;
  correctedMonth: string;
  supportingHeaders: number;
  conflictingHeaders: number;
}

export interface KertasKerjaMonthTimelineResult {
  months: string[];
  corrections: KertasKerjaMonthCorrection[];
  confidence: "high" | "low";
}

function canonicalMonth(monthIndex: number, year: number): string {
  return `${MONTH_NAMES[monthIndex]} '${String(year).slice(-2)}`;
}

export function parseKertasKerjaMonth(
  rawLabel: unknown,
): ParsedMonthWork | null {
  if (rawLabel === undefined || rawLabel === null) return null;

  const normalized = String(rawLabel).toLowerCase().trim();
  if (!normalized) return null;

  const words = normalized
    .replace(/[^a-z0-9]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  let monthIndex: number | undefined;
  for (const word of words) {
    if (/^\d+$/.test(word)) continue;
    const alias = Object.keys(MONTH_ALIASES).find((key) =>
      word.startsWith(key),
    );
    if (alias !== undefined) {
      monthIndex = MONTH_ALIASES[alias];
      break;
    }
  }

  const fullYearMatch = normalized.match(/\b(20\d{2})\b/);
  const shortYearMatches = normalized.match(/(?:^|[^0-9])(\d{2})(?=$|[^0-9])/g);
  let year: number | undefined;

  if (fullYearMatch) {
    year = Number(fullYearMatch[1]);
  } else if (shortYearMatches?.length) {
    const lastMatch = shortYearMatches[shortYearMatches.length - 1];
    const shortYear = lastMatch.match(/\d{2}/)?.[0];
    if (shortYear) year = 2000 + Number(shortYear);
  }

  if (monthIndex === undefined || year === undefined) return null;

  return {
    monthIndex,
    year,
    canonical: canonicalMonth(monthIndex, year),
  };
}

export function normalizeKertasKerjaMonth(rawLabel: unknown): string {
  return parseKertasKerjaMonth(rawLabel)?.canonical ?? String(rawLabel ?? "");
}

function countContinuousTransitions(months: ParsedMonthWork[]): number {
  let continuous = 0;
  for (let index = 1; index < months.length; index++) {
    if (months[index].monthIndex === (months[index - 1].monthIndex + 1) % 12) {
      continuous += 1;
    }
  }
  return continuous;
}

function buildExpectedYears(
  months: ParsedMonthWork[],
  firstYear: number,
): number[] {
  const years = [firstYear];
  for (let index = 1; index < months.length; index++) {
    const rollsIntoNextYear =
      months[index].monthIndex < months[index - 1].monthIndex;
    years.push(years[index - 1] + (rollsIntoNextYear ? 1 : 0));
  }
  return years;
}

/**
 * Reconciles the primary STOK timeline against every month/year label found in
 * the surrounding header rows. Automatic corrections are only applied when:
 * - the primary month sequence is predominantly chronological;
 * - one complete chronological timeline scores clearly above alternatives; and
 * - the corrected period has at least two supporting headers and more support
 *   than the original period.
 */
export function reconcileKertasKerjaMonthTimeline(
  primaryLabels: string[],
  supportingLabels: unknown[],
): KertasKerjaMonthTimelineResult {
  const primaryMonths = primaryLabels.map(parseKertasKerjaMonth);
  if (primaryMonths.some((month) => month === null)) {
    return {
      months: primaryLabels.map(normalizeKertasKerjaMonth),
      corrections: [],
      confidence: "low",
    };
  }

  const parsedPrimary = primaryMonths as ParsedMonthWork[];
  const transitionCount = Math.max(parsedPrimary.length - 1, 1);
  const continuityRatio =
    countContinuousTransitions(parsedPrimary) / transitionCount;

  const supportCounts = new Map<string, number>();
  for (const label of supportingLabels) {
    const parsed = parseKertasKerjaMonth(label);
    if (!parsed) continue;
    supportCounts.set(
      parsed.canonical,
      (supportCounts.get(parsed.canonical) ?? 0) + 1,
    );
  }

  const observedYears = [
    ...parsedPrimary.map((month) => month.year),
    ...Array.from(supportCounts.keys()).map(
      (month) => parseKertasKerjaMonth(month)?.year ?? 0,
    ),
  ].filter((year) => year > 0);

  if (observedYears.length === 0 || continuityRatio < 0.7) {
    return {
      months: parsedPrimary.map((month) => month.canonical),
      corrections: [],
      confidence: "low",
    };
  }

  const minimumYear = Math.min(...observedYears) - 1;
  const maximumYear = Math.max(...observedYears) + 1;
  const candidates: Array<{
    firstYear: number;
    years: number[];
    score: number;
  }> = [];

  for (let firstYear = minimumYear; firstYear <= maximumYear; firstYear++) {
    const years = buildExpectedYears(parsedPrimary, firstYear);
    const score = parsedPrimary.reduce((total, month, index) => {
      const expected = canonicalMonth(month.monthIndex, years[index]);
      return total + (supportCounts.get(expected) ?? 0);
    }, 0);
    candidates.push({ firstYear, years, score });
  }

  candidates.sort((left, right) => right.score - left.score);
  const best = candidates[0];
  const runnerUp = candidates[1];
  const hasClearTimeline =
    best.score > 0 && (!runnerUp || best.score >= runnerUp.score + 2);

  if (!hasClearTimeline) {
    return {
      months: parsedPrimary.map((month) => month.canonical),
      corrections: [],
      confidence: "low",
    };
  }

  const corrections: KertasKerjaMonthCorrection[] = [];
  let hasUnresolvedConflict = false;
  const months = parsedPrimary.map((month, index) => {
    const expected = canonicalMonth(month.monthIndex, best.years[index]);
    if (expected === month.canonical) return month.canonical;

    const supportingHeaders = supportCounts.get(expected) ?? 0;
    const conflictingHeaders = supportCounts.get(month.canonical) ?? 0;
    if (supportingHeaders < 2 || supportingHeaders <= conflictingHeaders) {
      hasUnresolvedConflict = true;
      return month.canonical;
    }

    corrections.push({
      index,
      originalLabel: primaryLabels[index],
      originalMonth: month.canonical,
      correctedMonth: expected,
      supportingHeaders,
      conflictingHeaders,
    });
    return expected;
  });

  return {
    months,
    corrections,
    confidence: hasUnresolvedConflict ? "low" : "high",
  };
}

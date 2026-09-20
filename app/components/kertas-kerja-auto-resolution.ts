export interface NamedReference {
  id: string;
  name: string;
}

export type AutoReferenceResolution<T extends NamedReference> =
  | {
      status: "matched";
      reference: T;
      strategy: "exact" | "fuzzy";
      score: number;
    }
  | {
      status: "missing";
      bestCandidate?: T;
      score: number;
    }
  | {
      status: "ambiguous";
      candidates: T[];
      score: number;
    };

interface ResolveReferenceOptions {
  threshold: number;
  margin: number;
  minimumLength?: number;
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );
  const current = new Array<number>(right.length + 1);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }
    for (let index = 0; index <= right.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length];
}

export function calculateNameSimilarity(left: string, right: string): number {
  if (left === right) return 1;
  const longestLength = Math.max(left.length, right.length);
  if (longestLength === 0) return 1;
  return 1 - levenshteinDistance(left, right) / longestLength;
}

export function resolveNamedReference<T extends NamedReference>(
  references: T[],
  sourceName: string,
  normalize: (value: unknown) => string,
  options: ResolveReferenceOptions,
): AutoReferenceResolution<T> {
  const source = normalize(sourceName);
  if (!source) return { status: "missing", score: 0 };

  const exactMatches = references.filter(
    (reference) => normalize(reference.name) === source,
  );
  if (exactMatches.length === 1) {
    return {
      status: "matched",
      reference: exactMatches[0],
      strategy: "exact",
      score: 1,
    };
  }
  if (exactMatches.length > 1) {
    return { status: "ambiguous", candidates: exactMatches, score: 1 };
  }

  const minimumLength = options.minimumLength ?? 5;
  if (source.length < minimumLength || references.length === 0) {
    return { status: "missing", score: 0 };
  }

  const ranked = references
    .map((reference) => ({
      reference,
      score: calculateNameSimilarity(source, normalize(reference.name)),
    }))
    .sort((left, right) => right.score - left.score);
  const best = ranked[0];
  const secondScore = ranked[1]?.score ?? 0;

  if (!best || best.score < options.threshold) {
    return {
      status: "missing",
      bestCandidate: best?.reference,
      score: best?.score ?? 0,
    };
  }

  if (best.score - secondScore < options.margin) {
    const candidates = ranked
      .filter((candidate) => best.score - candidate.score < options.margin)
      .map((candidate) => candidate.reference);
    return { status: "ambiguous", candidates, score: best.score };
  }

  return {
    status: "matched",
    reference: best.reference,
    strategy: "fuzzy",
    score: best.score,
  };
}

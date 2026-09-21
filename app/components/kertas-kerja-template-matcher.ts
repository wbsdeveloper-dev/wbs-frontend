export interface KertasKerjaTemplateIdentity {
  id: string;
  site_name?: string | null;
  product_name?: string | null;
  supplier_name?: string | null;
  moda_name?: string | null;
}

export interface KertasKerjaRowIdentity {
  siteName: string;
  productName: string;
  supplierName: string;
  modaName?: string;
}

export interface KertasKerjaUnmatchedIdentity extends KertasKerjaRowIdentity {
  modaName: string;
}

export type KertasKerjaTemplateMatch<T extends KertasKerjaTemplateIdentity> =
  | {
      status: "matched";
      template: T;
      strategy: "exact" | "normalized";
    }
  | {
      status: "unmatched";
    }
  | {
      status: "ambiguous";
      candidates: T[];
    };

function normalizeIdentityText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const PRODUCT_ALIASES: Record<string, string> = {
  biosolar: "b40",
  "bio solar": "b40",
  b40: "b40",
  "b 40": "b40",
};

export function normalizeKertasKerjaProduct(value: unknown): string {
  const normalized = normalizeIdentityText(value);
  return PRODUCT_ALIASES[normalized] ?? normalized;
}

export function canonicalKertasKerjaProductName(value: unknown): string {
  const normalized = normalizeKertasKerjaProduct(value);
  if (normalized === "b40") return "B40";
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeKertasKerjaSupplier(value: unknown): string {
  return normalizeIdentityText(value)
    .split(" ")
    .filter((token) => token !== "pertamina")
    .join(" ");
}

export function normalizeKertasKerjaSite(value: unknown): string {
  return normalizeIdentityText(value);
}

const MODA_ALIASES: Record<string, string> = {
  truck: "truck",
  trucking: "truck",
  truk: "truck",
  tanker: "tanker",
  "mobil tangki": "tanker",
  ship: "shipping",
  shipping: "shipping",
  kapal: "shipping",
  pipeline: "pipeline",
  pipa: "pipeline",
};

export function normalizeKertasKerjaModa(value: unknown): string {
  const normalized = normalizeIdentityText(value);
  return MODA_ALIASES[normalized] ?? normalized;
}

export function canonicalKertasKerjaModaName(value: unknown): string {
  const normalized = normalizeKertasKerjaModa(value);
  const labels: Record<string, string> = {
    truck: "Truck",
    tanker: "Tanker",
    shipping: "Shipping",
    pipeline: "Pipeline",
  };
  return (
    labels[normalized] ??
    String(value ?? "")
      .normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ")
  );
}

export function buildKertasKerjaUnmatchedKey(
  identity: KertasKerjaUnmatchedIdentity,
): string {
  return [
    normalizeKertasKerjaSite(identity.siteName),
    normalizeKertasKerjaProduct(identity.productName),
    normalizeKertasKerjaSupplier(identity.supplierName),
    normalizeKertasKerjaModa(identity.modaName),
  ].join("|");
}

function exactKey(identity: KertasKerjaRowIdentity): string {
  return [
    normalizeIdentityText(identity.siteName),
    normalizeIdentityText(identity.productName),
    normalizeIdentityText(identity.supplierName),
    normalizeIdentityText(identity.modaName),
  ].join("|");
}

function normalizedKey(identity: KertasKerjaRowIdentity): string {
  return [
    normalizeKertasKerjaSite(identity.siteName),
    normalizeKertasKerjaProduct(identity.productName),
    normalizeKertasKerjaSupplier(identity.supplierName),
    normalizeKertasKerjaModa(identity.modaName),
  ].join("|");
}

function templateIdentity(
  template: KertasKerjaTemplateIdentity,
): KertasKerjaRowIdentity {
  return {
    siteName: template.site_name ?? "",
    productName: template.product_name ?? "",
    supplierName: template.supplier_name ?? "",
    modaName: template.moda_name ?? "",
  };
}

export function matchKertasKerjaTemplate<T extends KertasKerjaTemplateIdentity>(
  templates: T[],
  row: KertasKerjaRowIdentity,
): KertasKerjaTemplateMatch<T> {
  const rowExactKey = exactKey(row);
  const exactMatches = templates.filter(
    (template) => exactKey(templateIdentity(template)) === rowExactKey,
  );

  if (exactMatches.length === 1) {
    return {
      status: "matched",
      template: exactMatches[0],
      strategy: "exact",
    };
  }

  if (exactMatches.length > 1) {
    return { status: "ambiguous", candidates: exactMatches };
  }

  const rowNormalizedKey = normalizedKey(row);
  const normalizedMatches = templates.filter(
    (template) =>
      normalizedKey(templateIdentity(template)) === rowNormalizedKey,
  );

  if (normalizedMatches.length === 1) {
    return {
      status: "matched",
      template: normalizedMatches[0],
      strategy: "normalized",
    };
  }

  if (normalizedMatches.length > 1) {
    return { status: "ambiguous", candidates: normalizedMatches };
  }

  return { status: "unmatched" };
}

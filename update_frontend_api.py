import re

with open("hooks/service/bbm-api.ts", "r") as f:
    content = f.read()

content = content.replace(
"""export function useNationalTrend(
  type: "penyaluran" | "pemakaian",
  category: "Total BBM Nasional" | "BBM Per Produk",
  startDate?: string,
  endDate?: string,
  region?: string | null,
  unit?: string | null,
  upk?: string | null,
  moda?: string | null
) {""",
"""export function useNationalTrend(
  type: "penyaluran" | "pemakaian",
  category: "Total BBM Nasional" | "BBM Per Produk",
  startDate?: string,
  endDate?: string,
  region?: string | null,
  unit?: string | null,
  upk?: string | null,
  moda?: string | null,
  modeGrafik?: string | null
) {"""
)

content = content.replace(
"""        if (region) params.append("region", region);
        if (unit) params.append("unit", unit);
        if (upk) params.append("upk", upk);
        if (moda) params.append("moda", moda);""",
"""        if (region) params.append("region", region);
        if (unit) params.append("unit", unit);
        if (upk) params.append("upk", upk);
        if (moda) params.append("moda", moda);
        if (modeGrafik) params.append("modeGrafik", modeGrafik);"""
)

with open("hooks/service/bbm-api.ts", "w") as f:
    f.write(content)


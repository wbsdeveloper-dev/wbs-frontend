import re

with open("app/dashboard/bbm/components/NationalTrendChart.tsx", "r") as f:
    content = f.read()

replacement = """  const { chartData, lines, tableData, isProductView } = useMemo(() => {
    if (!data || data.length === 0)
      return {
        chartData: [],
        lines: [],
        tableData: { rows: {}, cols: [] as string[] },
        isProductView: false,
      };

    const isProduct = category === "BBM Per Produk";

    if (isProduct) {
      // isProductView = true
      // Lines are combinations of mode_value (if exists) and product, X-axis is YYYY-MM
      const productsSet = new Set<string>();
      const timePointsSet = new Set<string>(); // e.g. "2024-01"

      data.forEach((item) => {
        const p = item.product || "LAINNYA";
        const lineKey = (item as any).mode_value ? `${(item as any).mode_value} - ${p}` : p;
        productsSet.add(lineKey);
        const tp = `${item.year}-${item.month.toString().padStart(2, "0")}`;
        timePointsSet.add(tp);
      });

      const uniqueProducts = Array.from(productsSet).sort();
      const uniqueTimePoints = Array.from(timePointsSet).sort();

      // chartData: [{ time: "Jan 2024", "HSD": 100, "B35": 200 }, ...]
      const chartDataMap: Record<string, any> = {};
      uniqueTimePoints.forEach((tp) => {
        const [y, m] = tp.split("-");
        const monthLabel = `${MONTHS[parseInt(m) - 1]} ${y}`;
        chartDataMap[tp] = { time: monthLabel, rawTime: tp };
        uniqueProducts.forEach((prod) => (chartDataMap[tp][prod] = null));
      });

      data.forEach((item) => {
        const p = item.product || "LAINNYA";
        const lineKey = (item as any).mode_value ? `${(item as any).mode_value} - ${p}` : p;
        const tp = `${item.year}-${item.month.toString().padStart(2, "0")}`;
        // Add instead of overwrite, in case of multiple mode values falling in the same bucket?
        // Wait, SQL groups by year, month, product, mode_value so it's a 1-to-1 mapping.
        chartDataMap[tp][lineKey] = parseFloat(item.total_volume) || 0;
      });

      const sortedChartData = Object.values(chartDataMap).sort((a, b) =>
        a.rawTime.localeCompare(b.rawTime),
      );

      // Table data: Rows = Products (or combinations), Cols = TimePoints
      const tableDataMap: Record<string, (number | null)[]> = {};
      uniqueProducts.forEach((prod) => {
        tableDataMap[prod] = uniqueTimePoints.map(
          (tp) => chartDataMap[tp][prod] ?? null,
        );
      });

      return {
        chartData: sortedChartData,
        lines: uniqueProducts,
        tableData: {
          rows: tableDataMap,
          cols: sortedChartData.map((d) => d.time),
        },
        isProductView: true,
      };
    } else {
      // Lines are mode_value + year (or just year if no mode_value)
      // X-axis is Months
      const linesSet = new Set<string>();
      data.forEach((item) => {
        const lineKey = (item as any).mode_value ? `${(item as any).mode_value} ${item.year}` : String(item.year);
        linesSet.add(lineKey);
      });
      const uniqueLines = Array.from(linesSet).sort();

      // Init table data (Rows = LineKeys, Cols = Months)
      const tableDataMap: Record<string, (number | null)[]> = {};
      uniqueLines.forEach((lineKey) => {
        tableDataMap[lineKey] = Array(12).fill(null);
      });

      data.forEach((item) => {
        if (item.month >= 1 && item.month <= 12) {
          const lineKey = (item as any).mode_value ? `${(item as any).mode_value} ${item.year}` : String(item.year);
          tableDataMap[lineKey][item.month - 1] = parseFloat(item.total_volume) || 0;
        }
      });

      // Format for recharts
      const rechartsData = MONTHS.map((month, index) => {
        const row: any = { time: month };
        uniqueLines.forEach((lineKey) => {
          row[lineKey] = tableDataMap[lineKey][index];
        });
        return row;
      });

      return {
        chartData: rechartsData,
        lines: uniqueLines,
        tableData: { rows: tableDataMap, cols: MONTHS },
        isProductView: false,
      };
    }
  }, [data, category]);"""

# Replace the useMemo block
# It starts at `const { chartData, lines, tableData, isProductView } = useMemo(() => {`
# and ends at `  }, [data, category]);`

pattern = re.compile(r"  const \{ chartData, lines, tableData, isProductView \} = useMemo\(\(\) => \{.*?\}, \[data, category\]\);", re.DOTALL)
content = pattern.sub(replacement, content)

with open("app/dashboard/bbm/components/NationalTrendChart.tsx", "w") as f:
    f.write(content)


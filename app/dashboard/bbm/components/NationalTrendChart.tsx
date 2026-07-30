"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrendData {
  year: number;
  month: number;
  total_volume: string;
  product?: string;
}

interface NationalTrendChartProps {
  data: TrendData[];
  type?: "penyaluran" | "pemakaian";
  category?: string;
  isLoading?: boolean;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#84CC16",
  "#06B6D4",
];

export function NationalTrendChart({
  data,
  isLoading,
  category = "BBM Per Year",
}: NationalTrendChartProps) {
  const { chartData, lines, tableData, isProductView } = useMemo(() => {
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
  }, [data, category]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex-1 min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F3F4F6"
              />
              <XAxis
                dataKey="time"
                tick={{ fill: "#6B7280" }}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                tick={{ fill: "#6B7280" }}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000)
                    return (value / 1000000).toFixed(1) + "M";
                  if (value >= 1000) return (value / 1000).toFixed(0) + "K";
                  return value;
                }}
              />
              <Tooltip
                formatter={(value: number) => {
                  if (value === null) return ["-", ""];
                  return [
                    new Intl.NumberFormat("id-ID").format(value) + " KL",
                    "",
                  ];
                }}
                labelStyle={{ color: "#374151", fontWeight: "bold" }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
              {lines.map((lineKey, index) => (
                <Line
                  key={lineKey}
                  type="monotone"
                  dataKey={lineKey}
                  name={lineKey}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {!isLoading && lines.length > 0 && (
        <div className="mt-6 overflow-x-auto overflow-y-auto max-h-[200px] border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 whitespace-nowrap sticky left-0 z-30"
                >
                  {isProductView ? "Produk" : "Tahun"}
                </th>
                {tableData.cols.map((col: string, idx: number) => (
                  <th
                    key={idx}
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lines.map((rowKey) => (
                <tr key={rowKey} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50 sticky left-0 z-10">
                    {rowKey}
                  </td>
                  {((tableData.rows as any)[rowKey] as (number | null)[]).map(
                    (val: number | null, idx: number) => (
                      <td
                        key={idx}
                        className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right"
                      >
                        {val !== null
                          ? new Intl.NumberFormat("id-ID").format(val)
                          : "-"}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

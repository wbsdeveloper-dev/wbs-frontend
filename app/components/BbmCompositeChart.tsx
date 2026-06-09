"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { BbmRealizationByModaResponse } from "@/hooks/service/bbm-api";

// ---------------------------------------------------------------------------
// Color palette for moda stacks
// ---------------------------------------------------------------------------

const MODA_COLORS: Record<string, string> = {
  TRUCK: "#f97316",   // orange
  KAPAL: "#3b82f6",   // blue
  PIPA: "#10b981",    // emerald
  LAINNYA: "#8b5cf6", // purple
};

const DEFAULT_COLORS = [
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#eab308",
  "#06b6d4",
];

function getModaColor(moda: string, index: number): string {
  const upper = moda.toUpperCase();
  return MODA_COLORS[upper] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

function getModaLabel(moda: string): string {
  const labels: Record<string, string> = {
    TRUCK: "Truck",
    KAPAL: "Kapal",
    PIPA: "Pipa",
    LAINNYA: "Lainnya",
  };
  return labels[moda.toUpperCase()] || moda;
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // Separate bars (moda) from lines (cumulative & nomination)
  const bars = payload.filter(
    (p) => p.dataKey !== "cumulative" && p.dataKey !== "nomination",
  );
  const cumulativeEntry = payload.find((p) => p.dataKey === "cumulative");
  const nominationEntry = payload.find((p) => p.dataKey === "nomination");

  return (
    <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 px-4 py-3 text-sm">
      <p className="font-semibold text-gray-900 mb-2 border-b border-gray-100 pb-1.5">
        {label}
      </p>
      <div className="space-y-1">
        {bars.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}</span>
            </div>
            <span className="font-medium text-gray-900">
              {entry.value?.toLocaleString("id-ID", {
                maximumFractionDigits: 2,
              })}{" "}
              KL
            </span>
          </div>
        ))}
        {cumulativeEntry && (
          <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 rounded bg-[#ef4444]" />
              <span className="text-gray-600 font-medium">Akumulasi</span>
            </div>
            <span className="font-bold text-[#ef4444]">
              {cumulativeEntry.value?.toLocaleString("id-ID", {
                maximumFractionDigits: 2,
              })}{" "}
              KL
            </span>
          </div>
        )}
        {nominationEntry && nominationEntry.value > 0 && (
          <>
            <div className="flex items-center justify-between gap-6 pt-1 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 rounded bg-[#a855f7]" style={{ borderTop: "2px dashed #a855f7" }} />
                <span className="text-gray-600 font-medium">Nominasi</span>
              </div>
              <span className="font-bold text-[#a855f7]">
                {nominationEntry.value?.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}{" "}
                KL
              </span>
            </div>
            {cumulativeEntry && (
              <div className="flex items-center justify-between gap-6 pt-1.5 border-t border-gray-100">
                <span className="text-gray-500 font-medium text-xs">% Capaian (Akumulasi/Nominasi)</span>
                <span className="font-bold text-gray-800 text-xs">
                  {((cumulativeEntry.value / nominationEntry.value) * 100).toLocaleString("id-ID", {
                    maximumFractionDigits: 1,
                  })}
                  %
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface BbmCompositeChartProps {
  data: BbmRealizationByModaResponse | undefined;
  isLoading: boolean;
}

export default function BbmCompositeChart({
  data,
  isLoading,
}: BbmCompositeChartProps) {
  const chartData = useMemo(() => {
    if (!data?.chartData) return [];
    return data.chartData.map((entry) => ({
      ...entry,
      // Format day label for display (e.g. "1", "2", ..., "31")
      label: formatDayLabel(entry.reportDate),
    }));
  }, [data]);

  const modaKeys = data?.modaKeys || [];
  const nomination = data?.nomination || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        <Loader2 className="animate-spin mr-2" size={20} />
        Memuat data grafik...
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Tidak ada data realisasi yang cocok dengan filter
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f3f4f6"
        />
        <XAxis
          dataKey="label"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => {
            if (value >= 1000000)
              return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
            if (value >= 1000)
              return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
            return value.toString();
          }}
          label={{
            value: "Volume (KL)",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 11, fill: "#9ca3af" },
            offset: 10,
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "#ef4444", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => {
            if (value >= 1000000)
              return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
            if (value >= 1000)
              return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
            return value.toString();
          }}
          label={{
            value: "Akumulasi (KL)",
            angle: 90,
            position: "insideRight",
            style: { fontSize: 11, fill: "#ef4444" },
            offset: 10,
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          formatter={(value: string) => (
            <span className="text-xs text-gray-600">{value}</span>
          )}
        />

        {/* Stacked bars for each moda (daily realization) */}
        {modaKeys.map((moda, index) => (
          <Bar
            key={moda}
            yAxisId="left"
            dataKey={moda}
            name={getModaLabel(moda)}
            stackId="moda"
            fill={getModaColor(moda, index)}
            radius={
              index === modaKeys.length - 1 ? [10, 10, 0, 0] : [0, 0, 0, 0]
            }
            maxBarSize={100}
          />
        ))}

        {/* Nomination line */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="nomination"
          name="Nominasi"
          stroke="#a855f7"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          activeDot={{
            r: 4,
            fill: "#a855f7",
            stroke: "#fff",
            strokeWidth: 2,
          }}
        />

        {/* Cumulative line */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cumulative"
          name="Akumulasi"
          stroke="#ef4444"
          strokeWidth={2.5}
          dot={{
            r: 3,
            fill: "#ef4444",
            stroke: "#fff",
            strokeWidth: 2,
          }}
          activeDot={{
            r: 6,
            fill: "#ef4444",
            stroke: "#fff",
            strokeWidth: 2,
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDayLabel(reportDate: string): string {
  // reportDate is "YYYY-MM-DD", extract day number
  const day = parseInt(reportDate.split("-")[2], 10);
  return String(day);
}

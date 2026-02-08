"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

// S-Curve data for 9-day shutdown period
const scurveData = [
  {
    day: "Day 1",
    date: "2026-02-01",
    plannedIncremental: 8,
    actualIncremental: 6,
    plannedCumulative: 8,
    actualCumulative: 6,
    rebaselineCumulative: 5,
  },
  {
    day: "Day 2",
    date: "2026-02-02",
    plannedIncremental: 12,
    actualIncremental: 8,
    plannedCumulative: 20,
    actualCumulative: 14,
    rebaselineCumulative: 12,
  },
  {
    day: "Day 3",
    date: "2026-02-03",
    plannedIncremental: 14,
    actualIncremental: 10,
    plannedCumulative: 34,
    actualCumulative: 24,
    rebaselineCumulative: 22,
  },
  {
    day: "Day 4",
    date: "2026-02-04",
    plannedIncremental: 16,
    actualIncremental: 12,
    plannedCumulative: 50,
    actualCumulative: 36,
    rebaselineCumulative: 34,
  },
  {
    day: "Day 5",
    date: "2026-02-05",
    plannedIncremental: 15,
    actualIncremental: 11,
    plannedCumulative: 65,
    actualCumulative: 47,
    rebaselineCumulative: 44,
  },
  {
    day: "Day 6",
    date: "2026-02-06",
    plannedIncremental: 14,
    actualIncremental: 10,
    plannedCumulative: 79,
    actualCumulative: 57,
    rebaselineCumulative: 53,
  },
  {
    day: "Day 7",
    date: "2026-02-07",
    plannedIncremental: 10,
    actualIncremental: 8,
    plannedCumulative: 89,
    actualCumulative: 65,
    rebaselineCumulative: 61,
  },
  {
    day: "Day 8",
    date: "2026-02-08",
    plannedIncremental: 6,
    actualIncremental: 4.21,
    plannedCumulative: 95,
    actualCumulative: 69.21,
    rebaselineCumulative: 66,
  },
  {
    day: "Day 9",
    date: "2026-02-09",
    plannedIncremental: 2.52,
    actualIncremental: 2,
    plannedCumulative: 97.52,
    actualCumulative: 71.21,
    rebaselineCumulative: 68.62,
  },
];

// Progress summary data
const progressSummary = {
  actualProgress: 71.21,
  plannedProgress: 97.52,
  varianceVsPlan: -26.31,
  rebaselineProgress: 68.62,
  varianceVsRebaseline: 2.58,
};

// Key highlights data
const keyHighlights = [
  "Overall actual progress reached 71.21%, behind the original plan (97.52%) with a variance of -26.31%.",
  "Progress is ahead of the rebaseline by +2.58%, indicating execution is currently under control against the revised schedule.",
  "Extended purging was required due to heavy hydrocarbon presence in the propylene system caused by prolonged DPCU leakage.",
  "Cutting method was changed from cold cutting (open area) to grinding with habitat due to LEL exposure concerns.",
  "Equipment relocation was constrained by adverse weather conditions, including rain and strong wind.",
  "Additional mechanical alignment was performed to correct DPCU orientation and ensure safe startup conditions.",
];

interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
  dataKey?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-900 min-w-[220px]">
      <p className="font-semibold mb-3 text-gray-800 border-b border-gray-100 pb-2">{label}</p>
      <ul className="space-y-2">
        {payload.map((item, index) => (
          <li key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{item.name}</span>
            </span>
            <span className="font-semibold">{item.value.toFixed(2)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function SCurveProgressChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900">
            S-Curve Progress - Planned Shutdown Project
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Daily progress tracking from Day 1 to Day 9 of shutdown period
          </p>
        </div>
      </div>

      {/* Progress Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {/* Actual Progress */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Actual Progress</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-700 mt-1">
            {progressSummary.actualProgress}%
          </p>
        </div>

        {/* Planned Progress */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Planned Progress</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-700 mt-1">
            {progressSummary.plannedProgress}%
          </p>
        </div>

        {/* Variance vs Plan */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Variance vs Plan</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <p className="text-2xl md:text-3xl font-bold text-red-700">
              {progressSummary.varianceVsPlan}%
            </p>
          </div>
        </div>

        {/* Rebaseline Progress */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Rebaseline</p>
          <p className="text-2xl md:text-3xl font-bold text-emerald-700 mt-1">
            {progressSummary.rebaselineProgress}%
          </p>
        </div>

        {/* Variance vs Rebaseline */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 col-span-2 md:col-span-1">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wide">vs Rebaseline</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-2xl md:text-3xl font-bold text-green-700">
              +{progressSummary.varianceVsRebaseline}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[350px] md:h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={scurveData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={{ stroke: "#d1d5db" }}
              axisLine={{ stroke: "#d1d5db" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={{ stroke: "#d1d5db" }}
              axisLine={{ stroke: "#d1d5db" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              iconType="rect"
              formatter={(value) => (
                <span className="text-sm text-gray-700">{value}</span>
              )}
            />

            {/* Incremental Bars */}
            <Bar
              dataKey="plannedIncremental"
              name="Planned Incremental"
              fill="#d1d5db"
              radius={[2, 2, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="actualIncremental"
              name="Actual Incremental"
              fill="#3b82f6"
              radius={[2, 2, 0, 0]}
              barSize={20}
            />

            {/* Cumulative Lines */}
            <Line
              type="monotone"
              dataKey="plannedCumulative"
              name="Planned Cumulative"
              stroke="#6b7280"
              strokeWidth={3}
              dot={{ fill: "#6b7280", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#6b7280", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="actualCumulative"
              name="Actual Cumulative"
              stroke="#1d4ed8"
              strokeWidth={3}
              dot={{ fill: "#1d4ed8", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#1d4ed8", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="rebaselineCumulative"
              name="Rebaseline Cumulative"
              stroke="#10b981"
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Key Progress Highlights */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h4 className="text-base md:text-lg font-semibold text-gray-900">
            Key Progress Highlights
          </h4>
        </div>
        <ul className="space-y-3">
          {keyHighlights.map((highlight, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#115d72] to-[#14a2bb] text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                {index + 1}
              </span>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                {highlight}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
        Data reflects project status as of current reporting period. Rebaseline approved on Day 4 due to scope changes.
      </p>
    </div>
  );
}

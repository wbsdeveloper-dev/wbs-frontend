"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Expand, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { CHART_COLORS } from "@/app/_constants";

interface DataPieChart {
  name: string;
  value: number;
  [key: string]: string | number;
}

type Props = {
  openModalFunction: () => void;
  data: DataPieChart[];
  changeFilterType: (value: string | null) => void;
  filterType: string | null;
  /** Selected distribution date (YYYY-MM-DD) */
  selectedDate: string;
  /** Called when the user picks a new date */
  onDateChange: (date: string) => void;
};

export default function FuelTypeDonutChart({
  openModalFunction,
  data,
  changeFilterType,
  filterType,
  selectedDate,
  onDateChange,
}: Props) {
  const [showDateFilter, setShowDateFilter] = useState(false);

  /** Format YYYY-MM-DD → human-readable Indonesian date */
  const formattedDate = (() => {
    try {
      return new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  })();

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 flex flex-col">
      {/* Header row */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Konsumsi Gas</h3>
        <div className="flex items-center gap-1">
          {/* Date filter toggle */}
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              showDateFilter
                ? "bg-[#14a2bb]/10 text-[#115d72] border border-[#14a2bb]/30"
                : "text-gray-500 hover:bg-gray-100 border border-transparent"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Tanggal</span>
            {showDateFilter ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Expand button */}
          <button
            onClick={openModalFunction}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Expand className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible date picker */}
      {showDateFilter && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Tanggal Distribusi
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300
                       bg-white text-gray-700
                       focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb]
                       transition-all duration-200"
          />
        </div>
      )}

      {/* Pemasok / Pembangkit tabs */}
      <div className="flex items-center mt-4 mb-2 justify-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
          {["Pemasok", "Pembangkit"].map((type) => (
            <button
              key={type}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                filterType === type
                  ? "bg-[#14a2bb] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => changeFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                const total = data.reduce((sum, d) => sum + d.value, 0);
                const pct =
                  total > 0
                    ? (((item.value as number) / total) * 100).toFixed(1)
                    : "0.0";
                return (
                  <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-sm">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-gray-600">{pct}%</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={50}
            iconType="circle"
            wrapperStyle={{
              maxHeight: 80,
              overflowY: "auto",
            }}
            formatter={(value: string) => {
              const total = data.reduce((sum, d) => sum + d.value, 0);
              const entry = data.find((d) => d.name === value);
              const pct =
                entry && total > 0
                  ? ((entry.value / total) * 100).toFixed(1)
                  : "0.0";
              return `${value} (${pct}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Dynamic footer */}
      <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
        Visualisasi konsumsi gas pada setiap{" "}
        {filterType?.toLowerCase() ?? "pembangkit"} PLN EPI per tanggal{" "}
        {formattedDate}
      </p>
    </div>
  );
}

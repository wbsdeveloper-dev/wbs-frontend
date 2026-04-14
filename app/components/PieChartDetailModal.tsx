"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS } from "@/app/_constants";
import { Modal } from "@/app/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface PieChartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DataItem[];
  filterType: string | null;
  onFilterTypeChange: (type: string) => void;
  /** Selected distribution start date (YYYY-MM-DD) */
  startDate: string;
  endDate: string;
  /** Called when the user picks a new date */
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PieChartDetailModal({
  isOpen,
  onClose,
  data,
  filterType,
  onFilterTypeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: PieChartDetailModalProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  /** Format YYYY-MM-DD → human-readable Indonesian date */
  const formattedDate = (() => {
    try {
      const start = new Date(startDate + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const end = new Date(endDate + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `${start} - ${end}`;
    } catch {
      return `${startDate} - ${endDate}`;
    }
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Konsumsi Gas</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Pemasok / Pembangkit tabs */}
          <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
            {["Pemasok", "Pembangkit"].map((type) => (
              <button
                key={type}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                  filterType === type
                    ? "bg-[#14a2bb] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => onFilterTypeChange(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Date pickers */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-300
                         bg-white text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb]
                         transition-all duration-200"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-300
                         bg-white text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb]
                         transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart Section */}
        <div className="bg-white rounded-xl px-4 md:px-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((_: DataItem, index: number) => (
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
            </PieChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
            Visualisasi konsumsi gas pada setiap{" "}
            {filterType?.toLowerCase() ?? "pembangkit"} PLN EPI per tanggal{" "}
            {formattedDate}
          </p>
        </div>

        {/* List Section */}
        <div>
          <p className="text-lg font-semibold text-gray-900 mb-4">
            Detail List {filterType}
          </p>
          <div className="p-4 md:p-6 text-gray-900 h-[300px] md:h-[400px] overflow-auto border border-gray-200 rounded-lg">
            {data.map((item: DataItem, index: number) => {
              const pct =
                total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <p className="font-medium text-sm md:text-base">
                      {item.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm md:text-base">
                    <span className="text-gray-500">({pct}%)</span>
                    <span className="font-semibold">{item.value} MMBTU</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

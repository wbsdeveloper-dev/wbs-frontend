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
}: PieChartDetailModalProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart Section */}
        <div className="bg-white rounded-xl px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Konsumsi Gas
            </h3>
            <div className="flex items-center">
              <button
                className={`text-[#115d72] ${
                  filterType === "Pemasok" ? "bg-[#14a2bb92]" : ""
                } px-2 rounded-md cursor-pointer`}
                onClick={() => onFilterTypeChange("Pemasok")}
              >
                Pemasok
              </button>
              <button
                className={`text-[#115d72] ${
                  filterType === "Pembangkit" ? "bg-[#14a2bb92]" : ""
                } px-2 rounded-md cursor-pointer`}
                onClick={() => onFilterTypeChange("Pembangkit")}
              >
                Pembangkit
              </button>
            </div>
          </div>
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
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
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
            Visualisasi konsumsi gas pada setiap pembangkit PLN EPI
          </p>
        </div>

        {/* List Section */}
        <div>
          <p className="text-lg font-semibold text-gray-900 mb-4">
            Detail List {filterType}
          </p>
          <div className="p-4 md:p-8 text-gray-900 h-[300px] md:h-[400px] overflow-auto border border-gray-200 rounded-lg">
            {data.map((item: DataItem, index: number) => {
              const pct =
                total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={index}
                  className="flex justify-between items-center py-1"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[index] }}
                    />
                    <p className="font-medium text-sm md:text-base">
                      {item.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm md:text-base">
                    <span className="text-gray-500">({pct}%)</span>
                    <span>{item.value} MMBTU</span>
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

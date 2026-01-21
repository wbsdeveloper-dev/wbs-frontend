"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

const data = [
  { name: "PLTMG SUMBAWA", value: 83, status: "critical" },
  { name: "PLTD-BW-NPS TALWANG", value: 45, status: "critical" },
  { name: "PLTD MEDANG", value: 41, status: "normal" },
  { name: "PLTD PERAT", value: 37, status: "normal" },
  { name: "PLTD SEROBOT", value: 24, status: "normal" },
  { name: "PLTD LUMOK", value: 20, status: "alert" },
  { name: "PLTD-BW-NPS WAHA", value: 16, status: "normal" },
  { name: "PLTD DOMPU", value: 15, status: "normal" },
  { name: "PLTD-BW TALWANG", value: 11, status: "normal" },
  { name: "PLTD LABUAN A.A", value: 9, status: "alert" },
  { name: "PLTMG BIMA", value: 8, status: "alert" },
  { name: "PLTD BIMA", value: 6, status: "alert" },
  { name: "PLTMG DOMPU", value: 6, status: "alert" },
  { name: "PLTD SUMBAWA", value: 4, status: "critical" },
];

const getColor = (status: string) => {
  switch (status) {
    case "critical":
      return "#ef4444";
    case "alert":
      return "#f59e0b";
    case "normal":
      return "#10b981";
    default:
      return "#3b82f6";
  }
};

export default function PowerPlantHOPChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Power Plant HOP
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={130}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-xs text-gray-600">NORMAL</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-xs text-gray-600">ALERT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-xs text-gray-600">CRITICAL</span>
        </div>
      </div>
    </div>
  );
}

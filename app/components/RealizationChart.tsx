"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [{ name: "TTBM PANGKAL PINANG", rencana: 100, realisasi: 80 }];

export default function RealizationChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Volume Harian
      </h3>
      <ResponsiveContainer width="100%" height={270}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="rencana" fill="#60a4fa" />
          <Bar dataKey="realisasi" fill="#facb15" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 pt-4 border-t border-gray-200">
        Visualisasi
      </p>
    </div>
  );
}

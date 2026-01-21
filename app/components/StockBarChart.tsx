"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { tanggal: "01 Januari", pemasok: 280, pembangkit: 300 },
  { tanggal: "02 Januari", pemasok: 295, pembangkit: 300 },
  { tanggal: "03 Januari", pemasok: 310, pembangkit: 320 },
  { tanggal: "04 Januari", pemasok: 305, pembangkit: 320 },
  { tanggal: "05 Januari", pemasok: 290, pembangkit: 310 },
  { tanggal: "06 Januari", pemasok: 275, pembangkit: 300 },
  { tanggal: "07 Januari", pemasok: 260, pembangkit: 290 },
  { tanggal: "08 Januari", pemasok: 300, pembangkit: 320 },
  { tanggal: "09 Januari", pemasok: 315, pembangkit: 330 },
  { tanggal: "10 Januari", pemasok: 325, pembangkit: 340 },
];

export default function StockBarChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Volume Harian
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="tanggal" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="pemasok" fill="#60a4fa" />
          <Bar dataKey="pembangkit" fill="#facb15" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
        Visualisasi
      </p>
    </div>
  );
}

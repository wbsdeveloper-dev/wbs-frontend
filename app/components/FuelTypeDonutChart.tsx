"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Expand } from "lucide-react";

const COLORS = [
  "#4F8EF7", // soft blue
  "#34C77B", // soft green
  "#F87171", // soft red
  "#FBBF24", // soft amber
  "#8B7CF6", // soft violet
  "#38BDF8", // soft sky
  "#4ADE80", // soft mint
  "#FB7185", // soft rose
  "#FACC15", // soft yellow
  "#6366F1", // soft indigo
  "#2DD4BF", // soft teal
  "#FB923C", // soft orange
  "#A3E635", // soft lime
  "#22D3EE", // soft cyan
  "#A78BFA", // soft purple
  "#F472B6", // soft pink
  "#34D399", // soft emerald
  "#60A5FA", // soft blue light
  "#F43F5E", // soft rose strong
  "#7C3AED", // soft violet strong
];

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
};

export default function FuelTypeDonutChart({
  openModalFunction,
  data,
  changeFilterType,
  filterType,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-">
        <div className="flex gap-2 items-center justify-between w-full">
          <h3 className="text-lg font-semibold text-gray-900">Konsumsi Gas</h3>
          <button
            onClick={() => {
              openModalFunction();
            }}
            className="cursor-pointer"
          >
            <Expand className="text-gray-900" />
          </button>
        </div>
      </div>
      <div className="flex items-center mt-4 mb-2 justify-center">
        <button
          className={`text-[#115d72] ${filterType == "Pemasok" ? "bg-[#14a2bb92]" : ""} px-2 rounded-md cursor-pointer`}
          onClick={() => {
            changeFilterType("Pemasok");
          }}
        >
          Pemasok
        </button>
        <button
          className={`text-[#115d72] ${filterType == "Pembangkit" ? "bg-[#14a2bb92]" : ""} px-2 rounded-md cursor-pointer`}
          onClick={() => {
            changeFilterType("Pembangkit");
          }}
        >
          Pembangkit
        </button>
      </div>
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
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
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
      <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
        Visualisasi konsumsi gas pada setiap pembangkit PLN EPI per tanggal 13
        Januari 2026
      </p>
    </div>
  );
}

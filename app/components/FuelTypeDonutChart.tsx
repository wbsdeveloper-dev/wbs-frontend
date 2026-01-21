"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import FilterAutocomplete from "./FilterAutocomplete";
import { X } from "lucide-react";
import { Expand } from "lucide-react";

const COLORS = [
  "#2563EB", // blue-600
  "#16A34A", // green-600
  "#DC2626", // red-600
  "#F59E0B", // amber-500
  "#7C3AED", // violet-600
  "#0EA5E9", // sky-500
  "#22C55E", // green-500
  "#EF4444", // red-500
  "#EAB308", // yellow-500
  "#6366F1", // indigo-500
  "#14B8A6", // teal-500
  "#F97316", // orange-500
  "#84CC16", // lime-500
  "#06B6D4", // cyan-500
  "#A855F7", // purple-500
  "#FB7185", // rose-400
  "#10B981", // emerald-500
  "#3B82F6", // blue-500
  "#F43F5E", // rose-500
  "#8B5CF6", // violet-500
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

const filterTypeOptions = ["Pemasok", "Pembangkit"];

export default function FuelTypeDonutChart({
  openModalFunction,
  data,
  changeFilterType,
  filterType,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex justify-between items-center mb-">
        <div className="flex gap-2 items-center">
          <h3 className="text-lg font-semibold text-gray-900">Konsumsi Gas</h3>
          <button
            onClick={() => {
              openModalFunction();
            }}
            className="cursor-pointer"
          >
            <Expand className="text-[#14a2bb92]" />
          </button>
        </div>
        <div className="w-[200px]">
          <FilterAutocomplete
            label=""
            options={filterTypeOptions}
            value={filterType}
            onChange={changeFilterType}
            placeholder="Pilih Filter Berdasar"
          />
        </div>
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
          <Legend
            verticalAlign="bottom"
            height={50}
            iconType="circle"
            wrapperStyle={{
              maxHeight: 80,
              overflowY: "auto",
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

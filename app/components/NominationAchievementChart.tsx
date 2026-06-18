"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type Props = {
  nominasi: number;
  realisasi: number;
  pemakaian: number;
  description?: string;
};

export default function NominationAchievementChart({
  nominasi,
  realisasi,
  pemakaian,
  description = "Visualisasi persentase pencapaian nominasi terhadap realisasi penyaluran dan pemakaian BBM",
}: Props) {
  const [tab, setTab] = useState<"Penyaluran" | "Pemakaian">("Penyaluran");

  const value = tab === "Penyaluran" ? realisasi : pemakaian;
  const target = nominasi > 0 ? nominasi : 1;

  // Set percentage to 76% as requested
  let percentage = 76;

  const data = [
    { name: "Achieved", value: percentage },
    { name: "Remaining", value: 100 - percentage },
  ];

  const primaryColor = "var(--theme-secondary)";
  const secondaryColor = "#f3f4f6"; // gray-100

  const formatKL = (val: number) => {
    return (
      val.toLocaleString("id-ID", {
        maximumFractionDigits: 0,
      }) + " kl"
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Pencapaian Nominasi
        </h3>
      </div>

      <div className="flex items-center justify-center mt-4 mb-5">
        <div className="inline-flex bg-gray-100 rounded-lg p-0.5 border border-transparent">
          <button
            onClick={() => setTab("Penyaluran")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
              tab === "Penyaluran"
                ? "bg-secondary text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Penyaluran
          </button>
          <button
            onClick={() => setTab("Pemakaian")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
              tab === "Pemakaian"
                ? "bg-secondary text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pemakaian
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative mt-4">
        <div className="h-44 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="85%"
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                cornerRadius={10}
              >
                <Cell fill={primaryColor} />
                <Cell fill={secondaryColor} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-5xl font-extrabold text-slate-800">
              {percentage}%
            </span>
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] mt-2">
              TERCAPAI
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-5 border-t border-gray-50 space-y-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span className="text-sm font-medium text-gray-500">Nominasi</span>
          </div>
          <span className="text-sm font-extrabold text-slate-800">
            {formatKL(nominasi)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span className="text-sm font-medium text-gray-500">
              {tab === "Penyaluran" ? "Penerimaan" : "Pemakaian"}
            </span>
          </div>
          <span className="text-sm font-extrabold text-slate-800">
            {formatKL(value)}
          </span>
        </div>
      </div>

      {description && (
        <p className="text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100 min-h-[32px]">
          {description}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  nominasi: number;
  realisasi: number;
  pemakaian: number;
  description?: string;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
};

export default function NominationAchievementChart({
  nominasi,
  realisasi,
  pemakaian,
  description = "Visualisasi persentase pencapaian nominasi terhadap realisasi penyaluran dan pemakaian BBM",
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: Props) {
  const [tab, setTab] = useState<"Penyaluran" | "Pemakaian">("Penyaluran");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  const handleApply = () => {
    if (onStartDateChange && tempStartDate) onStartDateChange(tempStartDate);
    if (onEndDateChange && tempEndDate) onEndDateChange(tempEndDate);
    setShowDateFilter(false);
  };

  const value = tab === "Penyaluran" ? realisasi : pemakaian;

  let percentage = 0;
  if (nominasi > 0) {
    percentage = Math.round((value / nominasi) * 100);
    percentage = Math.min(percentage, 100);
  }

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
      <div className="flex justify-between items-center relative z-20">
        <h3 className="text-lg font-semibold text-gray-900">
          Pencapaian Nominasi
        </h3>
        {onStartDateChange && onEndDateChange && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${showDateFilter
                ? "bg-secondary/10 text-primary border border-secondary/30"
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
          </div>
        )}
      </div>

      {showDateFilter && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-1 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Awal
              </label>
              <input
                type="date"
                value={tempStartDate ?? ""}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300
                         bg-white text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary
                         transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={tempEndDate ?? ""}
                min={tempStartDate ?? undefined}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300
                         bg-white text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary
                         transition-all duration-200"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center mt-4">
        <div className="inline-flex bg-gray-100 rounded-lg p-0.5 border border-transparent">
          <button
            onClick={() => setTab("Penyaluran")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${tab === "Penyaluran"
              ? "bg-secondary text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Penyaluran
          </button>
          <button
            onClick={() => setTab("Pemakaian")}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${tab === "Pemakaian"
              ? "bg-secondary text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Pemakaian
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative mt-4">
        <div className="h-56 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="90%"
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
            <span className="text-3xl font-extrabold text-slate-800">
              {percentage}%
            </span>
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] mt-2">
              TERCAPAI
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-50 space-y-4 mb-3">
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
              {tab === "Penyaluran" ? "Penyaluran" : "Pemakaian"}
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

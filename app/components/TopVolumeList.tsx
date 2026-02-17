"use client";

import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

interface TopVolumeItem {
  name: string;
  volume: string;
}

interface TopVolumeListProps {
  title: string;
  list: TopVolumeItem[];
  unit: string;
  description: string;
  /** Optional date range filter support */
  startDate?: string | null;
  endDate?: string | null;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
}

export default function TopVolumeList({
  title,
  list,
  unit,
  description,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: TopVolumeListProps) {
  const [showDateFilter, setShowDateFilter] = useState(false);

  const hasDateFilter = !!(onStartDateChange && onEndDateChange);

  return (
    <div className="bg-white rounded-xl p-1 flex flex-col pb-4 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center pr-5">
        <h3 className="text-lg font-semibold text-gray-900 py-4 px-6">
          {title}
        </h3>
        {hasDateFilter && (
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              showDateFilter
                ? "bg-[#14a2bb]/10 text-[#115d72] border border-[#14a2bb]/30"
                : "text-gray-500 hover:bg-gray-100 border border-transparent"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {showDateFilter ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Collapsible Date Range Filter */}
      {hasDateFilter && showDateFilter && (
        <div className="mx-5 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Awal
              </label>
              <input
                type="date"
                value={startDate ?? ""}
                onChange={(e) => onStartDateChange?.(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300
                         bg-white text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb]
                         transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate ?? ""}
                min={startDate ?? undefined}
                onChange={(e) => onEndDateChange?.(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300
                         bg-white text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb]
                         transition-all duration-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="overflow-auto flex-1 p-5">
        {list.map((value, index) => (
          <div
            key={index}
            className={`text-gray-900 flex justify-between py-1.5 ${
              list.length - 1 != index ? "border-b border-gray-400" : ""
            }`}
          >
            <div>{value.name}</div>
            <div className="flex gap-1 font-bold">
              {value.volume} {unit}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200 mx-6">
        {description}
      </p>
    </div>
  );
}

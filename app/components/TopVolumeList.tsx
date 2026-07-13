"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

interface TopVolumeItem {
  name: string;
  volume: string | number;
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
  /** Optional product and moda filter support */
  product?: string | null;
  moda?: string | null;
  onProductChange?: (value: string | null) => void;
  onModaChange?: (value: string | null) => void;
  productOptions?: string[];
  modaOptions?: string[];
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
  product,
  moda,
  onProductChange,
  onModaChange,
  productOptions = [],
  modaOptions = [],
}: TopVolumeListProps) {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [tempProduct, setTempProduct] = useState(product);
  const [tempModa, setTempModa] = useState(moda);

  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempProduct(product);
    setTempModa(moda);
  }, [startDate, endDate, product, moda]);

  const handleApply = () => {
    if (onStartDateChange && tempStartDate) onStartDateChange(tempStartDate);
    if (onEndDateChange && tempEndDate) onEndDateChange(tempEndDate);
    if (onProductChange) onProductChange(tempProduct || null);
    if (onModaChange) onModaChange(tempModa || null);
    setShowDateFilter(false);
  };

  const hasDateFilter = !!(onStartDateChange && onEndDateChange);

  return (
    <div className="bg-white rounded-xl p-1 flex flex-col pb-6 border border-gray-200 h-full">
      {/* Header */}
      <div className="flex justify-between items-center pr-5">
        <h3 className="text-lg font-semibold text-gray-900 py-4 px-6 whitespace-nowrap truncate flex-1 min-w-0">
          {title}
        </h3>
        {hasDateFilter && (
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${showDateFilter
                ? "bg-secondary/10 text-primary border border-secondary/30"
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

      {/* Collapsible Filter */}
      {hasDateFilter && showDateFilter && (
        <div className="mx-5 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-1">
          <div className="grid grid-cols-2 gap-3 mb-3">
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

          {(onProductChange || onModaChange) && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {onProductChange && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                    Produk
                  </label>
                  <select
                    value={tempProduct || ""}
                    onChange={(e) => setTempProduct(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all duration-200"
                  >
                    <option value="">Semua Produk</option>
                    {productOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}
              {onModaChange && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                    Moda Transportasi
                  </label>
                  <select
                    value={tempModa || ""}
                    onChange={(e) => setTempModa(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all duration-200"
                  >
                    <option value="">Semua Moda</option>
                    {modaOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end mt-3 border-t border-gray-200 pt-3">
            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:brightness-90 transition-colors"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="overflow-auto flex-1 p-5 min-h-[150px]">
        {list.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Tidak ada data
          </div>
        ) : (
          list.map((value, index) => (
            <div
              key={index}
              className={`text-gray-900 flex justify-between py-1.5 ${list.length - 1 != index ? "border-b border-gray-400" : ""
                }`}
            >
              <div>{value.name}</div>
              <div className="flex gap-1 font-bold">
                {Number(value.volume).toLocaleString("id-ID")} {unit}
              </div>
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-gray-500 mt-auto pt-4 border-t border-gray-200 mx-6 min-h-[32px]">
        {description}
      </p>
    </div>
  );
}

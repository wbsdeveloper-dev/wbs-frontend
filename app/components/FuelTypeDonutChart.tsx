"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Expand, Calendar, ChevronDown, ChevronUp, Image as ImageIcon, FileText } from "lucide-react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { CHART_COLORS } from "@/app/_constants";

interface DataPieChart {
  name: string;
  value: number;
  [key: string]: any;
}

type Props = {
  openModalFunction: () => void;
  data: DataPieChart[];
  changeFilterType: (value: string | null) => void;
  filterType: string | null;
  /** Selected distribution start date (YYYY-MM-DD) */
  startDate: string;
  endDate: string;
  /** Called when the user picks a new date */
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  title?: string;
  descriptionPrefix?: string;
  descriptionFuelType?: string;
  tabs?: string[];
  /** Optional moda filter support */
  moda?: string | null;
  onModaChange?: (value: string | null) => void;
  modaOptions?: string[];
};

export default function FuelTypeDonutChart({
  openModalFunction,
  data,
  changeFilterType,
  filterType,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  title = "Konsumsi Gas",
  descriptionPrefix = "Visualisasi konsumsi gas",
  descriptionFuelType = "gas",
  tabs = ["Pemasok", "Pembangkit"],
  moda,
  onModaChange,
  modaOptions = [],
}: Props) {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [tempModa, setTempModa] = useState(moda);

  const chartRef = useRef<HTMLDivElement>(null);

  const filterExportButtons = (node: HTMLElement) => {
    if (node?.classList?.contains("export-buttons-container")) return false;
    return true;
  };

  const handleExportImage = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(chartRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        filter: filterExportButtons as any,
      });
      const link = document.createElement("a");
      link.download = `volume-bbm-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await htmlToImage.toCanvas(chartRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        filter: filterExportButtons as any,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`volume-bbm-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF", err);
    }
  };

  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempModa(moda);
  }, [startDate, endDate, moda]);

  const handleApply = () => {
    if (onStartDateChange && tempStartDate) onStartDateChange(tempStartDate);
    if (onEndDateChange && tempEndDate) onEndDateChange(tempEndDate);
    if (onModaChange) onModaChange(tempModa || null);
    setShowDateFilter(false);
  };

  /** Format YYYY-MM-DD → human-readable Indonesian date */
  const formattedDate = (() => {
    try {
      const start = new Date(startDate + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const end = new Date(endDate + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `${start} - ${end}`;
    } catch {
      return `${startDate} - ${endDate}`;
    }
  })();

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const chartData = useMemo(() => {
    if (total === 0) return data;
    const grouped: any[] = [];
    let lainLainValue = 0;

    data.forEach((item, index) => {
      const pct = (item.value / total) * 100;
      if (pct < 1) {
        lainLainValue += item.value;
      } else {
        grouped.push({ ...item, originalIndex: index });
      }
    });

    if (lainLainValue > 0) {
      grouped.push({
        name: "Lain-lain",
        value: lainLainValue,
        originalIndex: -1
      });
    }

    return grouped;
  }, [data, total]);

  return (
    <div ref={chartRef} className="bg-white rounded-xl p-6 border border-gray-200 flex flex-col h-full">
      {/* Header row */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap truncate flex-1 min-w-0 mr-2">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="export-buttons-container flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={handleExportImage}
              className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-50 transition-all duration-200"
              title="Export as Image (PNG)"
            >
              <ImageIcon size={14} />
            </button>
            <button
              onClick={handleExportPDF}
              className="p-1.5 rounded-md text-rose-400 hover:bg-rose-50 transition-all duration-200"
              title="Export as PDF"
            >
              <FileText size={14} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            {/* Date filter toggle */}
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${showDateFilter
                ? "bg-secondary/10 text-primary border border-secondary/30"
                : "text-gray-500 hover:bg-gray-100 border border-transparent"
                }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">
                {onModaChange ? "Filter" : "Tanggal"}
              </span>
              {showDateFilter ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Expand button */}
            <button
              onClick={openModalFunction}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Expand className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible date picker & filters */}
      {showDateFilter && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-1">
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

          {onModaChange && (
            <div className="mb-3">
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
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
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

      {/* Pemasok / Pembangkit tabs */}
      <div className="flex items-center mt-4 mb-2 justify-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
          {tabs.map((type) => (
            <button
              key={type}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${filterType === type
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                }`}
              onClick={() => changeFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-[250px] flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.originalIndex !== -1
                      ? CHART_COLORS[entry.originalIndex % CHART_COLORS.length]
                      : "#cbd5e1" // gray for Lain-lain
                  }
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  const pct =
                    total > 0
                      ? (((item.value as number) / total) * 100).toFixed(2)
                      : "0.00";
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
              formatter={(value: string, entry: any) => {
                const val = entry?.payload?.value || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(2) : "0.00";
                return `${value} (${pct}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Dynamic footer */}
      <p className="text-xs text-gray-500 mt-auto pt-4 border-t border-gray-200 min-h-[32px]">
        {descriptionPrefix} pada setiap{" "}
        {filterType?.toLowerCase() ?? "pembangkit"} PLN EPI per tanggal{" "}
        {formattedDate}
      </p>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  Menu,
  ChevronDown,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import type { ReportRecord } from "@/hooks/service/reports-api";

interface BBMDataTableProps {
  records: ReportRecord[];
  totalItems: number;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

export default function BBMDataTable({
  records,
  totalItems,
  isLoading,
  page,
  pageSize,
  onPageChange,
}: BBMDataTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;

  type SortField = keyof ReportRecord;
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortField(null);
      setSortDir("asc");
    }
  };

  const sortedRecords = useMemo(() => {
    if (!sortField) return records;
    return [...records].sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [records, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ChevronsUpDown size={12} className="ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="ml-1 text-[#115d72]" />
    ) : (
      <ArrowDown size={12} className="ml-1 text-[#115d72]" />
    );
  };

  const Th = ({
    label,
    field,
    align = "center",
  }: {
    label: string;
    field?: SortField;
    align?: "left" | "center" | "right";
  }) => (
    <th
      className={`px-4 py-3 text-${align} text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${
        field
          ? "cursor-pointer select-none hover:bg-gray-100 transition-colors"
          : ""
      }`}
      onClick={field ? () => handleSort(field) : undefined}
    >
      <span className="inline-flex items-center justify-center">
        {label}
        {field && <SortIcon field={field} />}
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Table Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <Menu size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Table Monitoring Data
          </span>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th label="No" />
              <Th label="Loading Port" field="LOADING_PORT" align="left" />
              <Th label="Work Date" field="WORK_DATE" />
              <Th label="Mode" field="MODE_NAME" />
              <Th label="Intervention" field="INTERVENTION_NAME" />
              <Th label="Volume" field="VOLUME" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2
                      className="animate-spin text-[#14a2bb]"
                      size={20}
                    />
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Tidak ada data
                </td>
              </tr>
            ) : (
              sortedRecords.map((record, index) => (
                <tr
                  key={record.ID}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-center text-gray-700">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {record.LOADING_PORT || "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 whitespace-nowrap">
                    {record.WORK_DATE || "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {record.MODE_NAME || "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {record.INTERVENTION_NAME || "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 font-mono font-medium">
                    {record.VOLUME != null ? Number(record.VOLUME).toFixed(2) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">
              Menampilkan{" "}
              {totalItems > 0 ? (
                <span className="font-medium text-gray-900">
                  {startIndex + 1}
                </span>
              ) : (
                "0"
              )}{" "}
              hingga{" "}
              <span className="font-medium text-gray-900">
                {Math.min(startIndex + pageSize, totalItems)}
              </span>{" "}
              dari{" "}
              <span className="font-medium text-gray-900">{totalItems}</span>{" "}
              data
            </span>
            <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
              <span className="text-sm text-gray-600">Baris per halaman:</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => onPageChange(1, Number(e.target.value))}
                  className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#14a2bb] focus:border-[#14a2bb] block pl-3 pr-8 py-1.5 cursor-pointer outline-none hover:bg-gray-100 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

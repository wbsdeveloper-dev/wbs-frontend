import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Loader2, Search, ChevronLeft, Menu, Filter, X } from "lucide-react";

type Reconciliation = {
  upstream_id: string;
  downstream_id: string;
  upstream_name: string;
  downstream_name: string;
  report_date: string;
  type: string;
  mmscfd: number | null;
  bbtud: number | null;
};

type TransportirResume = {
  id: string;
  shipper: string;
  report_date: string;
  opening_stock: number;
  supply_stock: number;
  delivered_stock: number;
  own_use: number;
  stock_transfer: number;
  discrepancy: number;
  closing_stock: number;
  reconciliations: Reconciliation[];
};

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TransportirTableProps {
  data: TransportirResume[];
  isLoading: boolean;
  pagination?: Pagination;
  filters?: { shipper?: string; start_date?: string; end_date?: string };
  onPageChange?: (page: number, limit: number) => void;
  onFilterChange?: (filters: { shipper?: string; start_date?: string; end_date?: string }) => void;
}

export default function TransportirTable({ 
  data, 
  isLoading, 
  pagination, 
  filters, 
  onPageChange, 
  onFilterChange 
}: TransportirTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  // Local state for filters
  const [localShipper, setLocalShipper] = useState(filters?.shipper || "");
  const [localStartDate, setLocalStartDate] = useState(filters?.start_date || "");
  const [localEndDate, setLocalEndDate] = useState(filters?.end_date || "");

  // Sync external filters to local state if they change
  useEffect(() => {
    setLocalShipper(filters?.shipper || "");
    setLocalStartDate(filters?.start_date || "");
    setLocalEndDate(filters?.end_date || "");
  }, [filters]);

  const handleApplyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        shipper: localShipper || undefined,
        start_date: localStartDate || undefined,
        end_date: localEndDate || undefined,
      });
    }
  };

  const handleResetFilters = () => {
    setLocalShipper("");
    setLocalStartDate("");
    setLocalEndDate("");
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  const formatNum = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "-";
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {/* Header section with title and search */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <Menu size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Data Transportir
          </span>
          <span className="text-xs text-gray-500 font-normal ml-2">
            (Total {pagination?.total || 0} record ditemukan)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
              showFilters
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter size={16} />
            Filter
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ml-1 ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Filters section */}
      {showFilters && (
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Shipper
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={localShipper}
                    onChange={(e) => setLocalShipper(e.target.value)}
                    placeholder="Cari shipper..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Filter actions */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <X size={14} />
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
              >
                <Search size={14} />
                Terapkan Filter
              </button>
            </div>
          </div>
        )}

      {/* Table */}
      <div className="overflow-x-auto relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Search className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">
              Tidak ada data ditemukan
            </p>
            <p className="text-sm">
              Coba sesuaikan filter pencarian Anda
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold w-10"></th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Report Date</th>
                <th className="px-4 py-3 font-semibold">Shipper</th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Opening Stock</th>
                <th className="px-4 py-3 font-semibold text-right">Supply</th>
                <th className="px-4 py-3 font-semibold text-right">Delivered</th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Own Use</th>
                <th className="px-4 py-3 font-semibold text-right">Transfer</th>
                <th className="px-4 py-3 font-semibold text-right">Discrepancy</th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Closing Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row) => (
                <React.Fragment key={row.id}>
                  <tr 
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedRows.has(row.id) ? 'bg-blue-50/50' : ''}`}
                    onClick={() => toggleRow(row.id)}
                  >
                    <td className="px-4 py-3">
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        {expandedRows.has(row.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.report_date?.split('T')[0]}</td>
                    <td className="px-4 py-3">{row.shipper}</td>
                    <td className="px-4 py-3 text-right">{formatNum(row.opening_stock)}</td>
                    <td className="px-4 py-3 text-right">{formatNum(row.supply_stock)}</td>
                    <td className="px-4 py-3 text-right">{formatNum(row.delivered_stock)}</td>
                    <td className="px-4 py-3 text-right">{formatNum(row.own_use)}</td>
                    <td className="px-4 py-3 text-right">{formatNum(row.stock_transfer)}</td>
                    <td className={`px-4 py-3 text-right ${row.discrepancy < 0 ? 'text-red-600 font-medium' : row.discrepancy > 0 ? 'text-emerald-600 font-medium' : ''}`}>{formatNum(row.discrepancy)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatNum(row.closing_stock)}</td>
                  </tr>
                  {expandedRows.has(row.id) && (
                    <tr>
                      <td colSpan={10} className="p-0 border-b border-gray-100 bg-gray-50/50">
                        <div className="pl-14 pr-4 py-4">
                          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Detail Rekonsiliasi</h5>
                          {row.reconciliations && row.reconciliations.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Hulu Table */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <h6 className="text-sm font-semibold text-gray-800">Data Hulu</h6>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                  <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50 text-gray-900 border-b border-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 font-medium">Upstream</th>
                                        <th className="px-4 py-2 font-medium">Report Date</th>
                                        <th className="px-4 py-2 font-medium text-right">MMSCFD</th>
                                        <th className="px-4 py-2 font-medium text-right">BBTUD</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {row.reconciliations.filter(r => r.type === 'hulu').length > 0 ? (
                                        row.reconciliations.filter(r => r.type === 'hulu').map((rec, i) => (
                                          <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">{rec.upstream_name || "-"}</td>
                                            <td className="px-4 py-2">{rec.report_date?.split('T')[0]}</td>
                                            <td className="px-4 py-2 text-right">{formatNum(rec.mmscfd)}</td>
                                            <td className="px-4 py-2 text-right">{formatNum(rec.bbtud)}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-400 italic">Tidak ada data hulu</td></tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Hilir Table */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  <h6 className="text-sm font-semibold text-gray-800">Data Hilir</h6>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                  <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50 text-gray-900 border-b border-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 font-medium">Upstream</th>
                                        <th className="px-4 py-2 font-medium">Downstream</th>
                                        <th className="px-4 py-2 font-medium">Report Date</th>
                                        <th className="px-4 py-2 font-medium text-right">MMSCFD</th>
                                        <th className="px-4 py-2 font-medium text-right">BBTUD</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {row.reconciliations.filter(r => r.type === 'hilir').length > 0 ? (
                                        row.reconciliations.filter(r => r.type === 'hilir').map((rec, i) => (
                                          <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">{rec.upstream_name || "-"}</td>
                                            <td className="px-4 py-2">{rec.downstream_name || "-"}</td>
                                            <td className="px-4 py-2">{rec.report_date?.split('T')[0]}</td>
                                            <td className="px-4 py-2 text-right">{formatNum(rec.mmscfd)}</td>
                                            <td className="px-4 py-2 text-right">{formatNum(rec.bbtud)}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr><td colSpan={5} className="px-4 py-3 text-center text-gray-400 italic">Tidak ada data hilir</td></tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic py-2">
                              Tidak ada data rekonsiliasi yang terhubung dengan laporan ini.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination Footer */}
      {!isLoading && pagination && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-t border-gray-200 gap-3 bg-white mt-auto">
          {/* Left: info + page size */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">
              Menampilkan{" "}
              {pagination.total > 0 ? (
                <>
                  {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
                  {pagination.total}
                </>
              ) : (
                "0"
              )}{" "}
              data
            </span>
            <div className="flex items-center gap-1.5">
              <label htmlFor="page-size" className="text-sm text-gray-500">
                Baris:
              </label>
              <select
                id="page-size"
                value={pagination.limit}
                onChange={(e) => {
                  onPageChange && onPageChange(1, Number(e.target.value));
                }}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
              >
                {[5, 10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: page buttons */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* Previous */}
              <button
                onClick={() => onPageChange && onPageChange(pagination.page - 1, pagination.limit)}
                disabled={pagination.page <= 1}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
              {(() => {
                const pages: (number | "...")[] = [];
                const displayPage = pagination.page;
                const totalPages = pagination.totalPages;
                
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (displayPage > 3) pages.push("...");
                  const start = Math.max(2, displayPage - 1);
                  const end = Math.min(totalPages - 1, displayPage + 1);
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (displayPage < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }
                
                return pages.map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-sm text-gray-400 select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => onPageChange && onPageChange(p as number, pagination.limit)}
                      className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                        p === displayPage
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                );
              })()}

              {/* Next */}
              <button
                onClick={() => onPageChange && onPageChange(pagination.page + 1, pagination.limit)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

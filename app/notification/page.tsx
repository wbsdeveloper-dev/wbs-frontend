"use client";

import { useState, useCallback, useMemo } from "react";
import NotificationDataTable, { NotificationRecord } from "../components/NotificationDataTable";
import type { MonitoringParams } from "@/hooks/service/monitoring-api";

// Dummy data for problematic records
const DUMMY_RECORDS: NotificationRecord[] = [
  {
    id: "NOTIF-001",
    reportDate: "2024-03-15",
    supplierName: "PT Pertamina",
    siteName: "PLTGU Muara Karang",
    metricType: "FLOWRATE_MMSCFD",
    finalValue: 45.2,
    status: "DI_BAWAH_TOP",
  },
  {
    id: "NOTIF-002",
    reportDate: "2024-03-15",
    supplierName: "ConocoPhillips",
    siteName: "PLTGU Muara Tawar",
    metricType: "ENERGY_BBTUD",
    finalValue: null,
    status: "DATA_HILANG",
  },
];

export default function NotificationPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<MonitoringParams>({});

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
    [],
  );

  const handleFilterChange = useCallback((newFilters: MonitoringParams) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  }, []);

  // Simple client-side filtering for dummy data
  const filteredRecords = useMemo(() => {
    let result = [...DUMMY_RECORDS];
    if (filters.id) {
      result = result.filter(r => r.id.toLowerCase().includes(filters.id!.toLowerCase()));
    }
    if (filters.supplierName) {
      result = result.filter(r => r.supplierName.toLowerCase().includes(filters.supplierName!.toLowerCase()));
    }
    if (filters.siteName) {
      result = result.filter(r => r.siteName.toLowerCase().includes(filters.siteName!.toLowerCase()));
    }
    if (filters.status) {
      result = result.filter(r => r.status === filters.status);
    }
    if (filters.startDate) {
      result = result.filter(r => r.reportDate >= filters.startDate!);
    }
    if (filters.endDate) {
      result = result.filter(r => r.reportDate <= filters.endDate!);
    }
    return result;
  }, [filters]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Notifikasi
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Daftar record data bermasalah yang membutuhkan perhatian
          </p>
        </div>
      </div>

      <div className="mb-6 md:mb-8">
        <NotificationDataTable
          records={paginatedRecords}
          pagination={{
            page,
            limit: pageSize,
            total: filteredRecords.length,
            totalPages: Math.ceil(filteredRecords.length / pageSize),
          }}
          isLoading={false}
          onPageChange={handlePageChange}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
}

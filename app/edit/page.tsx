"use client";

import { useState, useCallback } from "react";
import EditDataTable from "../components/EditDataTable";
import {
  useMonitoringRecords,
  type MonitoringParams,
} from "@/hooks/service/monitoring-api";

export default function Home() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<MonitoringParams>({});

  const { data, isLoading } = useMonitoringRecords({
    page,
    limit: pageSize,
    ...filters,
  });

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

  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Tabel Edit Gas Pipa
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Tabel edit untuk melakukan penyesuaian data pada kegiatan gas
                pipa
              </p>
            </div>
          </div>

          <div className="mb-6 md:mb-8">
            <div className="mb-6 md:mb-8">
              <EditDataTable
                records={data?.records ?? []}
                pagination={
                  data?.pagination ?? {
                    page,
                    limit: pageSize,
                    total: 0,
                    totalPages: 0,
                  }
                }
                isLoading={isLoading}
                onPageChange={handlePageChange}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

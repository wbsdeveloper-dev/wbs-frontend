"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { usePrivilege } from "@/hooks/usePrivilege";
import { Loader2 } from "lucide-react";
import NotificationDataTable from "../components/NotificationDataTable";
import type { NotificationRecord as TableNotificationRecord } from "../components/NotificationDataTable";
import { useNotifications } from "@/hooks/service/notification-api";
import type { NotificationParams } from "@/hooks/service/notification-api";
import type { MonitoringParams } from "@/hooks/service/monitoring-api";

export default function NotificationPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuth();
  const { hasPrivilege } = usePrivilege();
  const canRead = hasPrivilege("notification", "READ");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<MonitoringParams>({});

  // Build query params for the notification API
  const queryParams: NotificationParams = {
    page,
    limit: pageSize,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.supplierName ? { supplierName: filters.supplierName } : {}),
    ...(filters.siteName ? { siteName: filters.siteName } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
  };

  const { data, isLoading } = useNotifications(queryParams);

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

  // Map API records to the table component's expected shape
  const records: TableNotificationRecord[] = (data?.records ?? []).map((r) => ({
    id: r.id,
    reportDate: r.reportDate,
    supplierName: r.supplierName ?? "-",
    siteName: r.siteName,
    metricType: r.metricType,
    finalValue: r.finalValue,
    status: r.status,
    isRead: r.isRead,
  }));

  const pagination = data?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 1,
  };

  useEffect(() => {
    if (!isAuthLoading && !canRead) {
      router.push("/landingpage");
    }
  }, [isAuthLoading, canRead, router]);

  if (isAuthLoading || !canRead) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-secondary" size={32} />
      </div>
    );
  }

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
          records={records}
          pagination={pagination}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
}

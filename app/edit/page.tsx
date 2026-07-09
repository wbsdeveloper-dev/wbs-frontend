"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Upload, FileText, Loader2 } from "lucide-react";
import EditDataTable from "../components/EditDataTable";
import AddReconciliationModal from "../components/AddReconciliationModal";
import BulkUploadReconciliationModal from "../components/BulkUploadReconciliationModal";
import InputBAValidasiModal from "../components/InputBAValidasiModal";
import {
  useMonitoringRecords,
  type MonitoringParams,
} from "@/hooks/service/monitoring-api";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<MonitoringParams>({});

  const { hasPrivilege } = usePrivilege();
  const { isLoading: isAuthLoading } = useAuth();
  
  const canRead = hasPrivilege("data_management", "READ");
  const canCreate = hasPrivilege("data_management", "CREATE");

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [openBAModal, setOpenBAModal] = useState(false);

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

  // Redirect if unauthorized
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
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Manajemen Data
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Tabel edit untuk melakukan penyesuaian data pada kegiatan gas
                pipa
              </p>
            </div>
            <div className="flex gap-3">
              {canCreate && (
                <>
                  <button
                    onClick={() => setOpenBAModal(true)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer shadow-sm"
                  >
                    <FileText size={16} /> Input BA & Validasi
                  </button>
                  <button
                    onClick={() => setOpenAddModal(true)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus size={16} /> Input Data
                  </button>
                  <button
                    onClick={() => setOpenBulkModal(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-[#0d4a5c] transition-colors cursor-pointer shadow-sm"
                  >
                    <Upload size={16} /> Multi Input Data
                  </button>
                </>
              )}
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

      {openAddModal && (
        <AddReconciliationModal setOpenModal={setOpenAddModal} />
      )}
      {openBulkModal && (
        <BulkUploadReconciliationModal setOpenModal={setOpenBulkModal} />
      )}
      {openBAModal && (
        <InputBAValidasiModal setOpenModal={setOpenBAModal} />
      )}
    </div>
  );
}

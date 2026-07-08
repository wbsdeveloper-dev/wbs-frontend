"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useRouter } from "next/navigation";
import UploadKonfigurasiModal from "./components/UploadKonfigurasiModal";
import TransportirTable from "./components/TransportirTable";
import { useTransportirResume, TransportirResumeParams } from "@/hooks/service/transportir-api";

export default function DataTransportirPage() {
  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const { isLoading: isAuthLoading } = useAuth();
  
  const canRead = hasPrivilege("data_transportir_gas", "READ");
  const canCreate = hasPrivilege("data_transportir_gas", "CREATE");

  const [openModal, setOpenModal] = useState(false);
  const [params, setParams] = useState<TransportirResumeParams>({
    page: 1,
    limit: 10,
  });

  const { data: resumeResponse, isLoading } = useTransportirResume(params);

  const handlePageChange = useCallback((newPage: number, newLimit: number) => {
    setParams((prev) => ({ ...prev, page: newPage, limit: newLimit }));
  }, []);

  const handleFilterChange = useCallback((newFilters: Omit<TransportirResumeParams, "page" | "limit">) => {
    setParams((prev) => ({ ...prev, ...newFilters, page: 1 }));
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
                Data Transportir
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Tabel monitoring data transportir (Stock dan Rekonsiliasi)
              </p>
            </div>
            <div className="flex gap-3">
              {canCreate && (
                <button
                  onClick={() => setOpenModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-[#0d4a5c] transition-colors cursor-pointer shadow-sm"
                >
                  <Plus size={16} /> Input Data Transportir
                </button>
              )}
            </div>
          </div>

          <div className="mb-6 md:mb-8">
            <TransportirTable 
              data={resumeResponse?.data || []} 
              pagination={resumeResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }}
              isLoading={isLoading} 
              filters={{ shipper: params.shipper, start_date: params.start_date, end_date: params.end_date }}
              onPageChange={handlePageChange}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
      </main>

      {openModal && (
        <UploadKonfigurasiModal setOpenModal={setOpenModal} />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Plus, Upload } from "lucide-react";
import EditBbmDataTable from "../components/EditBbmDataTable";
import AddBbmModal from "../components/AddBbmModal";
import BulkUploadBbmModal from "../components/BulkUploadBbmModal";
import { useBbmMonthly } from "@/hooks/service/bbm-api";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const { isLoading: isAuthLoading } = useAuth();

  const canRead = hasPrivilege("data_management", "READ");
  const canCreate = hasPrivilege("data_management", "CREATE");

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);

  const { data, isLoading } = useBbmMonthly();

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
                Tabel edit untuk melakukan penyesuaian data pada kegiatan BBM
              </p>
            </div>
            <div className="flex gap-3">
              {canCreate && (
                <>
                  <button
                    onClick={() => setOpenAddModal(true)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus size={16} /> Input Data
                  </button>
                  <button
                    onClick={() => setOpenBulkModal(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:brightness-90 transition-colors cursor-pointer shadow-sm"
                  >
                    <Upload size={16} /> Upload Kertas Kerja Rakor BBM
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mb-6 md:mb-8">
            <div className="mb-6 md:mb-8">
              <EditBbmDataTable records={data ?? []} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>

      {openAddModal && <AddBbmModal setOpenModal={setOpenAddModal} />}
      {openBulkModal && <BulkUploadBbmModal setOpenModal={setOpenBulkModal} />}
    </div>
  );
}

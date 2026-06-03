"use client";

import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import EditBbmDataTable from "../components/EditBbmDataTable";
import AddBbmModal from "../components/AddBbmModal";
import BulkUploadBbmModal from "../components/BulkUploadBbmModal";
import { useBbmMonthly } from "@/hooks/service/bbm-api";
import { usePrivilege } from "@/hooks/usePrivilege";

export default function Home() {
  const { hasPrivilege } = usePrivilege();
  const canCreate = hasPrivilege("data_management", "CREATE");

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);

  const { data, isLoading } = useBbmMonthly();

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
                    className="px-4 py-2 bg-[#115d72] text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-[#0d4a5c] transition-colors cursor-pointer shadow-sm"
                  >
                    <Upload size={16} /> Input Nominasi & Pemakaian
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

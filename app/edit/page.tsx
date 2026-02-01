"use client";

import EditDataTable from "../components/EditDataTable";

export default function Home() {
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
              <EditDataTable />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

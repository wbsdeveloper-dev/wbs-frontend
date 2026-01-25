"use client";

import EditDataTable from "../components/EditDataTable";

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tabel Edit Gas Pipa
              </h1>
              <p className="text-gray-600 mt-1">
                Tabel edit untuk melakukan penyesuaian data pada kegiatan gas
                pipa
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-8">
              <EditDataTable />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

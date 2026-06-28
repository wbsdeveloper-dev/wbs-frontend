"use client";

import KertasKerjaTable from "@/app/components/KertasKerjaTable";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function KertasKerjaPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-6 md:mb-8 flex flex-col gap-2">
            <Link 
              href="/edit-bbm"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors w-fit"
            >
              <ArrowLeft size={16} />
              Kembali ke Manajemen Data
            </Link>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Kertas Kerja BBM
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Tabel rekapitulasi kertas kerja rakor BBM
              </p>
            </div>
          </div>

          <div className="mb-6 md:mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <KertasKerjaTable />
          </div>
        </div>
      </main>
    </div>
  );
}

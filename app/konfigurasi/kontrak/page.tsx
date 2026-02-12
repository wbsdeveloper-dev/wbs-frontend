"use client";

import ContractTable from "../../components/ContractTable";

export default function KontrakPage() {
    return (
        <div className="flex h-screen bg-gray-50">
            <main className="flex-1 overflow-auto">
                <div className="p-4 md:p-6 lg:p-8">
                    {/* Breadcrumb */}
                    <div className="text-sm text-gray-500 mb-2">
                        <span>Konfigurasi Sistem</span>
                        <span className="mx-2">&gt;</span>
                        <span className="text-gray-900">Kontrak & Dokumen</span>
                    </div>

                    {/* Header */}
                    <div className="mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            Kontrak & Dokumen
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm md:text-base">
                            Detail kontrak dan dokumen gas pipa
                        </p>
                    </div>

                    {/* Contract Table */}
                    <div className="mb-6 md:mb-8">
                        <ContractTable />
                    </div>
                </div>
            </main>
        </div>
    );
}

"use client";

import { useState, useRef, useEffect } from "react";
import KertasKerjaTable from "@/app/components/KertasKerjaTable";
import RingkasanTable from "@/app/components/RingkasanTable";
import {
  ArrowLeft,
  FileText,
  PieChart,
  ChevronDown,
  Check,
  Search,
  Loader2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import BulkUploadKertasKerjaModal from "@/app/components/BulkUploadKertasKerjaModal";
import {
  useKertasKerjaMaster,
  useKertasKerjaTemplates,
  useKertasKerjaRecords,
} from "@/hooks/service/kertas-kerja-api";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

export default function KertasKerjaPage() {
  const [activeTab, setActiveTab] = useState("kertas-kerja");
  const [selectedRegion, setSelectedRegion] = useState("");
  const { data: regions = [] } = useKertasKerjaMaster("master_region");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { data: templates = [] } = useKertasKerjaTemplates();
  const { refetch: refetchRecords } = useKertasKerjaRecords();

  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const { isLoading: isAuthLoading } = useAuth();

  const canRead = hasPrivilege("kertas_kerja_bbm", "READ");
  const canUpdate = hasPrivilege("kertas_kerja_bbm", "UPDATE");

  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        regionRef.current &&
        !regionRef.current.contains(event.target as Node)
      ) {
        setIsRegionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRegions = regions.filter((r: any) =>
    r.name.toLowerCase().includes(regionSearch.toLowerCase()),
  );

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 md:p-6 lg:p-8 flex flex-col h-full overflow-hidden">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
            <div className="flex flex-col gap-2">
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

            <div className="flex gap-3">
              {canUpdate && (
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:brightness-90 transition-colors cursor-pointer shadow-sm"
                >
                  <Upload size={16} /> Upload Kertas Kerja Rakor BBM
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden min-h-0">
            {/* Controls Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-gray-100 pb-4 shrink-0">
              {/* Region Filter */}
              <div className="flex items-center gap-3 relative" ref={regionRef}>
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filter Region:
                </span>
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsRegionDropdownOpen(!isRegionDropdownOpen)
                    }
                    className="flex items-center justify-between pl-3 pr-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 min-w-[200px]"
                  >
                    <span
                      className={
                        selectedRegion ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {selectedRegion || "Semua Region"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-500 transition-transform ${isRegionDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isRegionDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full min-w-[220px] bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            placeholder="Cari region..."
                            value={regionSearch}
                            onChange={(e) => setRegionSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm text-gray-400 bg-gray-50 border border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-md outline-none transition-all"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto p-1 custom-scrollbar">
                        <button
                          onClick={() => {
                            setSelectedRegion("");
                            setIsRegionDropdownOpen(false);
                            setRegionSearch("");
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${!selectedRegion ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                          Semua Region
                          {!selectedRegion && <Check size={14} />}
                        </button>
                        {filteredRegions.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-gray-500">
                            Region tidak ditemukan
                          </div>
                        ) : (
                          filteredRegions.map((r: any) => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setSelectedRegion(r.name);
                                setIsRegionDropdownOpen(false);
                                setRegionSearch("");
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${selectedRegion === r.name ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-100"}`}
                            >
                              {r.name}
                              {selectedRegion === r.name && <Check size={14} />}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab("kertas-kerja")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === "kertas-kerja"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                    }`}
                >
                  <FileText size={16} />
                  Kertas Kerja
                </button>
                <button
                  onClick={() => setActiveTab("ringkasan")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === "ringkasan"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                    }`}
                >
                  <PieChart size={16} />
                  Ringkasan
                </button>
              </div>
            </div>

            {activeTab === "kertas-kerja" && (
              <KertasKerjaTable
                selectedRegion={selectedRegion}
                canUpdate={canUpdate}
              />
            )}
            {activeTab === "ringkasan" && (
              <RingkasanTable selectedRegion={selectedRegion} />
            )}
          </div>
        </div>
      </main>

      {isUploadOpen && (
        <BulkUploadKertasKerjaModal
          templates={templates}
          setOpenModal={setIsUploadOpen}
          onSuccess={() => refetchRecords()}
        />
      )}
    </div>
  );
}

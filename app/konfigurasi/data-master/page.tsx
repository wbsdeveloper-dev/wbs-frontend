"use client";

import React, { useState } from "react";
import Card from "@/app/components/ui/Card";
import MasterGenericTab from "@/app/konfigurasi-bbm/data-master/components/MasterGenericTab";
import {
  Database,
  MapPin,
  Loader2
} from "lucide-react";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

type TabType = "region";

export default function KertasKerjaConfigGasPage() {
  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const { isLoading: isAuthLoading } = useAuth();
  
  const canRead = hasPrivilege("system_config", "READ");
  const [activeTab, setActiveTab] = useState<TabType>("region");

  const tabs = [
    { id: "region", label: "Region", icon: MapPin },
  ];

  // Redirect if unauthorized
  React.useEffect(() => {
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
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 animate-fade-in">
        <span>Dashboard</span>
        <span className="text-gray-400">/</span>
        <span>Konfigurasi Sistem</span>
        <span className="text-gray-400">/</span>
        <span className="text-primary font-medium">Data Master</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="text-primary" size={28} />
            Data Master
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Kelola data master untuk Kertas Kerja Gas
          </p>
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`
                    group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10
                    ${activeTab === tab.id ? "text-secondary border-b-2 border-secondary" : "text-gray-500 border-b-2 border-transparent hover:text-gray-700"}
                  `}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Icon
                        className={`h-5 w-5 ${activeTab === tab.id ? "text-secondary" : "text-gray-400 group-hover:text-gray-500"}`}
                      />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "region" && (
              <MasterGenericTab table="master_region" title="Region" comodityFilter="GAS PIPA,LNG" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Card from "@/app/components/ui/Card";
import MasterGenericTab from "./components/MasterGenericTab";
import TemplateTab from "./components/TemplateTab";
import CtmsMappingTab from "./components/CtmsMappingTab";
import {
  Database,
  Settings,
  Box,
  Truck,
  FileSpreadsheet,
  Factory,
  MapPin,
} from "lucide-react";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

type TabType =
  | "jenis_kit"
  | "unit_pembangkit"
  | "moda"
  | "product"
  | "region"
  | "unit"
  | "pola_operasi"
  | "ctms_mapping"
  | "template";

export default function KertasKerjaConfigPage() {
  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const { isLoading: isAuthLoading } = useAuth();
  const canRead = hasPrivilege("system_config", "READ");

  const [activeTab, setActiveTab] = useState<TabType>("jenis_kit");

  const tabs = [
    { id: "jenis_kit", label: "Jenis Kit", icon: Settings },
    { id: "unit_pembangkit", label: "Unit Pelaksana", icon: Factory },
    { id: "moda", label: "Moda", icon: Truck },
    { id: "product", label: "Product", icon: Box },
    { id: "region", label: "Region", icon: MapPin },
    { id: "unit", label: "Unit", icon: Factory },
    { id: "pola_operasi", label: "Pola Operasi", icon: Settings },
    { id: "ctms_mapping", label: "Mapping CTMS", icon: Database },
    { id: "template", label: "Template Kertas Kerja", icon: FileSpreadsheet },
  ];

  useEffect(() => {
    if (!isAuthLoading && !canRead) {
      router.push("/landingpage");
    }
  }, [isAuthLoading, canRead, router]);

  if (isAuthLoading || !canRead) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
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
            Kelola data master dan template untuk Kertas Kerja BBM
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
                    group relative min-w-max shrink-0 bg-white py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10
                    ${activeTab === tab.id ? "text-secondary border-b-2 border-secondary" : "text-gray-500 border-b-2 border-transparent hover:text-gray-700"}
                  `}
                  >
                    <span className="flex items-center justify-center gap-2 whitespace-nowrap">
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
            {activeTab === "jenis_kit" && (
              <MasterGenericTab table="master_jenis_kit" title="Jenis Kit" comodityFilter="BBM" />
            )}
            {activeTab === "unit_pembangkit" && (
              <MasterGenericTab
                table="master_unit_pelaksana"
                title="Unit Pelaksana"
                comodityFilter="BBM"
              />
            )}
            {activeTab === "moda" && (
              <MasterGenericTab table="master_moda" title="Moda" />
            )}
            {activeTab === "product" && (
              <MasterGenericTab table="master_product" title="Product" comodityFilter="BBM" />
            )}
            {activeTab === "region" && (
              <MasterGenericTab table="master_region" title="Region" comodityFilter="BBM" />
            )}
            {activeTab === "unit" && (
              <MasterGenericTab table="master_unit" title="Unit" comodityFilter="BBM" />
            )}
            {activeTab === "pola_operasi" && (
              <MasterGenericTab
                table="master_pola_operasi"
                title="Pola Operasi"
              />
            )}
            {activeTab === "ctms_mapping" && <CtmsMappingTab />}
            {activeTab === "template" && <TemplateTab />}
          </div>
        </Card>
      </div>
    </div>
  );
}

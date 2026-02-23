"use client";

import { useState } from "react";
import { Plus, MapPin, ArrowRightLeft, Map } from "lucide-react";
import {
  DaftarSiteTable,
  RelasiOperasionalTable,
} from "../../components/SiteTable";
import { AddSiteModal } from "./components/AddSiteModal";
import { AddRelationModal } from "./components/AddRelationModal";
import SiteMap from "./components/SiteMap";
import { useQueryClient } from "@tanstack/react-query";
import { siteKeys } from "@/hooks/service/site-api";

const tabs = [
  { label: "Daftar Site", icon: MapPin },
  { label: "Relasi Pemasok - Pembangkit", icon: ArrowRightLeft },
  { label: "Peta Lokasi", icon: Map },
];

export default function SitePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [addSiteModalOpen, setAddSiteModalOpen] = useState(false);
  const [addRelationModalOpen, setAddRelationModalOpen] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editingRelationId, setEditingRelationId] = useState<string | null>(
    null,
  );
  const queryClient = useQueryClient();

  const handleAddSiteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: siteKeys.all });
  };

  const handleAddRelationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: siteKeys.relations() });
  };

  const handleAddButtonClick = () => {
    if (activeTab === 0) {
      setAddSiteModalOpen(true);
      setEditingSiteId(null);
    } else if (activeTab === 1) {
      setAddRelationModalOpen(true);
      setEditingRelationId(null);
    }
  };

  const handleEditSite = (id: string) => {
    setEditingSiteId(id);
    setAddSiteModalOpen(true);
  };

  const handleEditRelation = (id: string) => {
    setEditingRelationId(id);
    setAddRelationModalOpen(true);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 animate-fadeIn">
        <span>Dashboard</span>
        <span className="text-gray-400">/</span>
        <span>Konfigurasi Sistem</span>
        <span className="text-gray-400">/</span>
        <span className="text-[#115d72] font-medium">Manajemen Site</span>
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8 animate-fadeIn">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Manajemen Site
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Kelola lokasi operasional beserta keterhubungan pembangkit, pemasok,
          dan transportir
        </p>
      </div>

      {/* Tab bar + Action buttons */}
      <div
        className="flex items-center justify-between border-b border-gray-200 mb-6 animate-fadeIn"
        style={{ animationDelay: "100ms" }}
      >
        <div className="flex">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-[#115d72]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#115d72] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 mb-2">
          <button
            onClick={handleAddButtonClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <Plus size={18} />
            {activeTab === 0
              ? "Tambah Site"
              : activeTab === 1
                ? "Tambah Relasi"
                : "Tambah Lokasi"}
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="animate-fadeIn" style={{ animationDelay: "200ms" }}>
        {activeTab === 0 && (
          <DaftarSiteTable
            onEdit={handleEditSite}
            onDelete={(id) => console.log("Delete site", id)}
          />
        )}

        {activeTab === 1 && (
          <RelasiOperasionalTable
            onEdit={handleEditRelation}
            onDelete={(id) => console.log("Delete relasi", id)}
          />
        )}

        {activeTab === 2 && <SiteMap />}
      </div>

      {/* Modals */}
      <AddSiteModal
        open={addSiteModalOpen}
        onClose={() => {
          setAddSiteModalOpen(false);
          setEditingSiteId(null);
        }}
        onSuccess={handleAddSiteSuccess}
        editingId={editingSiteId}
      />

      <AddRelationModal
        open={addRelationModalOpen}
        onClose={() => {
          setAddRelationModalOpen(false);
          setEditingRelationId(null);
        }}
        onSuccess={handleAddRelationSuccess}
        editingId={editingRelationId}
      />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

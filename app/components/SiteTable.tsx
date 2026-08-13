"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Pencil,
  Trash2,
  Search,
  Menu,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";
import {
  useSites,
  useRelations,
  useDeleteSite,
  useDeleteRelation,
  type Site,
  type SiteRelation,
  type DeleteSiteResponse,
  type DeleteRelationResponse,
} from "@/hooks/service/site-api";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useKertasKerjaMaster } from "@/hooks/service/kertas-kerja-api";
import FilterAutocomplete from "./FilterAutocomplete";

// Status badge component
const StatusBadge = ({
  status,
  isEnabled,
}: {
  status: string;
  isEnabled: boolean;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isEnabled ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${isEnabled ? "bg-green-500" : "bg-red-500"
        }`}
    />
    {isEnabled ? "Aktif" : "Nonaktif"}
  </span>
);

// Site type badge component
const SiteTypeBadge = ({
  siteType,
  commodity,
}: {
  siteType: string;
  commodity?: string | null;
}) => {
  const comm = (commodity || "").toUpperCase();
  let label = siteType === "PEMBANGKIT" ? "Pembangkit" : siteType === "PEMASOK" ? "Pemasok" : "Transportir";
  let bg = "bg-gray-100 text-gray-700 border-gray-200";
  let dotColor = "bg-gray-400";

  if (siteType === "PEMBANGKIT") {
    if (comm.includes("GAS") || comm.includes("PIPA")) {
      bg = "bg-[#13778e]/10 text-[#13778e] border-[#13778e]/30 font-semibold";
      dotColor = "bg-[#13778e]";
      label = "Pembangkit (Gas Pipa)";
    } else if (comm.includes("LNG")) {
      bg = "bg-[#1581fb]/10 text-[#1581fb] border-[#1581fb]/30 font-semibold";
      dotColor = "bg-[#1581fb]";
      label = "Pembangkit (LNG)";
    } else if (comm.includes("BBM")) {
      bg = "bg-lime-50 text-lime-800 border-lime-200 font-semibold";
      dotColor = "bg-lime-500";
      label = "Pembangkit (BBM)";
    }
  } else if (siteType === "PEMASOK") {
    if (comm.includes("GAS") || comm.includes("PIPA")) {
      bg = "bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold";
      dotColor = "bg-cyan-500";
      label = "Pemasok (Gas Pipa)";
    } else if (comm.includes("LNG")) {
      bg = "bg-blue-50 text-blue-800 border-blue-200 font-semibold";
      dotColor = "bg-blue-500";
      label = "Pemasok (LNG)";
    } else if (comm.includes("BBM")) {
      bg = "bg-sky-50 text-sky-800 border-sky-200 font-semibold";
      dotColor = "bg-sky-500";
      label = "Pemasok (BBM)";
    }
  } else if (siteType === "TRANSPORTIR") {
    bg = "bg-amber-50 text-amber-800 border-amber-200 font-semibold";
    dotColor = "bg-amber-500";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};

// Action buttons component
const ActionButtons = ({
  id,
  onEdit,
  onDelete,
}: {
  id: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const { hasPrivilege } = usePrivilege();
  const canUpdate = hasPrivilege("site_management", "UPDATE");
  const canDelete = hasPrivilege("site_management", "DELETE");

  return (
    <div className="flex items-center justify-center gap-1">
      {canUpdate && (
        <button
          onClick={() => onEdit(id)}
          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
          title="Edit"
        >
          <Pencil size={16} />
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => onDelete(id)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Hapus"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  itemName,
}: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <Trash2 className="w-6 h-6 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Konfirmasi Hapus
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            Apakah Anda yakin ingin menghapus{" "}
            <span className="font-semibold text-gray-900">{itemName}</span>?
          </p>
          <p className="text-sm text-gray-600">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 hover:shadow-md active:scale-95"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Delete Warning Modal
interface DeleteWarningModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  warnedSites?: string[];
}

function DeleteWarningModal({
  open,
  onClose,
  onConfirm,
  warnedSites,
}: DeleteWarningModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Peringatan: Entitas Terkait
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Entitas ini direferensikan oleh objek lain dalam sistem.
            </p>
          </div>

          <p className="text-sm text-gray-700 mb-3">
            Objek berikut mereferensikan entitas yang akan dihapus:
          </p>

          {warnedSites && warnedSites.length > 0 && (
            <ul className="mb-4 space-y-2">
              {warnedSites.map((site, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  {site}
                </li>
              ))}
            </ul>
          )}

          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Menghapus entitas ini dapat menyebabkan masalah pada data yang
              terkait. Apakah Anda yakin ingin melanjutkan?
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 hover:shadow-md active:scale-95"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Site Table Component
interface SiteTableProps {
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  commodity?: string[];
}

export function DaftarSiteTable({
  onEdit,
  onDelete,
  commodity,
}: SiteTableProps) {
  const { hasPrivilege } = usePrivilege();
  const canUpdate = hasPrivilege("site_management", "UPDATE");
  const canDelete = hasPrivilege("site_management", "DELETE");
  const hasAction = canUpdate || canDelete;

  const isBbm = commodity?.includes("BBM");
  const isGasPipa = commodity?.includes("GAS PIPA") || commodity?.includes("LNG");
  
  const regionCommodityFilter = isBbm ? "BBM" : isGasPipa ? "GAS PIPA" : undefined;

  const { data: rawRegions = [] } = useKertasKerjaMaster(
    "master_region",
    regionCommodityFilter
  );

  const regions = regionCommodityFilter
    ? rawRegions.filter((r: any) => !r.comodity || r.comodity === regionCommodityFilter || (regionCommodityFilter === "GAS PIPA" && r.comodity === "LNG"))
    : rawRegions;

  const [showFilters, setShowFilters] = useState(false);

  // Applied filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  // Local filters (for the panel)
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [localCommodity, setLocalCommodity] = useState<string>("");
  const [localType, setLocalType] = useState<string>("");
  const [localRegion, setLocalRegion] = useState<string>("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");
  const [warnedSites, setWarnedSites] = useState<string[]>([]);

  const activeFilterCount = [
    searchTerm,
    selectedCommodity,
    selectedType,
    selectedRegion,
  ].filter(Boolean).length;

  const handleApplyFilters = () => {
    setSearchTerm(localSearchTerm);
    setSelectedCommodity(localCommodity);
    setSelectedType(localType);
    setSelectedRegion(localRegion);
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    setLocalSearchTerm("");
    setLocalCommodity("");
    setLocalType("");
    setLocalRegion("");

    setSearchTerm("");
    setSelectedCommodity("");
    setSelectedType("");
    setSelectedRegion("");
    setCurrentPage(0);
  };

  const effectiveCommodity = selectedCommodity ? selectedCommodity : commodity;

  const { data: sites, isLoading } = useSites({
    search: debouncedSearch,
    commodity: effectiveCommodity,
    type: selectedType || undefined,
    region: selectedRegion || undefined,
  });
  const deleteSiteMutation = useDeleteSite({
    onSuccess: (data: DeleteSiteResponse) => {
      // Note: broad siteKeys.all invalidation is handled by useDeleteSite hook itself
      if (data.warned_sites && data.warned_sites.length > 0) {
        setWarnedSites(data.warned_sites);
        setDeleteWarningOpen(true);
        setDeleteConfirmOpen(false);
      } else {
        setDeleteConfirmOpen(false);
        setDeleteWarningOpen(false);
        setWarnedSites([]);
        setPendingDeleteId(null);
        setPendingDeleteName("");
      }
    },
    onError: () => {
      setDeleteConfirmOpen(false);
      setDeleteWarningOpen(false);
      setPendingDeleteId(null);
      setPendingDeleteName("");
    },
  });

  // Debounced search effect (2-second delay for performance optimization)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDeleteClick = (id: string, name: string) => {
    setPendingDeleteId(id);
    setPendingDeleteName(name);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      deleteSiteMutation.mutate(pendingDeleteId);
    }
  };

  const handleForceDelete = () => {
    if (pendingDeleteId) {
      // If your API supports force delete, pass a force parameter
      // deleteSiteMutation.mutate({ id: pendingDeleteId, force: true });
      deleteSiteMutation.mutate(pendingDeleteId);
    }
    setDeleteWarningOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName("");
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeleteWarningOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName("");
    setWarnedSites([]);
  };

  const handleEdit = (id: string) => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const commodityOptions =
    commodity && commodity.length > 0 ? commodity : ["GAS PIPA", "LNG", "BBM"];

  // Pagination logic
  const totalPages = Math.ceil((sites?.length || 0) / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSites = sites?.slice(startIndex, endIndex) || [];

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <Menu size={20} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {isBbm ? "Tabel Daftar TBBM & Pembangkit" : "Tabel Daftar Pemasok & Pembangkit"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${showFilters || activeFilterCount > 0
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
            >
              <Filter size={16} />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1 flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Pencarian filter */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Pencarian
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    placeholder={isBbm ? "Nama TBBM / pembangkit" : "Nama pemasok / pembangkit"}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Tipe filter */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Jenis
                </label>
                <select
                  value={localType}
                  onChange={(e) => setLocalType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Semua Jenis</option>
                  <option value="PEMBANGKIT">Pembangkit</option>
                  <option value="PEMASOK">Pemasok</option>
                  <option value="TRANSPORTIR">Transportir</option>
                </select>
              </div>

              {/* Region filter */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Region
                </label>
                <select
                  value={localRegion}
                  onChange={(e) => setLocalRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Semua Region</option>
                  {regions.map((region: any) => (
                    <option key={region.id} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Komoditas filter */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Komoditas
                </label>
                <select
                  value={localCommodity}
                  onChange={(e) => setLocalCommodity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Semua Komoditas</option>
                  {commodityOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "GAS PIPA" ? "Gas Pipa" : opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter actions */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <X size={14} />
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
              >
                <Search size={14} />
                Terapkan Filter
              </button>
            </div>
          </div>
        )}

        {/* Active filter tags */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 flex-wrap bg-white">
            <span className="text-xs text-gray-500 font-medium">
              Filter aktif:
            </span>
            {searchTerm && (
              <FilterTag
                label={`Pencarian: ${searchTerm}`}
                onRemove={() => {
                  setLocalSearchTerm("");
                  setSearchTerm("");
                  setCurrentPage(0);
                }}
              />
            )}
            {selectedType && (
              <FilterTag
                label={`Jenis: ${selectedType === "PEMBANGKIT" ? "Pembangkit" : selectedType === "PEMASOK" ? "Pemasok" : "Transportir"}`}
                onRemove={() => {
                  setLocalType("");
                  setSelectedType("");
                  setCurrentPage(0);
                }}
              />
            )}
            {selectedCommodity && (
              <FilterTag
                label={`Komoditas: ${selectedCommodity}`}
                onRemove={() => {
                  setLocalCommodity("");
                  setSelectedCommodity("");
                  setCurrentPage(0);
                }}
              />
            )}
            {selectedRegion && (
              <FilterTag
                label={`Lokasi: ${selectedRegion}`}
                onRemove={() => {
                  setLocalRegion("");
                  setSelectedRegion("");
                  setCurrentPage(0);
                }}
              />
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium ml-1 transition-colors"
            >
              Hapus Semua
            </button>
          </div>
        )}

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {isBbm ? "Nama TBBM / Pembangkit" : "Nama Pemasok / Pembangkit"}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Region
                </th>
                {commodity?.includes("BBM") && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kapasitas (kL)
                  </th>
                )}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Kapasitas (MW)
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Komoditas
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                {hasAction && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={commodity?.includes("BBM") ? 8 : 7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedSites.length === 0 ? (
                <tr>
                  <td
                    colSpan={commodity?.includes("BBM") ? 8 : 7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "Tidak ada hasil pencarian"
                      : "Tidak ada data site"}
                  </td>
                </tr>
              ) : (
                paginatedSites.map((site) => (
                  <tr
                    key={site.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900">{site.name}</td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {site.site_type === "PEMBANGKIT"
                        ? "Pembangkit"
                        : site.site_type === "PEMASOK"
                          ? "Pemasok"
                          : "Transportir"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {site.region}
                    </td>
                    {commodity?.includes("BBM") && (
                      <td className="px-4 py-3 text-center text-gray-700">
                        {site.capacity ? `${site.capacity} kL` : "-"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center text-gray-700">
                      {site.capacity_mw ? `${site.capacity_mw} MW` : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {site.commodity || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={site.site_type}
                        isEnabled={site.is_enabled}
                      />
                    </td>
                    {hasAction && (
                      <td className="px-4 py-3 text-center">
                        <ActionButtons
                          id={site.id}
                          onEdit={handleEdit}
                          onDelete={() => handleDeleteClick(site.id, site.name)}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
            {/* Left: info + page size */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">
                Menampilkan{" "}
                {(sites?.length || 0) > 0 ? (
                  <>
                    {startIndex + 1}-{Math.min(endIndex, sites?.length || 0)} dari{" "}
                    {sites?.length || 0}
                  </>
                ) : (
                  "0"
                )}{" "}
                data
              </span>
              <div className="flex items-center gap-1.5">
                <label htmlFor="page-size-site" className="text-sm text-gray-500">
                  Baris:
                </label>
                <select
                  id="page-size-site"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all duration-200"
                >
                  {[5, 10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right: page buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {(() => {
                  const pages: (number | "...")[] = [];
                  const displayPage = currentPage + 1; // 1-indexed for display
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (displayPage > 3) pages.push("...");
                    const start = Math.max(2, displayPage - 1);
                    const end = Math.min(totalPages - 1, displayPage + 1);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (displayPage < totalPages - 2) pages.push("...");
                    pages.push(totalPages);
                  }
                  return pages.map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 text-sm text-gray-400 select-none"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage((p as number) - 1)}
                        className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                          p === displayPage
                            ? "bg-primary text-white shadow-sm"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  );
                })()}

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={currentPage === totalPages - 1}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={pendingDeleteName}
      />

      <DeleteWarningModal
        open={deleteWarningOpen}
        onClose={handleCancelDelete}
        onConfirm={handleForceDelete}
        warnedSites={warnedSites}
      />
    </>
  );
}

// Relations Table Component
export function RelasiOperasionalTable({
  onEdit,
  onDelete,
  commodity,
}: SiteTableProps) {
  const { hasPrivilege } = usePrivilege();
  const canUpdate = hasPrivilege("site_management", "UPDATE");
  const canDelete = hasPrivilege("site_management", "DELETE");
  const hasAction = canUpdate || canDelete;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");
  const [warnedSites, setWarnedSites] = useState<string[]>([]);

  const { data: relations, isLoading } = useRelations(true);
  const deleteRelationMutation = useDeleteRelation({
    onSuccess: (data: DeleteRelationResponse) => {
      // Note: broad invalidation is handled by useDeleteRelation hook itself
      if (data.warned_sites && data.warned_sites.length > 0) {
        setWarnedSites(data.warned_sites);
        setDeleteWarningOpen(true);
        setDeleteConfirmOpen(false);
      } else {
        setDeleteConfirmOpen(false);
        setDeleteWarningOpen(false);
        setWarnedSites([]);
        setPendingDeleteId(null);
        setPendingDeleteName("");
      }
    },
    onError: () => {
      setDeleteConfirmOpen(false);
      setDeleteWarningOpen(false);
      setPendingDeleteId(null);
      setPendingDeleteName("");
    },
  });

  // Debounced search effect (2-second delay for performance optimization)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const effectiveCommodities = selectedCommodity
    ? [selectedCommodity]
    : commodity && commodity.length > 0
      ? commodity
      : [];

  // Filter relations based on search term & commodity
  const filteredRelations =
    relations?.filter((relation) => {
      if (effectiveCommodities.length > 0) {
        if (!effectiveCommodities.includes(relation.commodity)) {
          return false;
        }
      }
      if (!debouncedSearch) return true;
      const searchLower = debouncedSearch.toLowerCase();
      return (
        relation.source_site_name?.toLowerCase().includes(searchLower) ||
        relation.target_site_name?.toLowerCase().includes(searchLower) ||
        relation.relation_type?.toLowerCase().includes(searchLower) ||
        relation.commodity?.toLowerCase().includes(searchLower)
      );
    }) || [];

  const handleDeleteClick = (id: string, name: string) => {
    setPendingDeleteId(id);
    setPendingDeleteName(name);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      deleteRelationMutation.mutate(pendingDeleteId);
    }
  };

  const handleForceDelete = () => {
    if (pendingDeleteId) {
      // If your API supports force delete, pass a force parameter
      // deleteRelationMutation.mutate({ id: pendingDeleteId, force: true });
      deleteRelationMutation.mutate(pendingDeleteId);
    }
    setDeleteWarningOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName("");
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeleteWarningOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName("");
    setWarnedSites([]);
  };

  const handleEdit = (id: string) => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const commodityOptions =
    commodity && commodity.length > 0 ? commodity : ["GAS PIPA", "LNG", "BBM"];

  // Pagination logic
  const totalPages = Math.ceil((filteredRelations?.length || 0) / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRelations =
    filteredRelations?.slice(startIndex, endIndex) || [];

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <Menu size={20} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Tabel Daftar Relasi
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-52">
              <FilterAutocomplete
                label=""
                options={["Semua Komoditas", ...commodityOptions]}
                value={selectedCommodity || "Semua Komoditas"}
                onChange={(val) => {
                  const valStr = typeof val === "string" ? val : val || "";
                  setSelectedCommodity(
                    valStr === "Semua Komoditas" ? "" : valStr,
                  );
                  setCurrentPage(0);
                }}
                placeholder="Pilih Komoditas"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari relasi..."
                className="w-48 md:w-56 pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sumber
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jenis Relasi
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tujuan
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Komoditas
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                {hasAction && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedRelations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {debouncedSearch
                      ? "Tidak ada hasil pencarian"
                      : "Tidak ada data relasi"}
                  </td>
                </tr>
              ) : (
                paginatedRelations.map((relation) => (
                  <tr
                    key={relation.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900">
                      {relation.source_site_name}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {relation.relation_type}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {relation.target_site_name}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {relation.commodity}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={relation.relation_type}
                        isEnabled={relation.status === "ACTIVE"}
                      />
                    </td>
                    {hasAction && (
                      <td className="px-4 py-3 text-center">
                        <ActionButtons
                          id={relation.id}
                          onEdit={handleEdit}
                          onDelete={() =>
                            handleDeleteClick(
                              relation.id,
                              relation.source_site_name,
                            )
                          }
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
            {/* Left: info + page size */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">
                Menampilkan{" "}
                {(filteredRelations?.length || 0) > 0 ? (
                  <>
                    {startIndex + 1}-{Math.min(endIndex, filteredRelations?.length || 0)} dari{" "}
                    {filteredRelations?.length || 0}
                  </>
                ) : (
                  "0"
                )}{" "}
                data
              </span>
              <div className="flex items-center gap-1.5">
                <label htmlFor="page-size-rel" className="text-sm text-gray-500">
                  Baris:
                </label>
                <select
                  id="page-size-rel"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all duration-200"
                >
                  {[5, 10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right: page buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {(() => {
                  const pages: (number | "...")[] = [];
                  const displayPage = currentPage + 1; // 1-indexed for display
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (displayPage > 3) pages.push("...");
                    const start = Math.max(2, displayPage - 1);
                    const end = Math.min(totalPages - 1, displayPage + 1);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (displayPage < totalPages - 2) pages.push("...");
                    pages.push(totalPages);
                  }
                  return pages.map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 text-sm text-gray-400 select-none"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage((p as number) - 1)}
                        className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                          p === displayPage
                            ? "bg-primary text-white shadow-sm"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  );
                })()}

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={currentPage === totalPages - 1}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={pendingDeleteName}
      />

      <DeleteWarningModal
        open={deleteWarningOpen}
        onClose={handleCancelDelete}
        onConfirm={handleForceDelete}
        warnedSites={warnedSites}
      />
    </>
  );
}

// Default export for backward compatibility
export default function SiteTable() {
  return (
    <div className="space-y-6">
      <DaftarSiteTable />
      <RelasiOperasionalTable />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Tag component
// ---------------------------------------------------------------------------

function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
      >
        <X size={12} />
      </button>
    </span>
  );
}

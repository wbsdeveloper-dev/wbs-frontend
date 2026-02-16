"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Search,
  Menu,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSites,
  useRelations,
  useDeleteSite,
  useDeleteRelation,
  siteKeys,
  type Site,
  type SiteRelation,
  type DeleteSiteResponse,
  type DeleteRelationResponse,
} from "@/hooks/service/site-api";

// Status badge component
const StatusBadge = ({
  status,
  isEnabled,
}: {
  status: string;
  isEnabled: boolean;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isEnabled ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${
        isEnabled ? "bg-green-500" : "bg-red-500"
      }`}
    />
    {isEnabled ? "Aktif" : "Nonaktif"}
  </span>
);

// Action buttons component
const ActionButtons = ({
  id,
  onEdit,
  onDelete,
}: {
  id: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) => (
  <div className="flex items-center justify-center gap-1">
    <button
      onClick={() => onEdit(id)}
      className="p-1.5 text-[#115d72] hover:bg-[#115d72]/10 rounded-lg transition-colors"
      title="Edit"
    >
      <Pencil size={16} />
    </button>
    <button
      onClick={() => onDelete(id)}
      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      title="Hapus"
    >
      <Trash2 size={16} />
    </button>
  </div>
);

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
  if (!open) return null;

  return (
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
    </div>
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
  if (!open) return null;

  return (
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
    </div>
  );
}

// Site Table Component
interface SiteTableProps {
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DaftarSiteTable({ onEdit, onDelete }: SiteTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");
  const [warnedSites, setWarnedSites] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: sites, isLoading } = useSites({ search: debouncedSearch });
  const deleteSiteMutation = useDeleteSite({
    onSuccess: (data: DeleteSiteResponse) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: siteKeys.sites() });
      queryClient.invalidateQueries({ queryKey: siteKeys.dropdowns() });
      
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

  // Pagination logic
  const totalPages = Math.ceil((sites?.length || 0) / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSites = sites?.slice(startIndex, endIndex) || [];

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <Menu size={20} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Tabel Daftar Site
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari site..."
              className="w-48 md:w-56 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nama Site
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jenis Site
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Lokasi
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedSites.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
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
                        : "Pemasok"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {site.region}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={site.site_type}
                        isEnabled={site.is_enabled}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ActionButtons
                        id={site.id}
                        onEdit={handleEdit}
                        onDelete={() => handleDeleteClick(site.id, site.name)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Menampilkan {startIndex + 1}-
              {Math.min(endIndex, sites?.length || 0)} dari {sites?.length || 0}{" "}
              data
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-700">
                Halaman {currentPage + 1} dari {totalPages}
              </span>
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
export function RelasiOperasionalTable({ onEdit, onDelete }: SiteTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");
  const [warnedSites, setWarnedSites] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: relations, isLoading } = useRelations(true);
  const deleteRelationMutation = useDeleteRelation({
    onSuccess: (data: DeleteRelationResponse) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: siteKeys.relations() });
      
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

  // Filter relations based on search term
  const filteredRelations =
    relations?.filter((relation) => {
      if (!debouncedSearch) return true;
      const searchLower = debouncedSearch.toLowerCase();
      return (
        relation.source_site_name.toLowerCase().includes(searchLower) ||
        relation.target_site_name.toLowerCase().includes(searchLower) ||
        relation.relation_type.toLowerCase().includes(searchLower) ||
        relation.commodity.toLowerCase().includes(searchLower)
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <Menu size={20} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Tabel Daftar Relasi
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari relasi..."
              className="w-48 md:w-56 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Site Sumber
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jenis Relasi
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Site Tujuan
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Komoditas
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aksi
                </th>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Menampilkan {startIndex + 1}-
              {Math.min(endIndex, filteredRelations?.length || 0)} dari{" "}
              {filteredRelations?.length || 0} data
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-700">
                Halaman {currentPage + 1} dari {totalPages}
              </span>
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
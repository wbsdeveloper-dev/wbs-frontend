"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  KeyRound,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { type User, useDeleteUser } from "@/hooks/service/user-api";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UserTableProps {
  records: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  isLoading: boolean;
  onPageChange: (page: number, limit: number) => void;
  onFilterChange: (filters: { search?: string; status?: string }) => void;
  filters: { search?: string; status?: string };
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isDeleting: boolean;
}

function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  itemName,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <Trash2 className="w-6 h-6 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            Apakah Anda yakin ingin menghapus pengguna{" "}
            <span className="font-semibold text-gray-900">{itemName}</span>?
          </p>
          <p className="text-sm text-gray-600">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const StatusBadge = ({ status }: { status: string }) => {
  const isOk = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isOk ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isOk ? "bg-green-500" : "bg-gray-400"}`} />
      {status === "ACTIVE" ? "Aktif" : "Non-aktif"}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserTable({
  records,
  meta,
  isLoading,
  onPageChange,
  onFilterChange,
  filters,
  onEdit,
  onResetPassword,
}: UserTableProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const [localStatus, setLocalStatus] = useState(filters.status || "");

  const activeFilterCount = [filters.search, filters.status].filter(Boolean).length;

  const handleApplyFilters = () => {
    onFilterChange({
      search: localSearch || undefined,
      status: localStatus || undefined,
    });
    // Reset to page 1
    onPageChange(1, meta.limit);
  };

  const handleResetFilters = () => {
    setLocalSearch("");
    setLocalStatus("");
    onFilterChange({ search: undefined, status: undefined });
    onPageChange(1, meta.limit);
  };

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState("");
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useDeleteUser();

  const handleDeleteClick = (user: User) => {
    setPendingDeleteId(user.id);
    setPendingDeleteName(user.email);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      setDeleteError(null);
      deleteMutation
        .mutateAsync(pendingDeleteId)
        .then(() => {
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
          setPendingDeleteName("");
          setShowDeleteSuccess(true);
          setTimeout(() => setShowDeleteSuccess(false), 3000);
        })
        .catch((err) => {
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
          setPendingDeleteName("");
          setDeleteError(err?.message || "Gagal menghapus pengguna");
          setTimeout(() => setDeleteError(null), 5000);
        });
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <>
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={pendingDeleteName}
        isDeleting={deleteMutation.isPending}
      />

      {showDeleteSuccess && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
          <CheckCircle2 size={18} />
          Pengguna berhasil dihapus
        </div>
      )}

      {deleteError && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
          <AlertCircle size={18} />
          {deleteError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header / Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-10 relative">
          <div className="flex items-center gap-1.5">
            <Menu size={20} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Daftar Pengguna</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                showFilters || activeFilterCount > 0
                  ? "bg-[#115d72] text-white border-[#115d72]"
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
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Search filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Cari Pengguna
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Nama atau email..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] transition-all"
                  />
                </div>
              </div>

              {/* Status filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] transition-all bg-white"
                >
                  <option value="">Semua Status</option>
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Non-aktif</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <X size={14} />
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all hover:shadow-md active:scale-95"
              >
                <Search size={14} />
                Terapkan Filter
              </button>
            </div>
          </div>
        )}

        {/* Table Body */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nama Lengkap
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hak Akses (Roles)
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Terakhir Login
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
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-[#14a2bb]" size={20} />
                      <span>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                    Tidak ada pengguna yang ditemukan
                  </td>
                </tr>
              ) : (
                records.map((user, index) => {
                  const globalIndex = (meta.page - 1) * meta.limit + index + 1;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-700">{globalIndex}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {user.fullName || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <span
                              key={role}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded border border-blue-200"
                            >
                              {role}
                            </span>
                          ))}
                          {(!user.roles || user.roles.length === 0) && (
                            <span className="text-gray-400 italic text-xs">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onResetPassword(user)}
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound size={16} />
                          </button>
                          <button
                            onClick={() => onEdit(user)}
                            className="p-1.5 text-[#115d72] hover:bg-[#115d72]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
            <span className="text-sm text-gray-600">
              Menampilkan {records.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0} -{" "}
              {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} data
            </span>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <label className="text-sm text-gray-500">Baris:</label>
                <select
                  value={meta.limit}
                  onChange={(e) => onPageChange(1, Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onPageChange(meta.page - 1, meta.limit)}
                    disabled={meta.page <= 1}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium px-2 text-gray-700">
                    {meta.page} / {totalPages}
                  </span>
                  <button
                    onClick={() => onPageChange(meta.page + 1, meta.limit)}
                    disabled={meta.page >= totalPages}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

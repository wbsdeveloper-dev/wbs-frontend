"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRoles, useDeleteRole, type Role } from "@/hooks/service/user-api";
import { Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import { RolePrivilegeModal } from "./RolePrivilegeModal";
import { usePrivilege } from "@/hooks/usePrivilege";

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <Trash2 className="w-6 h-6 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Konfirmasi Hapus
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            Apakah Anda yakin ingin menghapus peran{" "}
            <span className="font-semibold text-gray-900">{itemName}</span>?
          </p>
          <p className="text-sm text-gray-600">
            Tindakan ini tidak dapat dibatalkan.
          </p>
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
    </div>,
    document.body
  );
}

export function RoleTable() {
  const { data: roles, isLoading } = useRoles();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { hasPrivilege } = usePrivilege();
  const canUpdate = hasPrivilege("users", "UPDATE");
  const canDelete = hasPrivilege("users", "DELETE");
  const hasAction = canUpdate || canDelete;

  const handleEditPrivileges = (role: Role) => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState("");
  const deleteMutation = useDeleteRole();

  const handleDeleteClick = (role: Role) => {
    setPendingDeleteId(role.id);
    setPendingDeleteName(role.name);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      deleteMutation
        .mutateAsync(pendingDeleteId)
        .then(() => {
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
          setPendingDeleteName("");
        })
        .catch((err) => {
          setDeleteModalOpen(false);
          setPendingDeleteId(null);
          setPendingDeleteName("");
          alert(err?.message || "Gagal menghapus peran");
        });
    }
  };

  return (
    <>
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={pendingDeleteName}
        isDeleting={deleteMutation.isPending}
      />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[300px]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-10 relative">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-700">
              Daftar Peran (Roles)
            </span>
          </div>
          <div className="flex items-center gap-2">
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nama Peran
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Deskripsi
                </th>
                {hasAction && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-16 text-center text-gray-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2
                        className="animate-spin text-secondary"
                        size={20}
                      />
                      <span>Memuat data peran...</span>
                    </div>
                  </td>
                </tr>
              ) : !roles || roles.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-16 text-center text-gray-500"
                  >
                    Tidak ada peran yang ditemukan
                  </td>
                </tr>
              ) : (
                roles.map((role, index) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-gray-700">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {role.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {role.description}
                    </td>
                    {hasAction && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canUpdate && (
                            <button
                              onClick={() => handleEditPrivileges(role)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Atur Hak Akses"
                            >
                              <Settings2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteClick(role)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RolePrivilegeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        role={selectedRole}
      />
    </>
  );
}

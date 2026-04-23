"use client";

import { useState } from "react";
import { useRoles, type Role } from "@/hooks/service/user-api";
import { Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import { RolePrivilegeModal } from "./RolePrivilegeModal";

export function RoleTable() {
  const { data: roles, isLoading } = useRoles();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleEditPrivileges = (role: Role) => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[300px]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-10 relative">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-700">
              Daftar Peran (Roles)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all"
            >
              <Plus size={16} />
              Tambah Peran
            </button> */}
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
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                  Aksi
                </th>
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
                        className="animate-spin text-[#14a2bb]"
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
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditPrivileges(role)}
                          className="p-1.5 text-[#115d72] hover:bg-[#115d72]/10 rounded-lg transition-colors"
                          title="Atur Hak Akses"
                        >
                          <Settings2 size={16} />
                        </button>
                        <button
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
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

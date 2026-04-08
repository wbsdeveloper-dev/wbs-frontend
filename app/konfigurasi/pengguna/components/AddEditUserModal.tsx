"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import {
  useCreateUser,
  useUpdateUser,
  useRoles,
  useDeleteRole,
  type User,
} from "@/hooks/service/user-api";
import { AddRoleModal } from "./AddRoleModal";

interface AddEditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser: User | null;
}

export function AddEditUserModal({
  open,
  onClose,
  onSuccess,
  editingUser,
}: AddEditUserModalProps) {
  const isEdit = !!editingUser;

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);

  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteRoleMutation = useDeleteRole();

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteRoleMutation.isPending;

  const handleDeleteRole = async (e: React.MouseEvent, roleId: string, roleName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Apakah Anda yakin ingin menghapus role "${roleName}"?\nTindakan ini tidak dapat dibatalkan.`)) {
      try {
        await deleteRoleMutation.mutateAsync(roleId);
        // Clean up from selectedRoles if it was selected
        setSelectedRoles((prev) => prev.filter((r) => r !== roleName));
      } catch (err: any) {
        setError(err?.message || "Gagal menghapus role");
      }
    }
  };

  useEffect(() => {
    if (open) {
      if (editingUser) {
        setEmail(editingUser.email);
        setFullName(editingUser.fullName);
        setStatus(editingUser.status);
        setSelectedRoles(editingUser.roles);
        setPassword(""); // Password not edited here
      } else {
        setEmail("");
        setFullName("");
        setStatus("ACTIVE");
        setSelectedRoles([]);
        setPassword("");
      }
      setError(null);
    }
  }, [open, editingUser]);

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const validatePassword = (pwd: string) => {
    if (pwd.length < 12) return "Password minimal 12 karakter";
    if (!/[A-Z]/.test(pwd)) return "Password harus memiliki huruf kapital";
    if (!/[0-9]/.test(pwd)) return "Password harus memiliki angka (numerik)";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd))
      return "Password harus memiliki simbol";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !fullName) {
      setError("Email dan Nama Lengkap wajib diisi");
      return;
    }

    if (!isEdit) {
      const pwdError = validatePassword(password);
      if (pwdError) {
        setError(pwdError);
        return;
      }
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          payload: {
            email,
            fullName,
            status,
            roles: selectedRoles,
          },
        });
      } else {
        await createMutation.mutateAsync({
          email,
          fullName,
          password,
          status,
          roles: selectedRoles,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat menyimpan data");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? "Edit Pengguna" : "Tambah Pengguna Baru"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alamat Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
                placeholder="email@example.com"
              />
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
                    placeholder="Minimal 12 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Wajib 12 karakter, huruf kapital, angka, dan simbol.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all appearance-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Hak Akses (Roles)
                </label>
                <button
                  type="button"
                  onClick={() => setAddRoleModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#115d72] bg-[#115d72]/10 hover:bg-[#115d72]/20 rounded-lg transition-colors border border-transparent hover:border-[#115d72]/30"
                >
                  <Plus size={14} />
                  Tambah Role
                </button>
              </div>
              {rolesLoading ? (
                <div className="text-sm text-gray-500 italic">Memuat roles...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                  {rolesData?.map((role) => (
                    <label
                      key={role.id}
                      className="group flex items-start p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors relative pr-8"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.name)}
                        onChange={() => toggleRole(role.name)}
                        className="mt-0.5 rounded text-[#115d72] focus:ring-[#115d72]/20 mr-2.5"
                      />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium text-gray-900 leading-none">
                          {role.name}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          {role.description}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRole(e, role.id, role.name)}
                        className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        title="Hapus Hak Akses"
                      >
                        <Trash2 size={14} />
                      </button>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
            disabled={isSaving}
          >
            Batal
          </button>
          <button
            type="submit"
            form="user-form"
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#115d72] to-[#14a2bb] rounded-xl hover:shadow-lg hover:shadow-[#115d72]/20 active:scale-95 transition-all flex items-center justify-center min-w-[120px]"
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={16} className="mr-2" />
                {isEdit ? "Simpan Perbaikan" : "Simpan Pengguna"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Role Modal Layered Above */}
      <AddRoleModal
        open={addRoleModalOpen}
        onClose={() => setAddRoleModalOpen(false)}
        onSuccess={() => {
          // Roles are invalidated via useCreateRole
        }}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { useCreateRole } from "@/hooks/service/user-api";

interface AddRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRoleModal({ open, onClose, onSuccess }: AddRoleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateRole();
  const isSaving = createMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !description) {
      setError("Nama hak akses dan deskripsi wajib diisi");
      return;
    }

    try {
      await createMutation.mutateAsync({ name: name.toUpperCase(), description });
      onSuccess();
      onClose();
      // Reset form
      setName("");
      setDescription("");
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat menyimpan data");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Tambah Hak Akses</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form id="add-role-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all uppercase"
                placeholder="Contoh: SUPER_ADMIN"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Deskripsi <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/20 focus:border-[#14a2bb] transition-all"
                placeholder="Penjelasan hak akses..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
            disabled={isSaving}
          >
            Batal
          </button>
          <button
            type="submit"
            form="add-role-form"
            className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#115d72] to-[#14a2bb] rounded-xl hover:shadow-lg hover:shadow-[#115d72]/20 active:scale-95 transition-all flex items-center justify-center min-w-[100px]"
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Simpan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, Save, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useUpdateUser, type User } from "@/hooks/service/user-api";

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

export function ResetPasswordModal({
  open,
  onClose,
  onSuccess,
  user,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateUser();
  const isSaving = updateMutation.isPending;

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

    if (!user) return;

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    try {
      // Patching only the password
      await updateMutation.mutateAsync({
        id: user.id,
        payload: {
          password,
        },
      });
      onSuccess();
      onClose();
      setPassword(""); // clear on success
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat menyimpan data");
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
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
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-6">
            Ubah password untuk pengguna{" "}
            <span className="font-semibold text-gray-900">{user.email}</span>
          </p>

          <form id="reset-pwd-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password Baru <span className="text-red-500">*</span>
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
                Wajib minimal 12 karakter, huruf kapital, angka, dan simbol.
              </p>
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
            form="reset-pwd-form"
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-xl hover:shadow-lg hover:shadow-[#115d72]/20 active:scale-95 transition-all flex items-center justify-center min-w-[120px]"
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

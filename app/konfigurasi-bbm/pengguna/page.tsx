"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Shield } from "lucide-react";
import { useUsers, type User } from "@/hooks/service/user-api";
import { UserTable } from "./components/UserTable";
import { AddEditUserModal } from "./components/AddEditUserModal";
import { ResetPasswordModal } from "./components/ResetPasswordModal";
import { RoleTable } from "./components/RoleTable";
import { AddRoleModal } from "./components/AddRoleModal";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PenggunaPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const { isLoading: isAuthLoading } = useAuth();

  const canRead = hasPrivilege("users", "READ");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<{ search?: string; status?: string }>(
    {},
  );

  const { data, isLoading } = useUsers({
    page,
    limit,
    search: filters.search,
    status: filters.status,
  });

  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);

  const handleAddUser = () => {
    setEditingUser(null);
    setAddEditModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setAddEditModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setResetUser(user);
    setResetModalOpen(true);
  };

  const handlePageChange = (newPage: number, newLimit: number) => {
    setPage(newPage);
    if (newLimit !== limit) setLimit(newLimit);
  };

  // Redirect if unauthorized
  useEffect(() => {
    if (!isAuthLoading && !canRead) {
      router.push("/landingpage");
    }
  }, [isAuthLoading, canRead, router]);

  if (isAuthLoading || !canRead) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-secondary" size={32} />
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
        <span className="text-primary font-medium">Pengguna</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-primary" size={28} />
            {activeTab === "users" ? "Manajemen Pengguna" : "Hak Akses & Peran"}
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Kelola data pengguna, peran, dan status akses sistem
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "users" && hasPrivilege("users", "CREATE") && (
            <button
              onClick={handleAddUser}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:brightness-90 transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <Plus size={18} />
              Tambah Pengguna
            </button>
          )}
          {activeTab === "roles" && hasPrivilege("users", "CREATE") && (
            <button
              onClick={() => setAddRoleModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:brightness-90 transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <Plus size={18} />
              Tambah Peran
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 mr-8 transition-colors ${activeTab === "users" ? "border-secondary text-secondary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} /> Pengguna
          </div>
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "roles" ? "border-secondary text-secondary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <div className="flex items-center gap-2">
            <Shield size={16} /> Peran
          </div>
        </button>
      </div>

      {/* Main Content */}
      <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        {activeTab === "users" ? (
          <UserTable
            records={data?.users || []}
            meta={data?.meta || { page: 1, limit: 20, total: 0 }}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            filters={filters}
            onFilterChange={setFilters}
            onEdit={handleEditUser}
            onResetPassword={handleResetPassword}
          />
        ) : (
          <RoleTable />
        )}
      </div>

      {/* Modals */}
      <AddEditUserModal
        open={addEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        editingUser={editingUser}
        onSuccess={() => {
          // React Query invalidate handles refresh
        }}
      />

      <ResetPasswordModal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        user={resetUser}
        onSuccess={() => { }}
      />

      <AddRoleModal
        open={addRoleModalOpen}
        onClose={() => setAddRoleModalOpen(false)}
        onSuccess={() => { }}
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
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

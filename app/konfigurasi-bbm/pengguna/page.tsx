"use client";

import { useState } from "react";
import { Plus, Users, Shield } from "lucide-react";
import { useUsers, type User } from "@/hooks/service/user-api";
import { UserTable } from "./components/UserTable";
import { AddEditUserModal } from "./components/AddEditUserModal";
import { ResetPasswordModal } from "./components/ResetPasswordModal";
import { RoleTable } from "./components/RoleTable";
import { usePrivilege } from "@/hooks/usePrivilege";

export default function PenggunaPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const { hasPrivilege } = usePrivilege();
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

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 animate-fade-in">
        <span>Dashboard</span>
        <span className="text-gray-400">/</span>
        <span>Konfigurasi Sistem</span>
        <span className="text-gray-400">/</span>
        <span className="text-[#115d72] font-medium">Pengguna</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-[#115d72]" size={28} />
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
              className="flex items-center gap-2 px-4 py-2.5 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <Plus size={18} />
              Tambah Pengguna
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 mr-8 transition-colors ${activeTab === "users" ? "border-[#14a2bb] text-[#14a2bb]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} /> Pengguna
          </div>
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "roles" ? "border-[#14a2bb] text-[#14a2bb]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
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
        onSuccess={() => {}}
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

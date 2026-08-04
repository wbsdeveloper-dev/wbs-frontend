"use client";

import React from "react";
import { Mail, Search, RefreshCw, FileText } from "lucide-react";
import EmailInboxTable from "@/app/konfigurasi/email-ingest/components/EmailInboxTable";
import { useGetEmailInbox } from "@/hooks/service/config-api";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function EmailFilesPage() {
  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const { isLoading: isAuthLoading } = useAuth();
  const canRead = hasPrivilege("email_ingest_gas", "READ") || hasPrivilege("data_input_gas", "READ");
  const { refetch, isRefetching } = useGetEmailInbox();

  React.useEffect(() => {
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
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gray-50">
      {/* Header & Breadcrumb */}
      <div className="mb-6 md:mb-8 animate-fadeIn">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="text-gray-400">/</span>
          <span>Manajemen Data</span>
          <span className="text-gray-400">/</span>
          <span className="text-primary font-medium">File Email</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Mail className="w-7 h-7 text-primary" />
              File Email
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Daftar email masuk dan lampiran file yang diterima oleh sistem untuk rekonsiliasi data.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin text-primary" : "text-gray-500"}`} />
            <span>{isRefetching ? "Memuat..." : "Refresh Data"}</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <EmailInboxTable />
    </div>
  );
}

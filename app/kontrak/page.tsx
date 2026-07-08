"use client";

import { useEffect } from "react";
import ContractTable from "../components/ContractTable";
import { useAuth } from "@/components/providers/auth-provider";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function KontrakPage() {
  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const { isLoading: isAuthLoading } = useAuth();
  
  const canRead = hasPrivilege("contracts", "READ");

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
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 animate-fadeIn">
        <span>Dashboard</span>
        <span className="text-gray-400">/</span>
        <span className="text-primary font-medium">
          Kontrak &amp; Dokumen
        </span>
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8 animate-fadeIn">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Kontrak &amp; Dokumen
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Detail kontrak dan dokumen gas pipa
        </p>
      </div>

      {/* Contract Table */}
      <div className="animate-fadeIn" style={{ animationDelay: "100ms" }}>
        <ContractTable />
      </div>

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
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

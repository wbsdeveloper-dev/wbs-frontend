"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Memproses Autentikasi...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus(`Otorisasi gagal: ${error}`);
      return;
    }

    if (!code) {
      setStatus("Menunggu kode otorisasi...");
      return;
    }

    if (window.opener) {
      // Send the code to the parent window
      window.opener.postMessage(
        { source: "wbs-oauth", type: "oauth-success", code },
        window.location.origin
      );
      setStatus("Otorisasi berhasil. Jendela ini akan tertutup...");
      
      // Attempt to close the window
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      setStatus("Gagal: Jendela utama tidak ditemukan. Harap tutup popup ini.");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-[#115d72]/10 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#115d72] animate-spin" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Autentikasi Google</h1>
          <p className="text-gray-600">{status}</p>
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-[#115d72]/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#115d72] animate-spin" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Autentikasi Google</h1>
              <p className="text-gray-600">Memproses Autentikasi...</p>
            </div>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}

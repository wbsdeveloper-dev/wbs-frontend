"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardSelection() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden flex justify-center items-center">
      {/* 🔹 Background image (BLUR ONLY HERE) */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 blur-sm"
        style={{
          backgroundImage: "url('/backgroundlp.jpeg')",
        }}
      />

      {/* 🔹 White overlay biar teks kebaca */}
      <div className="absolute inset-0 bg-white/40" />

      {/* 🔹 CONTENT (NO BLUR) */}
      <div className="relative z-10 flex flex-col px-4">
        <h1 className="text-gray-800 text-4xl md:text-5xl lg:text-4xl font-bold mb-4">
          Pilih Dashboard
        </h1>
        <p className="text-gray-900 mb-6">Akses pemantuan gas pipa dan bbm</p>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center">
          {/* CARD GAS */}
          <div className="text-left w-70 h-70 rounded-2xl bg-white p-8 border border-transparent hover:border-[#14a1bb] transition-all shadow-sm">
            <h3 className="text-gray-600 text-3xl font-bold">Dashboard</h3>
            <h3 className="text-gray-600 text-3xl font-bold">Gas Pipa</h3>
            <p className="mt-4 text-gray-600">
              Monitoring pasokan dan distribusi gas
            </p>

            <button
              onClick={() => router.push("/dashboard/gas")}
              className="
                mt-6
                flex items-center justify-between
                w-full
                px-6 py-2
                rounded-xl
                bg-linear-to-r from-[#2abfda78] to-white
                text-gray-800 font-medium
                shadow-sm
                border border-transparent
                hover:border-[#14a1bb]
                transition-all
              "
            >
              <span>Akses Dashboard</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* CARD BBM */}
          <div className="text-left w-70 h-70 rounded-2xl bg-white p-8 border border-transparent hover:border-[#14a1bb] transition-all shadow-sm">
            <h3 className="text-gray-600 text-3xl font-bold">Dashboard</h3>
            <h3 className="text-gray-600 text-3xl font-bold">BBM</h3>
            <p className="mt-4 text-gray-600">
              Monitoring stok dan distribusi BBM
            </p>

            <button
              onClick={() => router.push("/dashboard/bbm")}
              className="
                mt-6
                flex items-center justify-between
                w-full
                px-6 py-2
                rounded-xl
                bg-linear-to-r from-[#2abfda78] to-white
                text-gray-800 font-medium
                shadow-sm
                border border-transparent
                hover:border-[#14a1bb]
                transition-all
              "
            >
              <span>Akses Dashboard</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="mt-10 text-gray-800">
          Anda dapat berpindah dashboard kapan saja
        </p>
      </div>
    </div>
  );
}

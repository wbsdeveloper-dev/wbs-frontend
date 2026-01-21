"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DashboardSelection() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage: "url('/backgroundlp.jpeg')",
      }}
    >
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="relative z-10 text-center px-4">
        <h1 className="text-white text-4xl md:text-5xl lg:text-4xl font-bold mb-16 drop-shadow-lg">
          Pilih Dashboard
        </h1>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center">
          <button
            className="group relative w-70 h-70 rounded-3xl overflow-hidden border-4 border-white shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={() => router.push("/dashboard/gas")}
          >
            <div className="absolute inset-0 bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14a2bb8f] via-black/30 to-transparent group-hover:from-[#0c64748f] transition-all duration-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-white text-4xl md:text-5xl font-bold drop-shadow-lg">
                Gas Pipa
              </h2>
            </div>
          </button>
          <button
            className="group relative w-70 h-70 rounded-3xl overflow-hidden border-4 border-white shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={() => router.push("/dashboard/bbm")}
          >
            <div className="absolute inset-0 bg-cover bg-center" />
            <div className="absolute inset-0 bg-liniear-to-t from-[#14a2bb8f] via-black/30 to-transparent group-hover:from-[#0c64748f] transition-all duration-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-white text-4xl md:text-5xl font-bold drop-shadow-lg">
                BBM
              </h2>
            </div>
          </button>
        </div>
        <div className="mt-10">
          <button
            className="text-xl font-medium cursor-pointer"
            onClick={() => router.push("/auth/login")}
          >
            Kembali Ke Menu Login
          </button>
        </div>
      </div>
    </div>
  );
}

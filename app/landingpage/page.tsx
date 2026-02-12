"use client";

import { ChevronRight, Fuel, Flame, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DashboardSelection() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-white">
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
      
      {/* Animated Pattern Overlay - subtle on white */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#14a2bb]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#14a2bb]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-10 w-48 h-48 bg-[#115d72]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header with logos */}
      <header className="relative z-10 p-6 md:p-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/auth/login")}
            className="flex items-center gap-2 text-slate-600 hover:text-[#115d72] transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Kembali</span>
          </button>
          
          <div className="flex items-center gap-4 md:gap-8">
            <Image
              src="/logos/danantara.png"
              alt="Danantara logo"
              width={100}
              height={30}
              className="object-contain w-[60px] md:w-[80px] lg:w-[100px]"
            />
            <Image
              src="/logos/SucofindoIdSurvey.png"
              alt="Sucofindo logo"
              width={60}
              height={25}
              className="object-contain w-[40px] md:w-[50px] lg:w-[60px] mb-3"
            />
            <Image
              src="/logos/pln-epi.png"
              alt="PLN EPI logo"
              width={100}
              height={30}
              className="object-contain w-[60px] md:w-[80px] lg:w-[100px]"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12">
        {/* Title Section */}
        <div className="text-center mb-10 md:mb-14">
          <div className="w-20 h-1 bg-gradient-to-r from-[#14a2bb] to-[#115d72]/30 rounded-full mx-auto mb-6" />
          <h1 className="text-slate-800 text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight">
            Pilih Dashboard
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Akses pemantauan <span className="text-[#115d72] font-semibold">Gas Pipa</span> dan{" "}
            <span className="text-[#115d72] font-semibold">BBM</span> secara real-time
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-3xl">
          {/* Gas Pipa Card */}
          <div className="flex-1 group">
            <div
              onClick={() => router.push("/dashboard/gas")}
              className="relative bg-white rounded-2xl p-6 md:p-8 
                border border-slate-200 hover:border-[#14a2bb]/50
                cursor-pointer transition-all duration-300
                shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-[#14a2bb]/20
                hover:scale-[1.02]"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#14a2bb] to-[#115d72] 
                flex items-center justify-center mb-5 shadow-lg shadow-[#14a2bb]/30
                group-hover:scale-110 transition-transform">
                <Flame className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-slate-800 text-2xl md:text-3xl font-bold mb-2 tracking-tight">
                Dashboard
              </h3>
              <h3 className="text-[#14a2bb] text-2xl md:text-3xl font-bold mb-4">
                Gas Pipa
              </h3>
              <p className="text-slate-600 text-sm md:text-base mb-6 leading-relaxed">
                Monitoring pasokan dan distribusi gas secara real-time dengan visualisasi data interaktif
              </p>

              {/* Button */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl
                bg-gradient-to-r from-[#14a2bb]/10 to-transparent
                border border-[#14a2bb]/20 group-hover:border-[#14a2bb]/40
                transition-all duration-300">
                <span className="text-slate-700 font-medium">Akses Dashboard</span>
                <ChevronRight className="w-5 h-5 text-[#14a2bb] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* BBM Card */}
          <div className="flex-1 group">
            <div
              onClick={() => router.push("/dashboard/bbm")}
              className="relative bg-white rounded-2xl p-6 md:p-8 
                border border-slate-200 hover:border-[#fb923c]/50
                cursor-pointer transition-all duration-300
                shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-[#fb923c]/20
                hover:scale-[1.02]"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#fb923c] to-[#ea580c] 
                flex items-center justify-center mb-5 shadow-lg shadow-[#fb923c]/30
                group-hover:scale-110 transition-transform">
                <Fuel className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-slate-800 text-2xl md:text-3xl font-bold mb-2 tracking-tight">
                Dashboard
              </h3>
              <h3 className="text-[#ea580c] text-2xl md:text-3xl font-bold mb-4">
                BBM
              </h3>
              <p className="text-slate-600 text-sm md:text-base mb-6 leading-relaxed">
                Monitoring stok dan distribusi BBM dengan analitik komprehensif dan laporan harian
              </p>

              {/* Button */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl
                bg-gradient-to-r from-[#fb923c]/10 to-transparent
                border border-[#fb923c]/20 group-hover:border-[#fb923c]/40
                transition-all duration-300">
                <span className="text-slate-700 font-medium">Akses Dashboard</span>
                <ChevronRight className="w-5 h-5 text-[#fb923c] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-slate-500 text-sm mt-10 text-center">
          Anda dapat berpindah dashboard kapan saja melalui menu sidebar
        </p>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="text-slate-400 text-xs">
          © 2026 Sucofindo. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

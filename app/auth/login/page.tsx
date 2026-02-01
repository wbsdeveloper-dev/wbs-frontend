"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      router.push("/landingpage");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-2/5 bg-gradient-to-br from-white via-gray-50 to-gray-100 flex flex-col">
        {/* Logos Header */}
        <div className="p-6 md:p-8 lg:p-10 flex justify-center">
          <div className="flex items-center justify-center lg:justify-start gap-4 md:gap-6 lg:gap-10 flex-wrap">
            <Image
              src="/logos/danantara.png"
              alt="Danantara logo"
              width={100}
              height={35}
              className="object-contain w-[80px] md:w-[100px] lg:w-[150px]"
            />
            <Image
              src="/logos/SucofindoIdSurvey.png"
              alt="Sucofindo logo"
              width={60}
              height={35}
              className="object-contain w-[50px] md:w-[60px] lg:w-[100px] relative top-[-2px]"
            />
            <Image
              src="/logos/pln-epi.png"
              alt="PLN EPI logo"
              width={100}
              height={35}
              className="object-contain w-[80px] md:w-[100px] lg:w-[140px]"
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-16 pb-12">
          <div className="w-full max-w-md">
            {/* Welcome Text */}
            <div className="mb-8 md:mb-10 text-center lg:text-left">
              <h1 className="text-[#115d72] text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
                Selamat Datang!
              </h1>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Sistem monitoring <span className="font-semibold text-[#115d72]">Gas Pipa</span> dan{" "}
                <span className="font-semibold text-[#115d72]">BBM</span> berbasis website
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-medium">
                  Username
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full px-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-400
                      border-2 border-gray-200 
                      focus:border-[#14a2bb] focus:ring-4 focus:ring-[#14a2bb]/10
                      transition-all duration-200 outline-none"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#14a2bb]/5 to-[#115d72]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-medium">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white text-gray-900 placeholder-gray-400
                      border-2 border-gray-200 
                      focus:border-[#14a2bb] focus:ring-4 focus:ring-[#14a2bb]/10
                      transition-all duration-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#115d72] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#14a2bb]/5 to-[#115d72]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#14a2bb] focus:ring-[#14a2bb] cursor-pointer"
                  />
                  <span className="text-gray-600 group-hover:text-gray-800 transition-colors">
                    Ingat saya
                  </span>
                </label>
                <button
                  type="button"
                  className="text-[#115d72] hover:text-[#14a2bb] font-medium transition-colors"
                >
                  Lupa password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#14a1bb] to-[#115d72] hover:from-[#115d72] hover:to-[#0e4d5f]
                  text-white font-semibold py-4 rounded-xl
                  transform hover:scale-[1.02] active:scale-[0.98]
                  transition-all duration-200 
                  shadow-lg shadow-[#14a2bb]/25 hover:shadow-xl hover:shadow-[#115d72]/30
                  flex items-center justify-center gap-2
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Text */}
            <p className="text-center text-gray-500 text-xs mt-8">
              © 2026 PLN Energi Primer Indonesia. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Background Image */}
      <div
        className="hidden lg:block lg:w-3/5 relative overflow-hidden"
        style={{
          backgroundImage: "url(/backgroundlp.jpeg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#115d72]/90 via-[#115d72]/70 to-slate-900/50" />
        
        {/* Animated Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#14a2bb]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-start justify-center px-12 lg:px-16">
          <div className="max-w-lg">
            <div className="mb-6">
              <div className="w-16 h-1 bg-gradient-to-r from-[#14a2bb] to-white/50 rounded-full mb-6" />
              <h2 className="text-white text-3xl lg:text-4xl font-bold leading-tight mb-4">
                Monitoring Real-time
                <br />
                <span className="text-[#7dd3fc]">Pipa Gas & BBM</span>
              </h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Pantau distribusi energi secara real-time dengan dashboard yang modern dan intuitif
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm border border-white/20">
                📊 Dashboard Interaktif
              </span>
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm border border-white/20">
                🗺️ Peta Real-time
              </span>
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm border border-white/20">
                📈 Grafik Analitik
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900/50 to-transparent" />
      </div>
    </div>
  );
}

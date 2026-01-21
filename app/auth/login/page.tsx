"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState("internal");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    console.log("Login attempt:", { role, username, password });
    alert(`Login as ${role}: ${username}`);
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-2/5 bg-white p-8 lg:p-12 flex flex-col items-center">
        <div className="flex items-center gap-8 mb-12 justify-between">
          <div className="flex items-start justify-between gap-10">
            <Image
              src="/logos/danantara.png"
              alt="PLN logo"
              width={120}
              height={30}
              className="object-contain"
            />
            <Image
              src="/logos/SucofindoIdSurvey.png"
              alt="PLN logo"
              width={80}
              height={30}
              className="object-contain top-[-15] relative"
            />
            <Image
              src="/logos/pln-epi.png"
              alt="PLN logo"
              width={120}
              height={30}
              className="object-contain"
            />
          </div>
        </div>
        <div>
          <div className="mb-8 mt-24">
            <h1 className="text-[#115d72] text-3xl lg:text-4xl font-bold mb-2">
              Selamat datang!
            </h1>
            <p className="text-[#4c4f53] text-sm">
              Di sistem monitoring Pipa Gas dan BBM berbasis website
            </p>
          </div>
          <div className="flex-1">
            <div className="mb-4">
              <label className="block text-[#4c4f53] text-sm mb-3">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-3 rounded-lg bg-white text-[#222222] placeholder-gray-400
             outline outline-1 outline-gray-400
             focus:outline-2 focus:outline-[#14a2bb]"
              />
            </div>

            {/* Password Field */}
            <div className="mb-8">
              <label className="block text-[#4c4f53] text-sm mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400
             outline outline-1 outline-gray-400
             focus:outline-2 focus:outline-[#14a2bb]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button
              onClick={() => router.push("/landingpage")}
              className="w-full bg-[#14a1bb] hover:bg-[#115d72] text-white font-medium py-3 rounded-lg transition-colors cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>

      <div
        className="hidden lg:block lg:w-3/5 bg-cover bg-center relative"
        style={{
          backgroundImage: "url(../backgroundlp.jpeg)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#115d72] to-slate-900/40"></div>
        <div className="relative h-full flex flex-col items-start justify-center px-12"></div>
      </div>
    </div>
  );
}

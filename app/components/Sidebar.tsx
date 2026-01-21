"use client";

import {
  LayoutDashboard,
  Database,
  FileText,
  Settings,
  LogOut,
  Bot,
  Home,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Image
            src="/logos/pln-epi.png"
            alt="PLN logo"
            width={140}
            height={30}
            className="object-contain"
          />
        </div>
      </div>

      <div className="flex-1 py-6">
        <div className="px-4 mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            OVERVIEW
          </p>
        </div>
        <nav className="space-y-1 px-2">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#14a1bb] bg-blue-50 rounded-lg"
            onClick={() => router.push("/")}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <FileText className="w-5 h-5" />
            Entry Data
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <Database className="w-5 h-5" />
            Database
          </a>
          <a
            href="WhatsappBot"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            onClick={() => router.push("/WhatsappBot")}
          >
            <Bot className="w-5 h-5" />
            Whatsapp Bot
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg mt-4 cursor-pointer"
            onClick={() => router.push("/landingpage")}
          >
            <Home className="w-5 h-5" />
            Back To Home
          </a>
        </nav>
      </div>

      <div className="border-t border-gray-200">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            SETTINGS
          </p>
        </div>
        <nav className="space-y-1 px-2 pb-4">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <Settings className="w-5 h-5" />
            Setting
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </a>
        </nav>
      </div>
    </aside>
  );
}

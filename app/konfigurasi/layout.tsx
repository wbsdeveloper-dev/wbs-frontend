import type { Metadata } from "next";
import { Geist_Mono, Reddit_Sans } from "next/font/google";
import "../globals.css";
import Sidebar from "../components/Sidebar";
import { Providers } from "../providers";

const redditSans = Reddit_Sans({
  subsets: ["latin"],
  variable: "--font-reddit-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PLN Dashboard - Konfigurasi Sistem",
  description: "Konfigurasi sistem untuk Dashboard PLN",
};

export default function KonfigurasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${redditSans.variable} ${geistMono.variable} antialiased flex h-screen relative font-sans`}
    >
      {/* Background gradient matching dashboard theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#14a2bb]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#115d72]/5 rounded-full blur-3xl" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-16 lg:pt-0">
          <Providers>{children}</Providers>
        </main>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Geist_Mono, Reddit_Sans } from "next/font/google";
import "../globals.css";
import Sidebar from "../components/Sidebar";

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
  title: "PLN Dashboard - Monitor Rekonsiliasi Real-Time",
  description: "Monitor proses rekonsiliasi data dari WhatsApp, Email, Spreadsheet, Manual & BA Validasi",
};

export default function ReconciliationMonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${redditSans.variable} ${geistMono.variable} antialiased flex h-screen bg-gray-50 overflow-x-hidden min-w-0`}
    >
      <Sidebar />
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}

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
    title: "PLN Dashboard - Monitoring BBM",
    description: "Plan, prioritize, and accomplish your tasks with ease",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className={`${redditSans.variable} ${geistMono.variable} antialiased flex h-screen bg-gray-50`}
        >
            <Sidebar />
            <main className="flex-1 overflow-auto pt-16 lg:pt-0">
                <Providers>{children}</Providers>
            </main>
        </div>
    );
}

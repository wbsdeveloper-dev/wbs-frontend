// app/layout.tsx
import type { Metadata } from "next";
import { Reddit_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const redditSans = Reddit_Sans({
  subsets: ["latin"],
  variable: "--font-reddit-sans",
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" className={redditSans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

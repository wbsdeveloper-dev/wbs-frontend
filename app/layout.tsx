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

const themeInitializationScript = `
(function () {
  try {
    var storedMode = localStorage.getItem("wbs-color-mode");
    var mode = storedMode === "dark" ? "dark" : "light";
    var root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.dataset.colorMode = mode;
    root.style.colorScheme = mode;
  } catch (_) {
    document.documentElement.dataset.colorMode = "light";
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={redditSans.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

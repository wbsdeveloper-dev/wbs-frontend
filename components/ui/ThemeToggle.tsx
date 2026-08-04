"use client";

import { Moon, Sun } from "lucide-react";
import { useAppTheme } from "@/components/providers/ThemeProvider";

type ThemeToggleProps = {
  compact?: boolean;
  className?: string;
};

export default function ThemeToggle({
  compact = false,
  className = "",
}: ThemeToggleProps) {
  const { isDark, toggleColorMode } = useAppTheme();
  const nextModeLabel = isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap";

  return (
    <button
      type="button"
      onClick={toggleColorMode}
      className={`group inline-flex items-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-gray-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary/60 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950 ${
        compact ? "h-9 w-9 justify-center" : "gap-2 px-3 py-2"
      } ${className}`}
      aria-label={nextModeLabel}
      aria-pressed={isDark}
      title={nextModeLabel}
    >
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <Sun
          aria-hidden="true"
          className={`absolute h-[18px] w-[18px] transition-all duration-200 ${
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          aria-hidden="true"
          className={`absolute h-[18px] w-[18px] transition-all duration-200 ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </span>
      {!compact && (
        <span className="text-sm font-medium">
          {isDark ? "Mode Gelap" : "Mode Terang"}
        </span>
      )}
    </button>
  );
}

"use client";

import React, { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";

export interface CronPreset {
  label: string;
  value: string;
}

export const CRON_PRESETS: CronPreset[] = [
  { label: "Setiap 5 menit", value: "*/5 * * * *" },
  { label: "Setiap jam", value: "0 * * * *" },
  { label: "Setiap 6 jam", value: "0 */6 * * *" },
  {
    label: "Setiap 12 jam (tengah hari & tengah malam)",
    value: "0 0,12 * * *",
  },
  { label: "Setiap hari pukul 06.00", value: "0 6 * * *" },
  { label: "Setiap hari pukul 08.00", value: "0 8 * * *" },
  { label: "Setiap hari pukul 11.00 dan 23.00", value: "0 11,23 * * *" },
  { label: "Custom...", value: "__custom__" },
];

/** Returns the friendly label for a cron string, or the raw cron string if not a known preset. */
export function getCronLabel(cron: string | null | undefined): string {
  if (!cron) return "—";
  const found = CRON_PRESETS.find(
    (p) => p.value !== "__custom__" && p.value === cron,
  );
  return found ? found.label : cron;
}

function getPresetForValue(value: string): string {
  if (!value) return "";
  const found = CRON_PRESETS.find(
    (p) => p.value !== "__custom__" && p.value === value,
  );
  return found ? found.value : "__custom__";
}

interface CronScheduleSelectorProps {
  /** Current cron string value (e.g. "0 8 * * *") */
  value: string;
  /** Called whenever the effective cron value changes */
  onChange: (value: string) => void;
  /** Optional label override */
  label?: string;
  /** Whether the field is optional */
  optional?: boolean;
  /** Whether the inputs should be disabled */
  disabled?: boolean;
  /** Additional class for the outer wrapper */
  className?: string;
}

export default function CronScheduleSelector({
  value,
  onChange,
  label = "Cron Schedule",
  optional = true,
  disabled = false,
  className = "",
}: CronScheduleSelectorProps) {
  const [customMode, setCustomMode] = useState(
    () => getPresetForValue(value) === "__custom__",
  );
  const derivedPreset = getPresetForValue(value);
  const selectedPreset = derivedPreset || (customMode ? "__custom__" : "");
  const customValue = selectedPreset === "__custom__" ? value : "";

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    const isCustom = next === "__custom__";
    setCustomMode(isCustom);
    onChange(isCustom ? "" : next);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomMode(true);
    onChange(e.target.value);
  };

  // Human-readable summary for a non-custom preset
  const presetLabel =
    selectedPreset && selectedPreset !== "__custom__"
      ? CRON_PRESETS.find((p) => p.value === selectedPreset)?.label
      : null;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
        {label}
        {optional && (
          <span className="ml-1 text-xs text-gray-400 dark:text-slate-500 font-normal">
            (opsional)
          </span>
        )}
      </label>

      {/* Preset selector */}
      <div className="relative">
        <Clock
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <select
          value={selectedPreset}
          onChange={handlePresetChange}
          disabled={disabled}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent appearance-none cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
        >
          {CRON_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>

      {/* Custom cron input — shown only when "Custom..." is selected */}
      {selectedPreset === "__custom__" && (
        <div className="space-y-1">
          <input
            type="text"
            value={customValue}
            onChange={handleCustomChange}
            disabled={disabled}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-mono text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 disabled:opacity-60 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            placeholder="Contoh: 0 11,23 * * *"
          />
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Format cron: menit jam hari bulan hari-minggu. Contoh:{" "}
            <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">
              0 11,23 * * *
            </code>{" "}
            = setiap hari jam 11:00 dan 23:00.
          </p>
        </div>
      )}

      {/* Friendly description for a preset value */}
      {presetLabel && (
        <p className="text-xs text-primary flex items-center gap-1">
          <Clock size={11} />
          {presetLabel}
        </p>
      )}
    </div>
  );
}

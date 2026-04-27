"use client";

import React, { useState, useEffect } from "react";
import { Clock, ChevronDown } from "lucide-react";

export interface CronPreset {
  label: string;
  value: string;
}

export const CRON_PRESETS: CronPreset[] = [
  { label: "Setiap 5 menit", value: "*/5 * * * *" },
  { label: "Setiap jam", value: "0 * * * *" },
  { label: "Setiap 6 jam", value: "0 */6 * * *" },
  { label: "Setiap 12 jam (tengah hari & tengah malam)", value: "0 0,12 * * *" },
  { label: "Setiap hari pukul 06.00", value: "0 6 * * *" },
  { label: "Setiap hari pukul 08.00", value: "0 8 * * *" },
  { label: "Setiap hari pukul 11.00 dan 23.00", value: "0 11,23 * * *" },
  { label: "Custom...", value: "__custom__" },
];

/** Returns the friendly label for a cron string, or the raw cron string if not a known preset. */
export function getCronLabel(cron: string | null | undefined): string {
  if (!cron) return "—";
  const found = CRON_PRESETS.find((p) => p.value !== "__custom__" && p.value === cron);
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
  /** Additional class for the outer wrapper */
  className?: string;
}

export default function CronScheduleSelector({
  value,
  onChange,
  label = "Cron Schedule",
  optional = true,
  className = "",
}: CronScheduleSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(() =>
    getPresetForValue(value),
  );
  const [customValue, setCustomValue] = useState<string>(() =>
    selectedPreset === "__custom__" ? value : "",
  );

  // Sync when `value` prop changes from the outside (e.g. edit modal pre-fill)
  useEffect(() => {
    const preset = getPresetForValue(value);
    setSelectedPreset(preset);
    if (preset === "__custom__") {
      setCustomValue(value);
    }
  }, [value]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setSelectedPreset(next);
    if (next === "__custom__") {
      // Keep whatever was in the custom field, or clear if empty
      onChange(customValue);
    } else {
      onChange(next);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setCustomValue(next);
    onChange(next);
  };

  // Human-readable summary for a non-custom preset
  const presetLabel =
    selectedPreset && selectedPreset !== "__custom__"
      ? CRON_PRESETS.find((p) => p.value === selectedPreset)?.label
      : null;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {optional && (
          <span className="ml-1 text-xs text-gray-400 font-normal">
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
          className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent appearance-none cursor-pointer transition-all duration-200"
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
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
            placeholder="Contoh: 0 11,23 * * *"
          />
          <p className="text-xs text-gray-500">
            Format cron: menit jam hari bulan hari-minggu. Contoh:{" "}
            <code className="bg-gray-100 px-1 rounded">0 11,23 * * *</code> =
            setiap hari jam 11:00 dan 23:00.
          </p>
        </div>
      )}

      {/* Friendly description for a preset value */}
      {presetLabel && (
        <p className="text-xs text-[#115d72] flex items-center gap-1">
          <Clock size={11} />
          {presetLabel}
        </p>
      )}
    </div>
  );
}

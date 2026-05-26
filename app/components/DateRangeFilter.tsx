"use client";

import type { Periode } from "./RealtimeChart";

type Props = {
  startDate: string | null;
  endDate: string | null;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  /** Which periode is currently active — drives which inputs are shown */
  periode: Periode;
  /** @deprecated kept for backward compat — ignored when `periode` is provided */
  isSingleDate?: boolean;
  /** @deprecated kept for backward compat — ignored when `periode` is provided */
  mode?: "Jam" | "Hari" | "Bulan" | "Tahun";
};

/**
 * Derive the HTML input type and labels from the selected Periode.
 *
 * | Periode | Start Label   | End Label     | Picker  |
 * |---------|---------------|---------------|---------|
 * | 1D      | Tanggal Awal  | —             | date    |
 * | 1W      | Tanggal Awal  | Tanggal Akhir | date    |
 * | 1M      | Tanggal Awal  | Tanggal Akhir | date    |
 * | 1Y      | Bulan Awal    | Bulan Akhir   | month   |
 * | 3Y      | Tahun Awal    | Tahun Akhir   | year    |
 */
function getPickerConfig(periode: Periode) {
  switch (periode) {
    case "1D":
      return {
        singleDate: true,
        pickerType: "date" as const,
        startLabel: "Tanggal Awal",
        endLabel: "",
      };
    case "1W":
      return {
        singleDate: false,
        pickerType: "date" as const,
        startLabel: "Tanggal Awal",
        endLabel: "Tanggal Akhir",
      };
    case "1M":
      return {
        singleDate: false,
        pickerType: "date" as const,
        startLabel: "Tanggal Awal",
        endLabel: "Tanggal Akhir",
      };
    case "1Y":
      return {
        singleDate: false,
        pickerType: "month" as const,
        startLabel: "Bulan Awal",
        endLabel: "Bulan Akhir",
      };
    case "3Y":
      return {
        singleDate: false,
        pickerType: "year" as const,
        startLabel: "Tahun Awal",
        endLabel: "Tahun Akhir",
      };
    default:
      return {
        singleDate: true,
        pickerType: "date" as const,
        startLabel: "Tanggal Awal",
        endLabel: "",
      };
  }
}

export default function DateFilter({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  periode,
}: Props) {
  const { singleDate, pickerType, startLabel, endLabel } =
    getPickerConfig(periode);

  const getInputValue = (
    dateStr: string | null,
    type: "date" | "month" | "year",
  ) => {
    if (!dateStr) return "";
    if (type === "date") return dateStr;
    if (type === "month") return dateStr.slice(0, 7);
    if (type === "year") return dateStr.slice(0, 4);
    return dateStr;
  };

  const handleDateChange = (
    val: string,
    setter: (value: string) => void,
    type: "date" | "month" | "year",
  ) => {
    if (!val) {
      setter("");
      return;
    }
    if (type === "date") {
      setter(val);
    } else if (type === "month") {
      setter(`${val}-01`);
    } else if (type === "year") {
      setter(`${val}-01-01`);
    }
  };

  // --- Single-date mode (1 Hari) ---
  if (singleDate) {
    return (
      <div className="flex flex-col gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {startLabel}
          </label>
          <input
            type={pickerType === "year" ? "number" : pickerType}
            min={pickerType === "year" ? "2000" : undefined}
            max={pickerType === "year" ? "2100" : undefined}
            placeholder={pickerType === "year" ? "YYYY" : undefined}
            value={getInputValue(startDate, pickerType)}
            onChange={(e) => {
              handleDateChange(e.target.value, setStartDate, pickerType);
              handleDateChange(e.target.value, setEndDate, pickerType);
            }}
            className="w-full px-4 py-2 rounded-lg text-[0.875rem] border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb] text-gray-700"
          />
        </div>
      </div>
    );
  }

  // --- Range mode (1 Minggu / 1 Bulan / 1 Tahun / 3 Tahun) ---
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {startLabel}
        </label>
        <input
          type={pickerType === "year" ? "number" : pickerType}
          min={pickerType === "year" ? "2000" : undefined}
          max={pickerType === "year" ? "2100" : undefined}
          placeholder={pickerType === "year" ? "YYYY" : undefined}
          value={getInputValue(startDate, pickerType)}
          onChange={(e) =>
            handleDateChange(e.target.value, setStartDate, pickerType)
          }
          className="w-full px-4 py-2 rounded-lg text-[0.875rem] border border-gray-300
                   focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {endLabel}
        </label>
        <input
          type={pickerType === "year" ? "number" : pickerType}
          min={
            pickerType === "year"
              ? getInputValue(startDate, "year") || "2000"
              : pickerType === "month"
                ? getInputValue(startDate, "month") || undefined
                : startDate ?? undefined
          }
          max={pickerType === "year" ? "2100" : undefined}
          placeholder={pickerType === "year" ? "YYYY" : undefined}
          value={getInputValue(endDate, pickerType)}
          onChange={(e) =>
            handleDateChange(e.target.value, setEndDate, pickerType)
          }
          className="w-full px-4 py-2 rounded-lg text-[0.875rem] border border-gray-300
                   focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
        />
      </div>
    </div>
  );
}

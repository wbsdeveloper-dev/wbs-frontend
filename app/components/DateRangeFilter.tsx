"use client";

type Props = {
  startDate: string | null;
  endDate: string | null;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  isSingleDate?: boolean;
  mode?: "Jam" | "Hari" | "Bulan" | "Tahun";
};

export default function DateFilter({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  isSingleDate,
  mode = "Hari",
}: Props) {
  const pickerType = mode === "Bulan" ? "month" : mode === "Tahun" ? "year" : "date";

  const getInputValue = (dateStr: string | null, type: "date" | "month" | "year") => {
    if (!dateStr) return "";
    if (type === "date") return dateStr;
    if (type === "month") return dateStr.slice(0, 7);
    if (type === "year") return dateStr.slice(0, 4);
    return dateStr;
  };

  const handleDateChange = (val: string, setter: (value: string) => void, type: "date" | "month" | "year") => {
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

  if (isSingleDate || mode === "Jam") {
    return (
      <div className="flex flex-col gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal
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

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tanggal Awal
        </label>
        <input
          type={pickerType === "year" ? "number" : pickerType}
          min={pickerType === "year" ? "2000" : undefined}
          max={pickerType === "year" ? "2100" : undefined}
          placeholder={pickerType === "year" ? "YYYY" : undefined}
          value={getInputValue(startDate, pickerType)}
          onChange={(e) => handleDateChange(e.target.value, setStartDate, pickerType)}
          className="w-full px-4 py-2 rounded-lg text-[0.875rem] border border-gray-300
                   focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tanggal Akhir
        </label>
        <input
          type={pickerType === "year" ? "number" : pickerType}
          min={pickerType === "year" ? (getInputValue(startDate, "year") || "2000") : (pickerType === "month" ? (getInputValue(startDate, "month") || undefined) : (startDate ?? undefined))}
          max={pickerType === "year" ? "2100" : undefined}
          placeholder={pickerType === "year" ? "YYYY" : undefined}
          value={getInputValue(endDate, pickerType)}
          onChange={(e) => handleDateChange(e.target.value, setEndDate, pickerType)}
          className="w-full px-4 py-2 rounded-lg text-[0.875rem] border border-gray-300
                   focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
        />
      </div>
    </div>
  );
}

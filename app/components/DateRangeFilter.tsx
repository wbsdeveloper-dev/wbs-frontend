"use client";

type Props = {
  startDate: string | null;
  endDate: string | null;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
};

export default function DateFilter({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tanggal Awal
        </label>
        <input
          type="date"
          value={startDate ?? ""}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-[0.875rem] border border-gray-300
                   focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tanggal Akhir
        </label>
        <input
          type="date"
          value={endDate ?? ""}
          min={startDate ?? undefined}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full px-4 py-2 rounded-lg text-[0.875rem] border border-gray-300
                   focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
        />
      </div>
    </div>
  );
}

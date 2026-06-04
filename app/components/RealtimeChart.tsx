"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, X, Info, AlertTriangle } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

import FilterAutocomplete from "./FilterAutocomplete";
import SupplierResumeTable from "./SupplierResumeTable";
import { Switch } from "@mui/material";
import NoteSection from "./NoteSection";
import ModalNote from "./ModalNote";
import DateRangeFilter from "./DateRangeFilter";
import {
  useEvents,
  type ChartFlowResponse,
  type DashboardFilters,
  type FilterOption,
} from "@/hooks/service/dashboard-api";
import type { Contract } from "@/hooks/service/contract-api";
import { Loader2 } from "lucide-react";

const filterTypeOptions = ["Pemasok", "Pembangkit"];

export type Granularity =
  | "hour"
  | "day"
  | "month"
  | "three_month"
  | "six_month"
  | "one_month"
  | "one_year"
  | "three_year"
  | "year"
  | "interval_hour"
  | "interval_day"
  | "interval_month"
  | "interval_year";
export type FilterBy = "supplier" | "plant";

// Map each periode to the valid interval (granularity) options
function getValidIntervals(
  periode: Periode,
): { key: Granularity; label: string }[] {
  switch (periode) {
    case "1D":
      return [{ key: "hour", label: "Jam" }];
    case "1W":
      return [
        { key: "day", label: "Hari" },
        { key: "hour", label: "Jam" },
      ];
    case "1M":
      return [
        { key: "day", label: "Hari" },
        { key: "hour", label: "Jam" },
      ];
    case "1Y":
      return [
        { key: "month", label: "Bulan" },
        { key: "day", label: "Hari" },
      ];
    case "3Y":
      return [
        { key: "year", label: "Tahun" },
        { key: "month", label: "Bulan" },
        { key: "day", label: "Hari" },
      ];
    default:
      return [{ key: "hour", label: "Jam" }];
  }
}

export interface RealtimeChartProps {
  chartFlowData?: ChartFlowResponse | null;
  filtersData?: DashboardFilters | null;
  contractData?: Contract[] | null;
  isLoading?: boolean;
  isContractLoading?: boolean;
  onPeriodChange?: (periode: Periode, granularity: Granularity) => void;
  onFilterByChange?: (by: FilterBy | null) => void;
  onPemasokChange?: (pemasokId: string | null) => void;
  onPembangkitChange?: (pembangkitId: string | null) => void;
  onDateRangeChange?: (
    startDate: string | null,
    endDate: string | null,
  ) => void;
}

type ChartItem = {
  label: string;
  values: Record<string, number>;
  flowrates?: Record<string, number>;
  rawTimestamp?: string;
};

interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
  dataKey?: string;
  payload?: ChartItem;
}

type SelectedPoint = {
  label: string;
  series: string;
  value: number;
  rawTimestamp?: string;
  siteId?: string;
};

const COLORS: Record<string, string> = {
  "Pembangkit 1": "#f87171",
  "Pembangkit 2": "#fb923c",
  "Pembangkit 3": "#facc15",
  "Pembangkit 4": "#60a5fa",
  "Mean Pembangkit 1": "#f87171",
  "Mean Pembangkit 2": "#fb923c",
  "Mean Pembangkit 3": "#facc15",
  "Mean Pembangkit 4": "#60a5fa",
};

const dataJamA: ChartItem[] = [
  {
    label: "00.00",
    values: { "Pembangkit 1": 20, "Pembangkit 2": 35, "Pembangkit 3": 45 },
  },
  {
    label: "01.00",
    values: { "Pembangkit 1": 18, "Pembangkit 2": 30, "Pembangkit 3": 40 },
  },
  {
    label: "02.00",
    values: { "Pembangkit 1": 15, "Pembangkit 2": 28, "Pembangkit 3": 48 },
  },
  {
    label: "03.00",
    values: { "Pembangkit 1": 12, "Pembangkit 2": 25, "Pembangkit 3": 45 },
  },
  {
    label: "04.00",
    values: { "Pembangkit 1": 10, "Pembangkit 2": 22, "Pembangkit 3": 42 },
  },
  {
    label: "05.00",
    values: { "Pembangkit 1": 15, "Pembangkit 2": 30, "Pembangkit 3": 40 },
  },
  {
    label: "06.00",
    values: { "Pembangkit 1": 30, "Pembangkit 2": 45, "Pembangkit 3": 45 },
  },
  {
    label: "07.00",
    values: { "Pembangkit 1": 45, "Pembangkit 2": 60, "Pembangkit 3": 40 },
  },
  {
    label: "08.00",
    values: { "Pembangkit 1": 60, "Pembangkit 2": 70, "Pembangkit 3": 40 },
  },
  {
    label: "09.00",
    values: { "Pembangkit 1": 70, "Pembangkit 2": 80, "Pembangkit 3": 40 },
  },
  {
    label: "10.00",
    values: { "Pembangkit 1": 75, "Pembangkit 2": 85, "Pembangkit 3": 45 },
  },
  {
    label: "11.00",
    values: { "Pembangkit 1": 80, "Pembangkit 2": 90, "Pembangkit 3": 40 },
  },
  {
    label: "12.00",
    values: { "Pembangkit 1": 85, "Pembangkit 2": 95, "Pembangkit 3": 45 },
  },
  {
    label: "13.00",
    values: { "Pembangkit 1": 82, "Pembangkit 2": 92, "Pembangkit 3": 42 },
  },
  {
    label: "14.00",
    values: { "Pembangkit 1": 78, "Pembangkit 2": 88, "Pembangkit 3": 48 },
  },
  {
    label: "15.00",
    values: { "Pembangkit 1": 72, "Pembangkit 2": 82, "Pembangkit 3": 42 },
  },
  {
    label: "16.00",
    values: { "Pembangkit 1": 65, "Pembangkit 2": 75, "Pembangkit 3": 45 },
  },
  {
    label: "17.00",
    values: { "Pembangkit 1": 60, "Pembangkit 2": 70, "Pembangkit 3": 40 },
  },
  {
    label: "18.00",
    values: { "Pembangkit 1": 55, "Pembangkit 2": 65, "Pembangkit 3": 45 },
  },
  {
    label: "19.00",
    values: { "Pembangkit 1": 50, "Pembangkit 2": 60, "Pembangkit 3": 40 },
  },
  {
    label: "20.00",
    values: { "Pembangkit 1": 45, "Pembangkit 2": 55, "Pembangkit 3": 45 },
  },
  {
    label: "21.00",
    values: { "Pembangkit 1": 40, "Pembangkit 2": 50, "Pembangkit 3": 40 },
  },
  {
    label: "22.00",
    values: { "Pembangkit 1": 30, "Pembangkit 2": 45, "Pembangkit 3": 45 },
  },
  {
    label: "23.00",
    values: { "Pembangkit 1": 25, "Pembangkit 2": 40, "Pembangkit 3": 40 },
  },
];

const dataJamAMean: Record<string, number> = {
  "Pembangkit 1": 48.83,
  "Pembangkit 2": 63.63,
  "Pembangkit 3": 42.79,
};

const dataJamB: ChartItem[] = [
  { label: "00.00", values: { pembangkit: 20, pemasok: 35 } },
  { label: "01.00", values: { pembangkit: 18, pemasok: 30 } },
  { label: "02.00", values: { pembangkit: 15, pemasok: 28 } },
  { label: "03.00", values: { pembangkit: 12, pemasok: 25 } },
  { label: "04.00", values: { pembangkit: 10, pemasok: 22 } },
  { label: "05.00", values: { pembangkit: 15, pemasok: 30 } },
  { label: "06.00", values: { pembangkit: 30, pemasok: 45 } },
  { label: "07.00", values: { pembangkit: 45, pemasok: 60 } },
  { label: "08.00", values: { pembangkit: 60, pemasok: 70 } },
  { label: "09.00", values: { pembangkit: 70, pemasok: 80 } },
  { label: "10.00", values: { pembangkit: 75, pemasok: 85 } },
  { label: "11.00", values: { pembangkit: 80, pemasok: 90 } },
  { label: "12.00", values: { pembangkit: 85, pemasok: 95 } },
  { label: "13.00", values: { pembangkit: 82, pemasok: 92 } },
  { label: "14.00", values: { pembangkit: 78, pemasok: 88 } },
  { label: "15.00", values: { pembangkit: 72, pemasok: 82 } },
  { label: "16.00", values: { pembangkit: 65, pemasok: 75 } },
  { label: "17.00", values: { pembangkit: 60, pemasok: 70 } },
  { label: "18.00", values: { pembangkit: 55, pemasok: 65 } },
  { label: "19.00", values: { pembangkit: 50, pemasok: 60 } },
  { label: "20.00", values: { pembangkit: 45, pemasok: 55 } },
  { label: "21.00", values: { pembangkit: 40, pemasok: 50 } },
  { label: "22.00", values: { pembangkit: 30, pemasok: 45 } },
  { label: "23.00", values: { pembangkit: 25, pemasok: 40 } },
];

const data1MingguA: ChartItem[] = [
  { label: "Senin", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Selasa", values: { pembangkit: 70, pemasok: 82 } },
  { label: "Rabu", values: { pembangkit: 72, pemasok: 85 } },
  { label: "Kamis", values: { pembangkit: 75, pemasok: 88 } },
  { label: "Jumat", values: { pembangkit: 78, pemasok: 90 } },
  { label: "Sabtu", values: { pembangkit: 74, pemasok: 86 } },
  { label: "Minggu", values: { pembangkit: 70, pemasok: 83 } },
];
const data1MingguB: ChartItem[] = [
  { label: "Senin", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Selasa", values: { pembangkit: 70, pemasok: 82 } },
  { label: "Rabu", values: { pembangkit: 72, pemasok: 85 } },
  { label: "Kamis", values: { pembangkit: 75, pemasok: 88 } },
  { label: "Jumat", values: { pembangkit: 78, pemasok: 90 } },
  { label: "Sabtu", values: { pembangkit: 74, pemasok: 86 } },
  { label: "Minggu", values: { pembangkit: 70, pemasok: 83 } },
];

const data3BulanA: ChartItem[] = [
  { label: "Juli", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Agustus", values: { pembangkit: 72, pemasok: 85 } },
  { label: "September", values: { pembangkit: 78, pemasok: 90 } },
];
const data3BulanB: ChartItem[] = [
  { label: "Juli", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Agustus", values: { pembangkit: 72, pemasok: 85 } },
  { label: "September", values: { pembangkit: 78, pemasok: 90 } },
];

const data6BulanA: ChartItem[] = [
  { label: "April", values: { pembangkit: 60, pemasok: 72 } },
  { label: "Mei", values: { pembangkit: 65, pemasok: 76 } },
  { label: "Juni", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Juli", values: { pembangkit: 70, pemasok: 83 } },
  { label: "Agustus", values: { pembangkit: 74, pemasok: 87 } },
  { label: "September", values: { pembangkit: 78, pemasok: 90 } },
];
const data6BulanB: ChartItem[] = [
  { label: "April", values: { pembangkit: 60, pemasok: 72 } },
  { label: "Mei", values: { pembangkit: 65, pemasok: 76 } },
  { label: "Juni", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Juli", values: { pembangkit: 70, pemasok: 83 } },
  { label: "Agustus", values: { pembangkit: 74, pemasok: 87 } },
  { label: "September", values: { pembangkit: 78, pemasok: 90 } },
];

const data1TahunA: ChartItem[] = [
  { label: "Jan", values: { pembangkit: 50, pemasok: 65 } },
  { label: "Feb", values: { pembangkit: 52, pemasok: 67 } },
  { label: "Mar", values: { pembangkit: 55, pemasok: 70 } },
  { label: "Apr", values: { pembangkit: 58, pemasok: 72 } },
  { label: "Mei", values: { pembangkit: 62, pemasok: 75 } },
  { label: "Jun", values: { pembangkit: 65, pemasok: 78 } },
  { label: "Jul", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Agu", values: { pembangkit: 72, pemasok: 85 } },
  { label: "Sep", values: { pembangkit: 75, pemasok: 88 } },
  { label: "Okt", values: { pembangkit: 78, pemasok: 90 } },
  { label: "Nov", values: { pembangkit: 80, pemasok: 92 } },
  { label: "Des", values: { pembangkit: 82, pemasok: 95 } },
];
const data1TahunB: ChartItem[] = [
  { label: "Jan", values: { pembangkit: 50, pemasok: 65 } },
  { label: "Feb", values: { pembangkit: 52, pemasok: 67 } },
  { label: "Mar", values: { pembangkit: 55, pemasok: 70 } },
  { label: "Apr", values: { pembangkit: 58, pemasok: 72 } },
  { label: "Mei", values: { pembangkit: 62, pemasok: 75 } },
  { label: "Jun", values: { pembangkit: 65, pemasok: 78 } },
  { label: "Jul", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Agu", values: { pembangkit: 72, pemasok: 85 } },
  { label: "Sep", values: { pembangkit: 75, pemasok: 88 } },
  { label: "Okt", values: { pembangkit: 78, pemasok: 90 } },
  { label: "Nov", values: { pembangkit: 80, pemasok: 92 } },
  { label: "Des", values: { pembangkit: 82, pemasok: 95 } },
];

const data3TahunA: ChartItem[] = [
  { label: "2021", values: { pembangkit: 50, pemasok: 65 } },
  { label: "2022", values: { pembangkit: 60, pemasok: 75 } },
  { label: "2023", values: { pembangkit: 70, pemasok: 85 } },
];
const data3TahunB: ChartItem[] = [
  { label: "2021", values: { pembangkit: 50, pemasok: 65 } },
  { label: "2022", values: { pembangkit: 60, pemasok: 75 } },
  { label: "2023", values: { pembangkit: 70, pemasok: 85 } },
];

const DYNAMIC_COLORS = [
  "#f87171",
  "#fb923c",
  "#facc15",
  "#60a5fa",
  "#34d399",
  "#a78bfa",
  "#f472b6",
];

const CustomXAxisTick = (props: any) => {
  const { x, y, payload, index, chartData, period, intervalMode } = props;
  const originalIndex = payload.index !== undefined ? payload.index : index;
  const item = chartData && chartData[originalIndex];

  if (!item || period !== "3Y" || intervalMode !== "Bulan" || !item.yearStr) {
    return (
      <text x={x} y={y + 15} textAnchor="middle" fill="#666" fontSize={12}>
        {payload.value}
      </text>
    );
  }

  const isFirstMonth = item.monthStr === "Jan";
  const isMidYear = item.monthStr === "Jul";

  return (
    <g>
      <text x={x} y={y + 15} textAnchor="middle" fill="#666" fontSize={11}>
        {payload.value}
      </text>
      {isMidYear && (
        <text
          x={x}
          y={y + 35}
          textAnchor="middle"
          fill="#333"
          fontSize={12}
          fontWeight="bold"
        >
          {item.yearStr}
        </text>
      )}
      {/* Horizontal line under month */}
      <line
        x1={x - 50}
        y1={y + 22}
        x2={x + 50}
        y2={y + 22}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
      {/* Vertical separator before Jan */}
      {isFirstMonth && originalIndex !== 0 && (
        <line
          x1={x - 14}
          y1={y}
          x2={x - 14}
          y2={y + 40}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      )}
    </g>
  );
};

const CustomTooltip = ({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  unit?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const totalVolume = payload.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0,
  );
  const totalFlowrate = payload.reduce((sum, item) => {
    const originalKey = item.dataKey?.replace("values.", "") || item.name;
    const flowrate = item.payload?.flowrates?.[originalKey] || 0;
    return sum + Number(flowrate);
  }, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm text-gray-900 min-w-[320px] max-w-[700px] z-100">
      <p className="font-semibold mb-3 border-b border-gray-100 pb-2">
        {label}
      </p>

      <ul
        className={`
      grid gap-3 items-start
      ${payload.length > 4 ? "grid-cols-2" : "grid-cols-1"}
    `}
      >
        {payload.map((item, index) => {
          const originalKey = item.dataKey?.replace("values.", "") || item.name;
          const flowrate = item.payload?.flowrates?.[originalKey] || 0;

          return (
            <div key={index} className="flex flex-col min-w-[260px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-2 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="font-medium text-gray-800">{item.name}</div>
              </div>

              <div className="grid grid-cols-2 text-xs gap-2 pl-4">
                <div className="flex flex-col bg-gray-50 rounded p-1.5 border border-gray-100">
                  <span className="text-gray-500 mb-0.5">Volume</span>
                  <span className="font-semibold text-gray-900 border-t border-gray-100 pt-0.5">
                    {Number(item.value).toLocaleString("id-ID", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    {unit || "BBTUD"}
                  </span>
                </div>

                <div className="flex flex-col bg-secondary/5 rounded p-1.5 border border-secondary/10">
                  <span className="text-primary/70 mb-0.5">Flowrate</span>

                  <span className="font-semibold text-primary border-t border-secondary/10 pt-0.5">
                    {Number(flowrate).toLocaleString("id-ID", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    MMSCFD
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </ul>

      {payload.length > 1 && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="font-medium text-gray-800 mb-2">
            Total Keseluruhan
          </div>
          <div className="grid grid-cols-2 text-xs gap-2">
            <div className="flex flex-col bg-gray-100 rounded p-1.5 border border-gray-200">
              <span className="text-gray-600 mb-0.5">Total Volume</span>
              <span className="font-semibold text-gray-900 border-t border-gray-200 pt-0.5">
                {totalVolume.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}{" "}
                {unit || "BBTUD"}
              </span>
            </div>
            <div className="flex flex-col bg-secondary/10 rounded p-1.5 border border-secondary/20">
              <span className="text-primary/80 mb-0.5">Total Flowrate</span>
              <span className="font-semibold text-primary border-t border-secondary/20 pt-0.5">
                {totalFlowrate.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}{" "}
                MMSCFD
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function RealtimeChart({
  chartFlowData,
  filtersData,
  contractData,
  isLoading,
  isContractLoading,
  onPeriodChange,
  onFilterByChange,
  onPemasokChange,
  onPembangkitChange,
  onDateRangeChange,
}: RealtimeChartProps = {}) {
  const [periode, setPeriode] = useState<Periode>("1D");
  const [interval, setInterval] = useState<Granularity>("hour");
  const [filterType, setFilterType] = useState<string | null>("Pemasok");
  const [pemasok, setPemasok] = useState<string[]>(["Semua Pemasok"]);
  const [pembangkit, setPembangkit] = useState<string | null>(null);
  const [transportir, setTransportir] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [note, setNote] = useState("");
  const [selectedPemasokId, setSelectedPemasokId] = useState<
    string | undefined
  >(undefined);
  const [selectedPembangkitId, setSelectedPembangkitId] = useState<
    string | undefined
  >(undefined);
  const [topLineActive, setTopLineActive] = useState<boolean | null>(true);
  const [jphLineActive, setJphLineActive] = useState(true);
  const [meanLineActive, setMeanLineActive] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(
    null,
  );
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [formattedStartDate, setFormattedStartDate] = useState<string | null>(
    null,
  );
  const [formattedEndDate, setFormattedEndDate] = useState<string | null>(null);

  // Collect all relevant site IDs from the chart series for client-side filtering
  const chartSiteIds = useMemo(() => {
    const ids = new Set<string>();
    if (chartFlowData?.series?.length) {
      chartFlowData.series.forEach((s) => {
        if (s.siteId) ids.add(s.siteId);
      });
    }
    if (selectedPembangkitId)
      selectedPembangkitId.split(",").forEach((id) => ids.add(id));
    if (selectedPemasokId)
      selectedPemasokId.split(",").forEach((id) => ids.add(id));
    return ids;
  }, [chartFlowData, selectedPembangkitId, selectedPemasokId]);

  const nameToSiteId = useMemo(() => {
    const map = new Map<string, string>();
    if (chartFlowData?.series) {
      chartFlowData.series.forEach((s) => {
        if (s.siteId) map.set(s.name, s.siteId);
      });
    }
    return map;
  }, [chartFlowData]);

  // Fetch events for the chart range — do NOT pass siteId to avoid 400 error with multiple IDs
  const { data: eventsData } = useEvents(
    startDate ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate || new Date().toISOString().split("T")[0],
    100,
  );

  // Map events to timestamps for quick lookup, filtering by relevant site IDs
  const pointsWithNotes = useMemo(() => {
    const set = new Set<string>();
    if (!eventsData?.events) return set;

    const siteIdToName = new Map<string, string>();
    if (chartFlowData?.series) {
      chartFlowData.series.forEach((s) => {
        if (s.siteId) siteIdToName.set(s.siteId, s.name);
      });
    }

    eventsData.events
      .filter(
        (event) => chartSiteIds.size === 0 || chartSiteIds.has(event.siteId),
      )
      .forEach((event) => {
        const seriesName = siteIdToName.get(event.siteId);
        const d = new Date(event.occurredAt);
        let key = "";
        if (periode === "1D" || interval === "hour") {
          key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}`;
        } else {
          key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        }
        if (seriesName) {
          set.add(`${seriesName}_${key}`);
        } else {
          set.add(key); // Fallback
        }
      });
    // console.log("[DEBUG] pointsWithNotes keys:", Array.from(set));
    // console.log("[DEBUG] eventsData count:", eventsData?.events?.length, "period:", period, "chartSiteIds:", Array.from(chartSiteIds));
    return set;
  }, [eventsData, periode, interval, chartSiteIds, chartFlowData]);

  const today = new Date();

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(today);

  useEffect(() => {
    if (startDate && endDate) {
      onDateRangeChange?.(startDate, endDate);
    }

    const dateStart = startDate ? new Date(startDate) : new Date();
    const dateEnd = endDate ? new Date(endDate) : new Date();

    const formattedStartDate = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(isNaN(dateStart.getTime()) ? new Date() : dateStart);

    const formattedEndDate = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(isNaN(dateEnd.getTime()) ? new Date() : dateEnd);

    setFormattedStartDate(formattedStartDate);
    setFormattedEndDate(formattedEndDate);
  }, [startDate, endDate, onDateRangeChange]);

  // Derive filter options from API data or fallback to hardcoded
  const pemasokOptions = useMemo(() => {
    let opts = ["Pemasok A", "Pemasok B"];
    if (filtersData?.pemasok) {
      opts = filtersData.pemasok
        .filter(
          (p: FilterOption) =>
            p.commodity?.toUpperCase() === "LNG" ||
            p.commodity?.toUpperCase() === "GAS PIPA",
        )
        .map((p: FilterOption) => p.name);
    }
    return ["Semua Pemasok", ...opts];
  }, [filtersData]);

  const pembangkitOptions = useMemo(() => {
    if (filtersData?.pembangkit)
      return filtersData.pembangkit
        .filter(
          (p: FilterOption) =>
            p.commodity?.toUpperCase() === "LNG" ||
            p.commodity?.toUpperCase() === "GAS PIPA",
        )
        .map((p: FilterOption) => p.name);
    return ["Pembangkit 1", "Pembangkit 2"];
  }, [filtersData]);

  const transportirOptions = useMemo(() => {
    if (filtersData?.transportir)
      return filtersData.transportir.map((t: FilterOption) => t.name);
    return ["Transportir X", "Transportir Y"];
  }, [filtersData]);

  // Transform API chart flow data into component's ChartItem format
  const apiChartData: ChartItem[] = useMemo(() => {
    if (!chartFlowData?.series?.length) return [];

    // Helper to format a raw timestamp string into a display label
    const formatTimestamp = (raw: string): string => {
      if (chartFlowData.granularity === "hour") {
        const d = new Date(raw);
        return `${d.getHours().toString().padStart(2, "0")}.00`;
      }
      if (chartFlowData.granularity === "day") {
        const d = new Date(raw);
        return d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      if (chartFlowData.granularity === "year") {
        // Handle both "2023" and "2023-01-01" formats
        return raw.length >= 4 ? raw.slice(0, 4) : raw;
      }
      // month — include year when spanning multiple years (e.g. 3Y periode)
      const d = new Date(raw + "-01");
      const monthShort = d.toLocaleDateString("id-ID", { month: "short" });
      const year = d.getFullYear();
      return `${monthShort} ${year}`;
    };

    // Collect ALL unique timestamps from ALL series
    const timestampSet = new Set<string>();
    chartFlowData.series.forEach((series) => {
      series.dataPoints.forEach((dp) => {
        timestampSet.add(dp.timestamp);
      });
    });

    // Sort timestamps chronologically
    const sortedTimestamps = Array.from(timestampSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    // Build a lookup map for each series: timestamp -> { value, flowrate }
    const seriesLookups = chartFlowData.series.map((series) => {
      const lookup = new Map<string, { value: number; flowrate: number }>();
      series.dataPoints.forEach((dp) => {
        lookup.set(dp.timestamp, {
          value: dp.value,
          flowrate: dp.flowrate || 0,
        });
      });
      return { name: series.name, lookup };
    });

    return sortedTimestamps.map((rawTs) => {
      let label = formatTimestamp(rawTs);
      let monthStr = "";
      let yearStr = "";

      const d = new Date(rawTs + (rawTs.length === 7 ? "-01" : ""));
      if (!isNaN(d.getTime())) {
        monthStr = d.toLocaleDateString("id-ID", { month: "short" });
        yearStr = d.getFullYear().toString();
        // If it's month granularity, we might want to just show the month name as label
        if (chartFlowData.granularity === "month") {
          label = monthStr;
        }
      }

      const values: Record<string, number> = {};
      const flowrates: Record<string, number> = {};
      seriesLookups.forEach(({ name, lookup }) => {
        const data = lookup.get(rawTs);
        if (data !== undefined) {
          values[name] = data.value;
          flowrates[name] = data.flowrate;
        }
      });
      return {
        label,
        values,
        flowrates,
        rawTimestamp: rawTs,
        monthStr,
        yearStr,
      };
    });
  }, [chartFlowData]);

  // Calculate mean values from API data
  const apiMeanValues: Record<string, number | null> = useMemo(() => {
    if (!chartFlowData?.series?.length) return {};
    const means: Record<string, number | null> = {};
    chartFlowData.series.forEach((series) => {
      const total = series.dataPoints.reduce((sum, dp) => sum + dp.value, 0);
      means[series.name] = total / (series.dataPoints.length || 1);
    });
    // Use mean from referenceLines if available
    if (
      chartFlowData?.referenceLines?.mean !== null &&
      chartFlowData?.referenceLines?.mean !== undefined
    ) {
      // If there's only one series, use the mean from referenceLines
      if (chartFlowData.series.length === 1) {
        means[chartFlowData.series[0].name] = chartFlowData.referenceLines.mean;
      }
    }
    return means;
  }, [chartFlowData]);

  // Use API data if available, otherwise keep fallback for backward compatibility
  const [fallbackChartData, setFallbackChartData] =
    useState<ChartItem[]>(dataJamA);
  const chartData = apiChartData;
  const meanValues =
    Object.keys(apiMeanValues).length > 0 ? apiMeanValues : dataJamAMean;

  const seriesColors: Record<string, string> = useMemo(() => {
    if (!chartFlowData?.series?.length) return COLORS;
    const colors: Record<string, string> = {};
    chartFlowData.series.forEach((s, i) => {
      colors[s.name] = DYNAMIC_COLORS[i % DYNAMIC_COLORS.length];
      colors[`Mean ${s.name}`] = DYNAMIC_COLORS[i % DYNAMIC_COLORS.length];
    });
    return colors;
  }, [chartFlowData]);

  // Reference line values from API
  const jphValue = chartFlowData?.referenceLines?.jph ?? null;
  const topValue = chartFlowData?.referenceLines?.top ?? null;

  // Unit from API
  const unit = chartFlowData?.unit;

  // Compute Y-axis domain using IQR-based outlier handling
  // so one extreme value doesn't squish all other data points
  const yDomain = useMemo(() => {
    if (!chartData.length) return [0, 100];
    const allValues: number[] = [];
    chartData.forEach((item) => {
      Object.values(item.values).forEach((v) => {
        if (typeof v === "number" && isFinite(v)) allValues.push(v);
      });
    });
    if (allValues.length === 0) return [0, 100];

    allValues.sort((a, b) => a - b);
    const q1 = allValues[Math.floor(allValues.length * 0.25)];
    const q3 = allValues[Math.floor(allValues.length * 0.75)];
    const iqr = q3 - q1;

    // Use IQR fences as the visual domain — outliers beyond these
    // will still render (allowDataOverflow=false on YAxis) but the
    // axis range focuses on the "normal" spread of data.
    const rawMin = allValues[0];
    const rawMax = allValues[allValues.length - 1];

    // Only apply outlier clipping when the spread is large enough
    // to actually cause a readability problem (ratio > 3x).
    const spread = rawMax - rawMin;
    const useIqr = iqr > 0 && spread / iqr > 3;

    let domainMin: number;
    let domainMax: number;

    if (useIqr) {
      domainMin = Math.max(rawMin, q1 - 1.5 * iqr);
      domainMax = Math.min(rawMax, q3 + 1.5 * iqr);
      // Ensure we don't clip too aggressively — keep at least 80% of values visible
      const withinFence = allValues.filter(
        (v) => v >= domainMin && v <= domainMax,
      );
      if (withinFence.length < allValues.length * 0.8) {
        domainMin = rawMin;
        domainMax = rawMax;
      }
    } else {
      domainMin = rawMin;
      domainMax = rawMax;
    }

    const padding = (domainMax - domainMin) * 0.12 || 5;
    return [Math.floor(domainMin - padding), Math.ceil(domainMax + padding)];
  }, [chartData]);

  // Determine dynamic chart height — taller for more series
  const seriesKeys = useMemo(() => {
    if (!chartData.length) return [];
    return Array.from(new Set(chartData.flatMap((d) => Object.keys(d.values))));
  }, [chartData]);

  const chartHeight = useMemo(() => {
    const BASE = 300;
    let extra = 0;

    // Add height when there's a large value gap between series
    if (chartData.length > 0) {
      const allValues: number[] = [];
      chartData.forEach((item) => {
        Object.values(item.values).forEach((v) => {
          if (typeof v === "number" && isFinite(v)) allValues.push(v);
        });
      });
      if (allValues.length > 1) {
        allValues.sort((a, b) => a - b);
        const min = allValues[0];
        const max = allValues[allValues.length - 1];
        const median = allValues[Math.floor(allValues.length / 2)];
        const ratio = median > 0 ? max / median : 1;
        // If the biggest value is >5x the median, chart needs more room
        if (ratio > 5) extra += Math.min(120, Math.round(ratio * 8));
        else if (ratio > 2) extra += Math.min(60, Math.round(ratio * 10));
      }
    }

    // Add height for many series (above 4)
    if (seriesKeys.length > 4) {
      extra += Math.min(80, (seriesKeys.length - 4) * 15);
    }

    return Math.min(BASE + extra, 500);
  }, [chartData, seriesKeys]);

  // Format large Y-axis tick values
  const formatYTick = useCallback((value: number) => {
    if (Math.abs(value) >= 1_000_000)
      return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  }, []);

  const submitNote = () => { };

  if (topLineActive === null) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-secondary" size={40} />
          <p className="text-gray-500">Memuat data grafik...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:divide-x divide-gray-200">
      {pemasok || pembangkit ? (
        <div className="lg:col-span-9 lg:pr-6">
          <div>
            <div className="flex justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Grafik Penyaluran Gas -{" "}
                {filterType === "Pembangkit" ? (
                  <>
                    {pembangkit ?? ""}
                    {pemasok && pemasok.length > 0 && (
                      <>
                        {" "}
                        Dari{" "}
                        {Array.isArray(pemasok) ? pemasok.join(", ") : pemasok}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {Array.isArray(pemasok) ? pemasok.join(", ") : pemasok}
                    {pembangkit && <> Ke {pembangkit}</>}
                  </>
                )}
              </h3>
              <div>
                <p className="text-gray-700 font-bold">
                  {formattedStartDate}{" "}
                  {formattedEndDate
                    ? formattedEndDate == formattedStartDate
                      ? ""
                      : ` - ${formattedEndDate}`
                    : ""}
                </p>
              </div>
            </div>
            {chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 5, bottom: chartFlowData?.granularity === "month" && periode === "3Y" ? 30 : 10 }}
                  >
                    <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                    <XAxis
                      dataKey="label"
                      tick={
                        <CustomXAxisTick
                          chartData={chartData}
                          period={period}
                          intervalMode={intervalMode}
                        />
                      }
                      interval={
                        period === "3Y" && intervalMode === "Bulan"
                          ? 0
                          : "preserveStartEnd"
                      }
                      height={
                        period === "3Y" && intervalMode === "Bulan" ? 50 : 30
                      }
                    />
                    <YAxis
                      domain={yDomain}
                      tickFormatter={formatYTick}
                      tick={{ fontSize: 11 }}
                      width={65}
                    />
                    <Tooltip content={<CustomTooltip unit={unit} />} />
                    {chartData.length > 0 &&
                      Array.from(
                        new Set(
                          chartData.flatMap((d) => Object.keys(d.values)),
                        ),
                      ).map((key: string) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={`values.${key}`}
                          name={key.toUpperCase()}
                          stroke={seriesColors[key] || COLORS[key] || "#999"}
                          strokeWidth={2}
                          dot={(props: any) => {
                            const { cx, cy, payload, value, index } = props;
                            const rawTs = payload.rawTimestamp;
                            let hasNote = false;

                            if (rawTs) {
                              const d = new Date(rawTs);
                              let pointKey = "";
                              if (periode === "1D" || interval === "hour") {
                                pointKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}`;
                              } else {
                                pointKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                              }
                              hasNote =
                                pointsWithNotes.has(`${key}_${pointKey}`) ||
                                pointsWithNotes.has(pointKey);
                              if (index === 0) {
                                // console.log("[DEBUG DOT] rawTs:", rawTs, "pointKey:", pointKey, "hasNote:", hasNote, "setSize:", pointsWithNotes.size);
                              }
                            }

                            return (
                              <g key={`dot-group-${key}-${index}`}>
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={20}
                                  fill="transparent"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    setSelectedPoint({
                                      label: payload.label,
                                      series: key,
                                      value,
                                      rawTimestamp: payload.rawTimestamp,
                                      siteId: nameToSiteId.get(key),
                                    });

                                    setOpenModal(true);
                                  }}
                                />
                                {hasNote && (
                                  <g
                                    transform={`translate(${cx - 8}, ${cy - 8})`}
                                  >
                                    <AlertTriangle
                                      size={16}
                                      className="text-orange-500 fill-orange-50"
                                    />
                                  </g>
                                )}
                              </g>
                            );
                          }}
                        />
                      ))}

                    {meanLineActive &&
                      Object.keys(meanValues)
                        .filter((key) => {
                          if (!pembangkit) return true;

                          return key
                            .toLowerCase()
                            .includes(pembangkit.toLowerCase());
                        })
                        .filter((key) => meanValues[key] !== null)
                        .map((key) => (
                          <ReferenceLine
                            key={`mean-${key}`}
                            y={meanValues[key]!}
                            stroke={
                              seriesColors[`Mean ${key}`] ||
                              COLORS[`Mean ${key}`] ||
                              "#999"
                            }
                            strokeDasharray="6 6"
                            label={`Mean ${key}`}
                          />
                        ))}
                    {/* Garis JPH */}
                    {jphLineActive && jphValue !== null && (
                      <ReferenceLine
                        y={jphValue}
                        stroke={"#008BFF"}
                        label={`JPH`}
                      />
                    )}

                    {/* Garis TOP */}
                    {topLineActive && topValue !== null && (
                      <ReferenceLine
                        y={topValue}
                        stroke={"#08CB00"}
                        label={`TOP`}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
                {/* Custom scrollable legend — placed below chart */}
                {seriesKeys.length > 0 && (
                  <div className="mt-3">
                    <div
                      className={`flex flex-wrap justify-center gap-x-5 gap-y-2 px-3 py-2.5 rounded-lg bg-gray-50/80 border border-gray-100 ${seriesKeys.length > 10
                        ? "max-h-[80px] overflow-y-auto"
                        : ""
                        }`}
                    >
                      {seriesKeys.map((key) => (
                        <div
                          key={key}
                          className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap"
                        >
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                seriesColors[key] || COLORS[key] || "#999",
                            }}
                          />
                          <span
                            className="truncate max-w-[160px]"
                            title={key.toUpperCase()}
                          >
                            {key.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                    {seriesKeys.length > 10 && (
                      <p className="text-[10px] text-gray-400 mt-1 text-right pr-1">
                        Scroll untuk melihat semua series
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-center items-center w-full h-[300px] text-gray-500 text-xl font-semibold">
                Data chart belum tersedia
              </div>
            )}
            {/* <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
            Visualisasi data realtime perbandingan pemasok dan pembangkit harian
            24 jam
          </p> */}
          </div>
          <div className=" mt-4 border-t border-gray-200 pt-6">
            <SupplierResumeTable
              contracts={contractData}
              isLoading={isContractLoading}
            />
          </div>
          <div className=" mt-4 border-t border-gray-200 pt-6">
            <NoteSection
              pemasokId={selectedPemasokId}
              pembangkitId={selectedPembangkitId}
            />
          </div>
        </div>
      ) : (
        <div className="lg:col-span-9 lg:pr-6">
          <div className="flex flex-col justify-center items-center text-center h-[400px] gap-4">
            {/* Decorative icon with subtle background */}
            <div className="relative">
              <div className="absolute inset-0 bg-secondary/10 rounded-full blur-xl scale-150" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-secondary/20 to-primary/10 rounded-2xl flex items-center justify-center border border-secondary/20">
                <Info className="w-10 h-10 text-secondary" />
              </div>
            </div>

            {/* Main message */}
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-semibold text-gray-800">
                Pilih {filterType === "Pemasok" ? "Pemasok" : "Pembangkit"}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Silakan pilih{" "}
                <span className="font-medium text-primary">
                  {filterType === "Pemasok" ? "Pemasok" : "Pembangkit"}
                </span>{" "}
                pada panel filter di samping kanan untuk menampilkan grafik
                penyaluran gas.
              </p>
            </div>

            {/* Arrow hint */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400 mt-2">
              <span>Panel filter tersedia di sebelah kanan</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Filter Button */}
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-gradient-to-r from-primary to-secondary text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        {filterOpen ? <X size={22} /> : <Filter size={22} />}
      </button>

      {/* Filter Panel - Desktop always visible, Mobile as overlay */}
      <div
        className={`
        lg:col-span-3 lg:pl-6 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-200
        fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-auto
        bg-white lg:bg-transparent
        transform transition-transform duration-300 ease-in-out
        ${filterOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        lg:block overflow-y-auto
      `}
      >
        {/* Mobile Filter Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <p className="text-lg font-semibold text-gray-900">Filter Grafik</p>
          <button
            onClick={() => setFilterOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-4 lg:p-0">
          <p className="hidden lg:block text-lg font-semibold text-gray-900 mb-6">
            Filter Grafik
          </p>
          <div className="flex flex-col gap-3">
            <FilterAutocomplete
              label="Filter Berdasar"
              options={filterTypeOptions}
              value={filterType}
              onChange={(val) => {
                setFilterType(val);
                onFilterByChange?.(val as FilterBy | null);
              }}
              placeholder="Pilih Filter"
            />
            {filterType == "Pemasok" && (
              <FilterAutocomplete
                multiple
                label="Pemasok"
                options={pemasokOptions}
                value={pemasok}
                onChange={(val) => {
                  let selectedArr = (val as string[]) || [];
                  if (
                    selectedArr.includes("Semua Pemasok") &&
                    !pemasok.includes("Semua Pemasok")
                  ) {
                    selectedArr = ["Semua Pemasok"];
                  } else if (
                    selectedArr.includes("Semua Pemasok") &&
                    selectedArr.length > 1
                  ) {
                    selectedArr = selectedArr.filter(
                      (v) => v !== "Semua Pemasok",
                    );
                  }
                  if (selectedArr.length === 0) {
                    selectedArr = ["Semua Pemasok"];
                  }

                  setPemasok(selectedArr);
                  if (onPemasokChange) {
                    if (selectedArr.includes("Semua Pemasok")) {
                      onPemasokChange(null);
                      setSelectedPemasokId(undefined);
                    } else {
                      const ids = selectedArr
                        .map((name) => {
                          const found = filtersData?.pemasok?.find(
                            (p: FilterOption) => p.name === name,
                          );
                          return found?.id;
                        })
                        .filter(Boolean);
                      const joinedIds =
                        ids.length > 0 ? (ids.join(",") as string) : null;
                      onPemasokChange(joinedIds);
                      setSelectedPemasokId(joinedIds || undefined);
                    }
                  }
                }}
                placeholder="Pilih Pemasok"
              />
            )}
            {(filterType == "Pembangkit" || pemasok) && (
              <FilterAutocomplete
                label="Pembangkit"
                options={pembangkitOptions}
                value={pembangkit}
                onChange={(val) => {
                  setPembangkit(val);
                  if (onPembangkitChange) {
                    const found = filtersData?.pembangkit?.find(
                      (p: FilterOption) => p.name === val,
                    );
                    setSelectedPembangkitId(found?.id ?? undefined);
                    onPembangkitChange(found?.id ?? null);
                  }
                }}
                placeholder="Pilih Pembangkit"
              />
            )}
            {pembangkit &&
              (!pemasok ||
                pemasok.length === 0 ||
                filterType == "Pembangkit") && (
                <FilterAutocomplete
                  multiple
                  label="Pemasok"
                  options={pemasokOptions}
                  value={pemasok}
                  onChange={(val) => {
                    let selectedArr = (val as string[]) || [];
                    if (
                      selectedArr.includes("Semua Pemasok") &&
                      !pemasok.includes("Semua Pemasok")
                    ) {
                      selectedArr = ["Semua Pemasok"];
                    } else if (
                      selectedArr.includes("Semua Pemasok") &&
                      selectedArr.length > 1
                    ) {
                      selectedArr = selectedArr.filter(
                        (v) => v !== "Semua Pemasok",
                      );
                    }
                    if (selectedArr.length === 0) {
                      selectedArr = ["Semua Pemasok"];
                    }

                    setPemasok(selectedArr);
                    if (onPemasokChange) {
                      if (selectedArr.includes("Semua Pemasok")) {
                        onPemasokChange(null);
                        setSelectedPemasokId(undefined);
                      } else {
                        const ids = selectedArr
                          .map((name) => {
                            const found = filtersData?.pemasok?.find(
                              (p: FilterOption) => p.name === name,
                            );
                            return found?.id;
                          })
                          .filter(Boolean);
                        const joinedIds =
                          ids.length > 0 ? (ids.join(",") as string) : null;
                        onPemasokChange(joinedIds);
                        setSelectedPemasokId(joinedIds || undefined);
                      }
                    }
                  }}
                  placeholder="Pilih Pemasok"
                />
              )}
            <div className="mt-2">
              <div className="border border-gray-200 p-3 rounded-lg">
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Periode
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    {
                      label: "1 Hari",
                      val: "1D",
                      apiPeriod: "hour",
                      interval: "Jam",
                    },
                    {
                      label: "1 Minggu",
                      val: "1W",
                      apiPeriod: "day",
                      interval: "Hari",
                    },
                    {
                      label: "1 Bulan",
                      val: "1M",
                      apiPeriod: "one_month",
                      interval: "Hari",
                    },
                    {
                      label: "1 Tahun",
                      val: "1Y",
                      apiPeriod: "one_year",
                      interval: "Bulan",
                    },
                    {
                      label: "3 Tahun",
                      val: "3Y",
                      apiPeriod: "three_year",
                      interval: "Tahun",
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors text-center ${period === item.val
                          ? "bg-primary text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      onClick={() => {
                        setPeriod(item.val);
                        // Sensible default interval based on period
                        setIntervalMode(item.interval as any);

                        if (onPeriodChange)
                          onPeriodChange(item.apiPeriod as Granularity);
                        else {
                          if (pemasok?.includes("Pemasok A"))
                            setFallbackChartData(
                              item.val === "1D"
                                ? dataJamA
                                : item.val === "1W"
                                  ? data1MingguA
                                  : item.val === "1M"
                                    ? data3BulanA
                                    : item.val === "1Y"
                                      ? data1TahunA
                                      : data3TahunA,
                            );
                          if (pemasok?.includes("Pemasok B"))
                            setFallbackChartData(
                              item.val === "1D"
                                ? dataJamB
                                : item.val === "1W"
                                  ? data1MingguB
                                  : item.val === "1M"
                                    ? data3BulanB
                                    : item.val === "1Y"
                                      ? data1TahunB
                                      : data3TahunB,
                            );
                        }
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Interval
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(["Tahun", "Bulan", "Hari", "Jam"] as const).map((mode) => {
                    // Hide invalid intervals based on selected period
                    if (period === "1D" && mode !== "Jam") return null;
                    if (period === "1W" && mode === "Tahun") return null;
                    if (period === "1M" && mode === "Tahun") return null;
                    if (period === "1Y" && mode === "Jam") return null;
                    if (period === "3Y" && mode === "Jam") return null;

                    return (
                      <button
                        key={mode}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${intervalMode === mode
                            ? "bg-[#7ec9d4] text-primary shadow-sm"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        onClick={() => {
                          setIntervalMode(mode);
                          if (onPeriodChange) {
                            if (mode === "Jam") onPeriodChange("interval_hour");
                            else if (mode === "Hari")
                              onPeriodChange("interval_day");
                            else if (mode === "Bulan")
                              onPeriodChange("interval_month");
                            else if (mode === "Tahun")
                              onPeriodChange("interval_year");
                          }
                        }}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>

                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  setStartDate={setStartDate}
                  setEndDate={setEndDate}
                  isSingleDate={period === "1D"}
                  mode={period === "3Y" ? "Tahun" : intervalMode}
                />
              </div>
            </div>
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2 mt-2">
                Tampilkan Garis
              </p>
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="text-gray-700 flex justify-between items-center">
                  <p>Rata-rata</p>
                  <div>
                    <Switch
                      checked={meanLineActive}
                      onChange={(e) => setMeanLineActive(e.target.checked)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "var(--theme-secondary)",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          backgroundColor: "var(--theme-secondary)",
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="text-gray-700 flex justify-between items-center">
                  <p>TOP</p>
                  <div>
                    <Switch
                      checked={topLineActive}
                      onChange={(e) => setTopLineActive(e.target.checked)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "var(--theme-secondary)",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          backgroundColor: "var(--theme-secondary)",
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="text-gray-700 flex justify-between items-center">
                  <p>JPH</p>
                  <div>
                    <Switch
                      checked={jphLineActive}
                      onChange={(e) => setJphLineActive(e.target.checked)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "var(--theme-secondary)",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          backgroundColor: "var(--theme-secondary)",
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {filterOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setFilterOpen(false)}
        />
      )}
      {openModal && (
        <ModalNote
          setOpenModal={setOpenModal}
          setNote={setNote}
          supplier={selectedPoint?.series}
          time={selectedPoint?.label}
          date={formattedDate}
          note={note}
          submitNote={submitNote}
          pemasokId={selectedPemasokId}
          pembangkitId={selectedPembangkitId}
          seriesSiteId={selectedPoint?.siteId}
          selectedTimestamp={selectedPoint?.rawTimestamp}
          period={periode}
          interval={interval}
        />
      )}
    </div>
  );
}

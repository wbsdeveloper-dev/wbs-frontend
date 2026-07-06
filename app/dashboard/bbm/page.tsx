"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Loader2,
  BarChart3,
  Download,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
} from "recharts";

// Shared hooks
import { useModal } from "@/app/_hooks";

// Component imports
import FuelTypeDonutChart from "@/app/components/FuelTypeDonutChart";
import TopVolumeList from "@/app/components/TopVolumeList";
import FilterAutocomplete from "@/app/components/FilterAutocomplete";
import EditBbmDataTable from "@/app/components/EditBbmDataTable";
import BbmCompositeChart from "@/app/components/BbmCompositeChart";
import PieChartDetailModal from "@/app/components/PieChartDetailModal";
import DateRangeFilter from "@/app/components/DateRangeFilter";
import NominationAchievementChart from "@/app/components/NominationAchievementChart";
import type { Periode } from "@/app/components/RealtimeChart";

// API services
import {
  useBbmMonthly,
  useTopTbbm,
  useTopPembangkit,
  useRealizationByModa,
} from "@/hooks/service/bbm-api";
import { useSites, type Site } from "@/hooks/service/site-api";
import { useKertasKerjaMaster } from "@/hooks/service/kertas-kerja-api";

// Dynamic map import
const MapBBM = dynamic(() => import("../../components/MapBBM"), { ssr: false });

// Chart view mode type
type ChartMode = "akumulasi" | "realisasi-moda";

// Helper to format date as YYYY-MM-DD in local time
function formatLocalISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Helper to get current month date range
function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: formatLocalISODate(start),
    endDate: formatLocalISODate(end),
  };
}

// Helper to get current year start date
function getCurrentYearStart() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return formatLocalISODate(start);
}

// ---------------------------------------------------------------------------

const EmptyChartState = ({ type }: { type: "supplier" | "plant" }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
      <BarChart3 className="text-secondary" size={24} />
    </div>
    <h4 className="text-sm font-semibold text-gray-900 mb-1">
      {type === "supplier" ? "Pilih Pemasok" : "Pilih Pembangkit"}
    </h4>
    <p className="text-xs text-gray-500 max-w-[280px]">
      Silakan pilih {type === "supplier" ? "Pemasok (TBBM)" : "Pembangkit"}{" "}
      terlebih dahulu pada panel filter untuk menampilkan visualisasi data
      grafik.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Custom Tooltip for Grafik Akumulasi
// ---------------------------------------------------------------------------

const CustomRoundedTopBar = (props: any) => {
  const { x, y, width, height, fill, payload, dataKey, productOptions } = props;

  if (!height || height === 0) return null;

  const metric = dataKey.split("_")[1];
  let isTop = false;

  for (let i = productOptions.length - 1; i >= 0; i--) {
    const prod = productOptions[i];
    const val = payload[`${prod}_${metric}`];
    if (val && val > 0) {
      if (`${prod}_${metric}` === dataKey) {
        isTop = true;
      }
      break;
    }
  }

  const radius: [number, number, number, number] = isTop
    ? [6, 6, 0, 0]
    : [0, 0, 0, 0];

  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      radius={radius}
    />
  );
};

const CustomXAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={15} fontSize={9} textAnchor="middle" fill="#9ca3af">
        Nominasi | Penyaluran | Penerimaan | Pemakaian
      </text>
      <text
        x={0}
        y={32}
        fontSize={11}
        textAnchor="middle"
        fill="#6b7280"
        className="font-medium"
      >
        {payload.value}
      </text>
    </g>
  );
};

const getProductColor = (product: string) => {
  const colors: Record<string, string> = {
    HSD: "#3b82f6", // blue
    B35: "#10b981", // emerald
    B30: "#84cc16", // lime
    B40: "#22c55e", // green
    LSFO: "#f59e0b", // amber
    HSFO: "#f97316", // orange
    IDO: "#8b5cf6", // purple
  };
  return colors[product.toUpperCase()] || "#6b7280";
};

interface AccumulationTooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
  payload: any;
}

function AccumulationTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: AccumulationTooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 px-4 py-3 text-sm min-w-[300px]">
      <p className="font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">
        {label}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Nominasi */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1">Nominasi</p>
          <div className="space-y-1">
            {Object.keys(data)
              .filter((k) => k.endsWith("_nominasi") && data[k] > 0)
              .map((k) => {
                const product = k.replace("_nominasi", "");
                return (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getProductColor(product) }}
                      />
                      <span className="text-gray-600">{product}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {data[k].toLocaleString("id-ID", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                );
              })}
            <div className="pt-1 mt-1 border-t border-gray-100 flex justify-between text-xs font-bold text-gray-800">
              <span>Total</span>
              <span>
                {data.nominasi.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}{" "}
                KL
              </span>
            </div>
          </div>
        </div>

        {/* Penyaluran */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1">Penyaluran</p>
          <div className="space-y-1">
            {Object.keys(data)
              .filter((k) => k.endsWith("_realisasi") && data[k] > 0)
              .map((k) => {
                const product = k.replace("_realisasi", "");
                return (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getProductColor(product) }}
                      />
                      <span className="text-gray-600">{product}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {data[k].toLocaleString("id-ID", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                );
              })}
            <div className="pt-1 mt-1 border-t border-gray-100 flex justify-between text-xs font-bold text-gray-800">
              <span>Total</span>
              <span>
                {data.realisasi.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}{" "}
                KL
              </span>
            </div>
          </div>
        </div>

        {/* Penerimaan */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1">Penerimaan</p>
          <div className="space-y-1">
            {Object.keys(data)
              .filter((k) => k.endsWith("_penerimaan") && data[k] > 0)
              .map((k) => {
                const product = k.replace("_penerimaan", "");
                return (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getProductColor(product) }}
                      />
                      <span className="text-gray-600">{product}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {data[k].toLocaleString("id-ID", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                );
              })}
            <div className="pt-1 mt-1 border-t border-gray-100 flex justify-between text-xs font-bold text-gray-800">
              <span>Total</span>
              <span>
                {data.penerimaan.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}{" "}
                KL
              </span>
            </div>
          </div>
        </div>

        {/* Pemakaian */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1">Pemakaian</p>
          <div className="space-y-1">
            {Object.keys(data)
              .filter((k) => k.endsWith("_pemakaian") && data[k] > 0)
              .map((k) => {
                const product = k.replace("_pemakaian", "");
                return (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getProductColor(product) }}
                      />
                      <span className="text-gray-600">{product}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {data[k].toLocaleString("id-ID", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                );
              })}
            <div className="pt-1 mt-1 border-t border-gray-100 flex justify-between text-xs font-bold text-gray-800">
              <span>Total</span>
              <span>
                {data.pemakaian.toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })}{" "}
                KL
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function Home() {
  const { isOpen, open, close } = useModal();
  const [filterType, setFilterType] = useState<string | null>("TBBM");
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(chartRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `grafik-bbm-${formatLocalISODate(new Date())}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await htmlToImage.toCanvas(chartRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`grafik-bbm-${formatLocalISODate(new Date())}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF", err);
    }
  };

  // Chart mode toggle
  const [chartMode, setChartMode] = useState<ChartMode>("akumulasi");

  // Date range states
  const { startDate: initialStart, endDate: initialEnd } = useMemo(
    () => getCurrentMonthRange(),
    [],
  );
  const initialYearStart = useMemo(() => getCurrentYearStart(), []);

  const [distributionStartDate, setDistributionStartDate] =
    useState(initialStart);
  const [distributionEndDate, setDistributionEndDate] = useState(initialEnd);

  const [nominationStartDate, setNominationStartDate] = useState(initialStart);
  const [nominationEndDate, setNominationEndDate] = useState(initialEnd);

  const [topSuppliersStart, setTopSuppliersStart] = useState(initialStart);
  const [topSuppliersEnd, setTopSuppliersEnd] = useState(initialEnd);
  const [topSuppliersProduct, setTopSuppliersProduct] = useState<string | null>(
    null,
  );
  const [topSuppliersModa, setTopSuppliersModa] = useState<string | null>(null);

  const [topPlantsStart, setTopPlantsStart] = useState(initialStart);
  const [topPlantsEnd, setTopPlantsEnd] = useState(initialEnd);
  const [topPlantsProduct, setTopPlantsProduct] = useState<string | null>(null);
  const [topPlantsModa, setTopPlantsModa] = useState<string | null>(null);

  // Filter Grafik states
  const [graphicRegion, setGraphicRegion] = useState<string | null>(null);
  const [graphicUnit, setGraphicUnit] = useState<string | null>(null);
  const [graphicUpk, setGraphicUpk] = useState<string | null>(null);
  const [graphicKit, setGraphicKit] = useState<string | null>(null);
  const [graphicSupplier, setGraphicSupplier] = useState<string | null>(null);
  const [graphicPlant, setGraphicPlant] = useState<string | null>(null);
  const [graphicStart, setGraphicStart] = useState<string>(initialStart);
  const [graphicEnd, setGraphicEnd] = useState<string>(initialEnd);
  const [graphicProduct, setGraphicProduct] = useState<string | null>(null);
  const [graphicModa, setGraphicModa] = useState<string | null>(null);

  type GraphicXAxisMode =
    | "Waktu"
    | "Pembangkit"
    | "Pemasok"
    | "Jenis KIT"
    | "Instansi/Unit"
    | "UPK"
    | "Region"
    | "Moda Transportasi";
  const [graphicXAxisMode, setGraphicXAxisMode] =
    useState<GraphicXAxisMode>("Waktu");

  // Interval and Period for Realisasi per Moda
  const [graphicPeriod, setGraphicPeriod] = useState<Periode>("1M");
  const [graphicIntervalMode, setGraphicIntervalMode] = useState<
    "Hari" | "Bulan" | "Tahun"
  >("Hari");

  // 2. Fetch Top 5 TBBM Performer List
  const { data: topTbbmData = [] } = useTopTbbm({
    startDate: topSuppliersStart,
    endDate: topSuppliersEnd,
    product: topSuppliersProduct || undefined,
    moda: topSuppliersModa || undefined,
  });

  const topSuppliersList = useMemo(() => {
    return topTbbmData.map((item) => ({
      name: item.name,
      volume: item.totalVolume,
    }));
  }, [topTbbmData]);

  // 3. Fetch Top 5 Pembangkit Performer List
  const { data: topPembangkitData = [] } = useTopPembangkit({
    startDate: topPlantsStart,
    endDate: topPlantsEnd,
    product: topPlantsProduct || undefined,
    moda: topPlantsModa || undefined,
  });

  const topPembangkitList = useMemo(() => {
    return topPembangkitData.map((item) => ({
      name: item.name,
      volume: item.totalVolume,
    }));
  }, [topPembangkitData]);

  // Fetch reports data for bottom table
  const { data: bbmMonthlyData, isLoading: isBbmMonthlyLoading } =
    useBbmMonthly();

  // 1. Card Volume BBM Donut Chart (Real Data)
  const dataPieChart = useMemo(() => {
    if (!bbmMonthlyData) return [];

    const startMonth = distributionStartDate
      ? distributionStartDate.substring(0, 7)
      : null;
    const endMonth = distributionEndDate
      ? distributionEndDate.substring(0, 7)
      : null;

    const filtered = bbmMonthlyData.filter((record) => {
      if (startMonth && record.reportDate < startMonth) return false;
      if (endMonth && record.reportDate > endMonth) return false;
      return true;
    });

    const groups: Record<
      string,
      { value: number; modaRealisasi: Record<string, number> }
    > = {};

    filtered.forEach((record) => {
      // Group by TBBM or Pembangkit based on filterType
      const key =
        filterType === "TBBM"
          ? record.tbbm || "Unknown"
          : record.pembangkit || "Unknown";

      // Always use realization value
      const value = record.realization || 0;
      const moda = record.moda || "Lainnya";

      if (!groups[key]) {
        groups[key] = { value: 0, modaRealisasi: {} };
      }
      groups[key].value += value;

      if (!groups[key].modaRealisasi[moda]) {
        groups[key].modaRealisasi[moda] = 0;
      }
      groups[key].modaRealisasi[moda] += value;
    });

    return Object.entries(groups)
      .map(([name, data]) => ({
        name,
        value: data.value,
        modaRealisasi: data.modaRealisasi,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value); // Sort descending
  }, [bbmMonthlyData, filterType, distributionStartDate, distributionEndDate]);

  // Data for Pencapaian Nominasi
  const nominationData = useMemo(() => {
    if (!bbmMonthlyData) return { nominasi: 0, realisasi: 0, pemakaian: 0 };

    const startMonth = nominationStartDate
      ? nominationStartDate.substring(0, 7)
      : null;
    const endMonth = nominationEndDate
      ? nominationEndDate.substring(0, 7)
      : null;

    let nominasi = 0;
    let realisasi = 0;
    let pemakaian = 0;

    const filtered = bbmMonthlyData.filter((record) => {
      if (startMonth && record.reportDate < startMonth) return false;
      if (endMonth && record.reportDate > endMonth) return false;
      return true;
    });

    filtered.forEach((record) => {
      nominasi += record.nomination || 0;
      realisasi += record.realization || 0;
      pemakaian += record.usage || 0;
    });

    return { nominasi, realisasi, pemakaian };
  }, [bbmMonthlyData, nominationStartDate, nominationEndDate]);

  const { data: tbbmData } = useSites({ type: "PEMASOK", commodity: "BBM" });
  const { data: pembangkitData } = useSites({
    type: "PEMBANGKIT",
    commodity: "BBM",
  });

  const { data: masterUnitData } = useKertasKerjaMaster("master_unit");
  const { data: masterUpkData } = useKertasKerjaMaster("master_unit_pelaksana");
  const { data: masterKitData } = useKertasKerjaMaster("master_jenis_kit");
  const { data: masterProductData } = useKertasKerjaMaster(
    "master_product",
    "BBM",
  );

  const filterRegionOptions = useMemo(() => {
    const regions = new Set<string>();
    if (pembangkitData)
      pembangkitData.forEach((p) => {
        if (p.region) regions.add(p.region);
      });
    if (tbbmData)
      tbbmData.forEach((t) => {
        if (t.region) regions.add(t.region);
      });
    return Array.from(regions).sort();
  }, [pembangkitData, tbbmData]);

  const filterSupplierOptions = useMemo(() => {
    if (!tbbmData || !bbmMonthlyData) return [];

    let validTbbms = new Set<string>();

    if (graphicPlant) {
      bbmMonthlyData.forEach((record) => {
        if (record.pembangkit === graphicPlant && record.tbbm) {
          validTbbms.add(record.tbbm);
        }
      });
    } else if (graphicRegion) {
      tbbmData.forEach((t) => {
        if (t.region === graphicRegion) {
          validTbbms.add(t.name);
        }
      });
    } else {
      tbbmData.forEach((t) => validTbbms.add(t.name));
    }

    return Array.from(validTbbms).sort();
  }, [tbbmData, bbmMonthlyData, graphicPlant, graphicRegion]);

  const filterPlantOptions = useMemo(() => {
    if (!pembangkitData) return [];
    let data = pembangkitData;
    if (graphicRegion) data = data.filter((p) => p.region === graphicRegion);

    const selectedUnitId = graphicUnit
      ? masterUnitData?.find((u) => u.name === graphicUnit)?.id
      : null;
    const selectedUpkId = graphicUpk
      ? masterUpkData?.find((u) => u.name === graphicUpk)?.id
      : null;
    const selectedKitId = graphicKit
      ? masterKitData?.find((k) => k.name === graphicKit)?.id
      : null;

    if (selectedUnitId) data = data.filter((p) => p.unit_id === selectedUnitId);
    if (selectedUpkId) data = data.filter((p) => p.upk_id === selectedUpkId);
    if (selectedKitId) data = data.filter((p) => p.kit_id === selectedKitId);

    return Array.from(new Set(data.map((p) => p.name))).sort();
  }, [
    pembangkitData,
    graphicRegion,
    graphicUnit,
    graphicUpk,
    graphicKit,
    masterUnitData,
    masterUpkData,
    masterKitData,
  ]);

  const filterProductOptions = useMemo(() => {
    if (!masterProductData) return [];
    return masterProductData.map((p) => p.name).sort();
  }, [masterProductData]);

  const filterModaOptions = useMemo(() => {
    if (!bbmMonthlyData) return [];
    return Array.from(
      new Set(bbmMonthlyData.map((r) => r.moda).filter(Boolean) as string[]),
    ).sort();
  }, [bbmMonthlyData]);

  const filterUnitOptions = useMemo(() => {
    if (!masterUnitData) return [];
    return masterUnitData.map((u) => u.name).sort();
  }, [masterUnitData]);

  const filterUpkOptions = useMemo(() => {
    if (!masterUpkData) return [];
    return masterUpkData.map((u) => u.name).sort();
  }, [masterUpkData]);

  const filterKitOptions = useMemo(() => {
    if (!masterKitData) return [];
    return masterKitData.map((k) => k.name).sort();
  }, [masterKitData]);

  // 4. Grafik BBM Bar Chart (Real Data)
  const barChartData = useMemo(() => {
    if (!bbmMonthlyData) return [];

    const plantLookup = new Map<string, Site>();
    if (pembangkitData) {
      pembangkitData.forEach((p) => plantLookup.set(p.name, p));
    }
    const selectedUnitId = graphicUnit
      ? masterUnitData?.find((u) => u.name === graphicUnit)?.id
      : null;
    const selectedUpkId = graphicUpk
      ? masterUpkData?.find((u) => u.name === graphicUpk)?.id
      : null;
    const selectedKitId = graphicKit
      ? masterKitData?.find((k) => k.name === graphicKit)?.id
      : null;

    const filtered = bbmMonthlyData.filter((record) => {
      if (graphicRegion) {
        const isSupplierInRegion = filterSupplierOptions.includes(record.tbbm);
        const isPlantInRegion = filterPlantOptions.includes(record.pembangkit);
        if (!isSupplierInRegion && !isPlantInRegion) return false;
      }
      if (selectedUnitId || selectedUpkId || selectedKitId) {
        const plantInfo = plantLookup.get(record.pembangkit);
        if (!plantInfo) return false;
        if (selectedUnitId && plantInfo.unit_id !== selectedUnitId)
          return false;
        if (selectedUpkId && plantInfo.upk_id !== selectedUpkId) return false;
        if (selectedKitId && plantInfo.kit_id !== selectedKitId) return false;
      }
      if (graphicSupplier && record.tbbm !== graphicSupplier) return false;
      if (graphicPlant && record.pembangkit !== graphicPlant) return false;
      if (graphicProduct && record.product !== graphicProduct) return false;
      if (graphicModa && record.moda !== graphicModa) return false;

      const startMonth = graphicStart ? graphicStart.substring(0, 7) : null;
      const endMonth = graphicEnd ? graphicEnd.substring(0, 7) : null;

      if (startMonth && record.reportDate < startMonth) return false;
      if (endMonth && record.reportDate > endMonth) return false;

      return true;
    });

    const monthlyGroups: Record<
      string,
      {
        reportDate: string;
        tbbm: string;
        pembangkit: string;
        product: string;
        jenis_kit: string;
        instansi_unit: string;
        upk: string;
        region: string;
        nominasi: number;
        realisasi: number;
        penerimaan: number;
        pemakaian: number;
        modaRealisasi: Record<string, number>;
      }
    > = {};

    filtered.forEach((record) => {
      const groupKey = `${record.reportDate}|${record.tbbm}|${record.pembangkit}|${record.product}`;
      const moda = record.moda || "Lainnya";
      const realization = record.realization || 0;

      if (!monthlyGroups[groupKey]) {
        monthlyGroups[groupKey] = {
          reportDate: record.reportDate,
          tbbm: record.tbbm || "",
          pembangkit: record.pembangkit || "",
          product: record.product || "",
          jenis_kit: record.jenis_kit || "",
          instansi_unit: record.instansi_unit || "",
          upk: record.upk || "",
          region: record.region || "",
          nominasi: record.nomination || 0,
          realisasi: record.realization || 0,
          penerimaan: record.receipt || 0,
          pemakaian: record.usage || 0,
          modaRealisasi: { [moda]: realization },
        };
      } else {
        monthlyGroups[groupKey].nominasi = Math.max(
          monthlyGroups[groupKey].nominasi,
          record.nomination || 0,
        );
        monthlyGroups[groupKey].realisasi += record.realization || 0;
        monthlyGroups[groupKey].penerimaan = Math.max(
          monthlyGroups[groupKey].penerimaan,
          record.receipt || 0,
        );
        monthlyGroups[groupKey].pemakaian = Math.max(
          monthlyGroups[groupKey].pemakaian,
          record.usage || 0,
        );
        if (!monthlyGroups[groupKey].modaRealisasi[moda]) {
          monthlyGroups[groupKey].modaRealisasi[moda] = 0;
        }
        monthlyGroups[groupKey].modaRealisasi[moda] += realization;
      }
    });

    const chartGroups: Record<
      string,
      {
        name: string;
        supplier: string;
        plant: string;
        nominasi: number;
        realisasi: number;
        penerimaan: number;
        pemakaian: number;
        modaRealisasi: Record<string, number>;
        [key: string]: any;
      }
    > = {};

    if (graphicXAxisMode === "Moda Transportasi") {
      filtered.forEach((record) => {
        const name = record.moda || "Lainnya";
        if (!chartGroups[name]) {
          chartGroups[name] = {
            name,
            supplier: record.tbbm || "",
            plant: record.pembangkit || "",
            nominasi: 0,
            realisasi: 0,
            penerimaan: 0,
            pemakaian: 0,
            modaRealisasi: {},
          };
        }
        chartGroups[name].nominasi += record.nomination || 0;
        chartGroups[name].realisasi += record.realization || 0;
        chartGroups[name].penerimaan += record.receipt || 0;
        chartGroups[name].pemakaian += record.usage || 0;

        const pNom = `${record.product}_nominasi`;
        const pReal = `${record.product}_realisasi`;
        const pPen = `${record.product}_penerimaan`;
        const pPem = `${record.product}_pemakaian`;

        chartGroups[name][pNom] =
          (chartGroups[name][pNom] || 0) + (record.nomination || 0);
        chartGroups[name][pReal] =
          (chartGroups[name][pReal] || 0) + (record.realization || 0);
        chartGroups[name][pPen] =
          (chartGroups[name][pPen] || 0) + (record.receipt || 0);
        chartGroups[name][pPem] =
          (chartGroups[name][pPem] || 0) + (record.usage || 0);
      });
    } else {
      Object.values(monthlyGroups).forEach((record) => {
        let name = "Unknown";
        if (graphicXAxisMode === "Pembangkit") {
          name = record.pembangkit || "Unknown Pembangkit";
        } else if (graphicXAxisMode === "Pemasok") {
          name = record.tbbm || "Unknown Pemasok";
        } else if (graphicXAxisMode === "Jenis KIT") {
          name = record.jenis_kit || "Unknown Jenis KIT";
        } else if (graphicXAxisMode === "Instansi/Unit") {
          name = record.instansi_unit || "Unknown Instansi/Unit";
        } else if (graphicXAxisMode === "UPK") {
          name = record.upk || "Unknown UPK";
        } else if (graphicXAxisMode === "Region") {
          name = record.region || "Unknown Region";
        }

        if (!chartGroups[name]) {
          chartGroups[name] = {
            name,
            supplier: record.tbbm,
            plant: record.pembangkit,
            nominasi: 0,
            realisasi: 0,
            penerimaan: 0,
            pemakaian: 0,
            modaRealisasi: {},
          };
        }

        chartGroups[name].nominasi += record.nominasi;
        chartGroups[name].realisasi += record.realisasi;
        chartGroups[name].penerimaan += record.penerimaan;
        chartGroups[name].pemakaian += record.pemakaian;

        Object.entries(record.modaRealisasi).forEach(([m, val]) => {
          chartGroups[name].modaRealisasi[m] =
            (chartGroups[name].modaRealisasi[m] || 0) + val;
        });

        const pNom = `${record.product}_nominasi`;
        const pReal = `${record.product}_realisasi`;
        const pPen = `${record.product}_penerimaan`;
        const pPem = `${record.product}_pemakaian`;

        chartGroups[name][pNom] =
          (chartGroups[name][pNom] || 0) + record.nominasi;
        chartGroups[name][pReal] =
          (chartGroups[name][pReal] || 0) + record.realisasi;
        chartGroups[name][pPen] =
          (chartGroups[name][pPen] || 0) + record.penerimaan;
        chartGroups[name][pPem] =
          (chartGroups[name][pPem] || 0) + record.pemakaian;
      });
    }

    return Object.values(chartGroups);
  }, [
    bbmMonthlyData,
    graphicXAxisMode,
    graphicSupplier,
    graphicPlant,
    graphicStart,
    graphicEnd,
    graphicRegion,
    graphicProduct,
    graphicModa,
    graphicUnit,
    graphicUpk,
    graphicKit,
    masterUnitData,
    masterUpkData,
    masterKitData,
    pembangkitData,
    filterSupplierOptions,
    filterPlantOptions,
  ]);

  // 5. Composite chart data (realization by moda)
  const { data: realizationByModaData, isLoading: isRealizationByModaLoading } =
    useRealizationByModa(
      {
        startDate: graphicStart,
        endDate: graphicEnd,
        product: graphicProduct || undefined,
        moda: graphicModa || undefined,
        tbbm:
          graphicSupplier ||
          (graphicRegion ? filterSupplierOptions.join(",") : undefined),
        pembangkit:
          graphicPlant ||
          (graphicRegion || graphicUnit || graphicUpk || graphicKit
            ? filterPlantOptions.join(",")
            : undefined),
        interval:
          graphicIntervalMode === "Hari"
            ? "day"
            : graphicIntervalMode === "Bulan"
              ? "month"
              : "year",
        groupBy: graphicXAxisMode === "Waktu" ? "time"
          : graphicXAxisMode === "Jenis KIT" ? "jenis_kit"
          : graphicXAxisMode === "Pembangkit" ? "pembangkit"
          : graphicXAxisMode === "Instansi/Unit" ? "instansi_unit"
          : graphicXAxisMode === "UPK" ? "upk"
          : graphicXAxisMode === "Region" ? "region"
          : graphicXAxisMode === "Moda Transportasi" ? "moda"
          : graphicXAxisMode === "Pemasok" ? "pemasok"
          : "time",
      },
      {
        enabled:
          chartMode === "realisasi-moda"
            ? true
            : !!graphicSupplier || !!graphicPlant,
      },
    );

  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Dashboard BBM
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Dashboard untuk monitoring data realtime BBM dan Pembangkit PLN
                EPI
              </p>
            </div>
          </div>

          {/* Section: Map */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Monitoring BBM PLN EPI
            </h2>
            <MapBBM />
          </div>

          {/* Section: Donut Chart & Top Performers */}
          <div className="flex overflow-x-auto gap-4 mb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
              <FuelTypeDonutChart
                openModalFunction={open}
                data={dataPieChart}
                changeFilterType={setFilterType}
                filterType={filterType}
                startDate={distributionStartDate}
                endDate={distributionEndDate}
                onStartDateChange={setDistributionStartDate}
                onEndDateChange={setDistributionEndDate}
                title="Volume BBM"
                descriptionPrefix="Visualisasi volume BBM"
                tabs={["TBBM", "Pembangkit"]}
              />
            </div>

            <div className="w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
              <NominationAchievementChart
                nominasi={nominationData.nominasi}
                realisasi={nominationData.realisasi}
                pemakaian={nominationData.pemakaian}
                startDate={nominationStartDate}
                endDate={nominationEndDate}
                onStartDateChange={setNominationStartDate}
                onEndDateChange={setNominationEndDate}
              />
            </div>

            <div className="w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
              <TopVolumeList
                title="Top 5 Penyaluran Pembangkit"
                list={topPembangkitList}
                unit="KL"
                description="List top 5 performa pembangkit BBM dengan volume tertinggi"
                startDate={topPlantsStart}
                endDate={topPlantsEnd}
                onStartDateChange={setTopPlantsStart}
                onEndDateChange={setTopPlantsEnd}
                product={topPlantsProduct}
                moda={topPlantsModa}
                onProductChange={setTopPlantsProduct}
                onModaChange={setTopPlantsModa}
                productOptions={filterProductOptions}
                modaOptions={filterModaOptions}
              />
            </div>

            <div className="w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
              <TopVolumeList
                title="Top 5 Penyaluran TBBM"
                list={topSuppliersList}
                unit="KL"
                description="List top 5 performa TBBM dengan volume tertinggi dalam periode tertentu"
                startDate={topSuppliersStart}
                endDate={topSuppliersEnd}
                onStartDateChange={setTopSuppliersStart}
                onEndDateChange={setTopSuppliersEnd}
                product={topSuppliersProduct}
                moda={topSuppliersModa}
                onProductChange={setTopSuppliersProduct}
                onModaChange={setTopSuppliersModa}
                productOptions={filterProductOptions}
                modaOptions={filterModaOptions}
              />
            </div>
          </div>

          {/* Section: Custom Bar Chart & Graphic Filter Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 lg:h-[650px]">
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-6 flex flex-col shadow-sm">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Grafik BBM
                  </h3>

                  <div className="flex items-center gap-3">
                    {/* Export Buttons */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={handleExportImage}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5 transition-all duration-200"
                        title="Export as Image (PNG)"
                      >
                        <ImageIcon size={14} />
                        PNG
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 transition-all duration-200"
                        title="Export as PDF"
                      >
                        <FileText size={14} />
                        PDF
                      </button>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setChartMode("akumulasi")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                          chartMode === "akumulasi"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Grafik Akumulasi
                      </button>
                      <button
                        onClick={() => setChartMode("realisasi-moda")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                          chartMode === "realisasi-moda"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Penyaluran Harian
                      </button>
                    </div>
                  </div>
                </div>
                <p
                  className={`text-xs text-gray-500 ${graphicStart || graphicEnd || graphicRegion || graphicUnit || graphicUpk || graphicKit || graphicPlant || graphicSupplier || graphicProduct || graphicModa ? "mb-3" : "mb-6"}`}
                >
                  {chartMode === "akumulasi"
                    ? "Visualisasi perbandingan Rencana/Nominasi, Penyaluran, dan Pemakaian per Unit Pembangkit"
                    : "Visualisasi Penyaluran volume BBM per moda transportasi"}
                </p>
                {(graphicStart ||
                  graphicEnd ||
                  graphicRegion ||
                  graphicUnit ||
                  graphicUpk ||
                  graphicKit ||
                  graphicPlant ||
                  graphicSupplier ||
                  graphicProduct ||
                  graphicModa) && (
                  <div className="flex flex-wrap gap-1.5 mb-6 max-w-xl">
                    {graphicStart && graphicEnd && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        Periode: {graphicStart} s/d {graphicEnd}
                      </span>
                    )}
                    {graphicRegion && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Region: {graphicRegion}
                      </span>
                    )}
                    {graphicUnit && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Instansi/Unit: {graphicUnit}
                      </span>
                    )}
                    {graphicUpk && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Unit Pelaksana: {graphicUpk}
                      </span>
                    )}
                    {graphicKit && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Jenis Kit: {graphicKit}
                      </span>
                    )}
                    {graphicSupplier && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Pemasok: {graphicSupplier}
                      </span>
                    )}
                    {graphicPlant && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-100">
                        Pembangkit: {graphicPlant}
                      </span>
                    )}
                    {graphicProduct && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        Produk: {graphicProduct}
                      </span>
                    )}
                    {graphicModa && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                        Moda: {graphicModa}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div
                className="w-full flex-1 min-h-0 mt-4 bg-white"
                ref={chartRef}
              >
                {chartMode === "akumulasi" ? (
                  /* ── Existing: Grafik Akumulasi ─────────────── */
                  isBbmMonthlyLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      <Loader2 className="animate-spin mr-2" size={20} />
                      Memuat data grafik...
                    </div>
                  ) : barChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      Tidak ada data laporan yang cocok dengan filter grafik
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f3f4f6"
                        />
                        <XAxis
                          dataKey="name"
                          tick={<CustomXAxisTick />}
                          axisLine={{ stroke: "#e5e7eb" }}
                          tickLine={false}
                          height={50}
                        />
                        <YAxis
                          tick={{ fill: "#6b7280", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => {
                            if (value >= 1000)
                              return `${(value / 1000).toFixed(1).replace(/\\.0$/, "")}k`;
                            return value.toString();
                          }}
                        />
                        <Tooltip content={<AccumulationTooltip />} />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          content={() => (
                            <div className="flex flex-col items-center gap-2 mb-4">
                              <div className="flex justify-center items-center flex-wrap gap-4">
                                {filterProductOptions.map((product) => (
                                  <div
                                    key={product}
                                    className="flex items-center gap-2"
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{
                                        backgroundColor:
                                          getProductColor(product),
                                      }}
                                    />
                                    <span className="text-xs font-medium text-gray-600">
                                      {product}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        />
                        {/* Nominasi */}
                        {filterProductOptions.map((product) => (
                          <Bar
                            key={`${product}_nominasi`}
                            dataKey={`${product}_nominasi`}
                            name={`${product} Nominasi`}
                            fill={getProductColor(product)}
                            stackId="nominasi"
                            maxBarSize={40}
                            shape={(props: any) => (
                              <CustomRoundedTopBar
                                {...props}
                                productOptions={filterProductOptions}
                              />
                            )}
                          />
                        ))}
                        {/* Penyaluran */}
                        {filterProductOptions.map((product) => (
                          <Bar
                            key={`${product}_realisasi`}
                            dataKey={`${product}_realisasi`}
                            name={`${product} Penyaluran`}
                            fill={getProductColor(product)}
                            stackId="realisasi"
                            maxBarSize={40}
                            shape={(props: any) => (
                              <CustomRoundedTopBar
                                {...props}
                                productOptions={filterProductOptions}
                              />
                            )}
                          />
                        ))}
                        {/* Penerimaan */}
                        {filterProductOptions.map((product) => (
                          <Bar
                            key={`${product}_penerimaan`}
                            dataKey={`${product}_penerimaan`}
                            name={`${product} Penerimaan`}
                            fill={getProductColor(product)}
                            stackId="penerimaan"
                            maxBarSize={40}
                            shape={(props: any) => (
                              <CustomRoundedTopBar
                                {...props}
                                productOptions={filterProductOptions}
                              />
                            )}
                          />
                        ))}
                        {/* Pemakaian */}
                        {filterProductOptions.map((product) => (
                          <Bar
                            key={`${product}_pemakaian`}
                            dataKey={`${product}_pemakaian`}
                            name={`${product} Pemakaian`}
                            fill={getProductColor(product)}
                            stackId="pemakaian"
                            maxBarSize={40}
                            shape={(props: any) => (
                              <CustomRoundedTopBar
                                {...props}
                                productOptions={filterProductOptions}
                              />
                            )}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  /* ── New: Realisasi per Moda ────────────────── */
                  <BbmCompositeChart
                    data={realizationByModaData}
                    isLoading={isRealizationByModaLoading}
                    intervalMode={graphicIntervalMode}
                    period={graphicPeriod}
                  />
                )}
              </div>
            </div>

            {/* Filter Grafik Panel */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex-shrink-0">
                Filter Grafik
              </h3>

              <div className="space-y-4 overflow-y-auto flex-1 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                {/* Mode Tampilan X-Axis Select */}
                <FilterAutocomplete
                  label="Mode Tampilan Grafik"
                  options={[
                    "Waktu",
                    "Pembangkit",
                    "Pemasok",
                    "Jenis KIT",
                    "Instansi/Unit",
                    "UPK",
                    "Region",
                    "Moda Transportasi",
                  ]}
                  value={graphicXAxisMode}
                  onChange={(val) => {
                    if (val) setGraphicXAxisMode(val as GraphicXAxisMode);
                  }}
                  placeholder="Pilih Mode X-Axis"
                />

                {/* Region Select */}
                <FilterAutocomplete
                  label="Region"
                  options={filterRegionOptions}
                  value={graphicRegion}
                  onChange={(val) => {
                    setGraphicRegion(val);
                    setGraphicPlant(null);
                    setGraphicSupplier(null);
                  }}
                  placeholder="Semua Region"
                />

                {/* Instansi / Unit Select */}
                <FilterAutocomplete
                  label="Instansi / Unit"
                  options={filterUnitOptions}
                  value={graphicUnit}
                  onChange={(val) => {
                    setGraphicUnit(val);
                    setGraphicPlant(null);
                    setGraphicUpk(null);
                  }}
                  placeholder="Semua Instansi / Unit"
                />

                {/* Unit Pelaksana Select */}
                <FilterAutocomplete
                  label="Unit Pelaksana"
                  options={filterUpkOptions}
                  value={graphicUpk}
                  onChange={(val) => {
                    setGraphicUpk(val);
                    setGraphicPlant(null);
                  }}
                  placeholder="Semua Unit Pelaksana"
                />

                {/* Jenis Kit Select */}
                <FilterAutocomplete
                  label="Jenis Kit"
                  options={filterKitOptions}
                  value={graphicKit}
                  onChange={(val) => {
                    setGraphicKit(val);
                    setGraphicPlant(null);
                  }}
                  placeholder="Semua Jenis Kit"
                />

                {/* Pembangkit Select */}
                <FilterAutocomplete
                  label="Pembangkit"
                  options={filterPlantOptions}
                  value={graphicPlant}
                  onChange={setGraphicPlant}
                  placeholder="Semua Pembangkit"
                />

                {/* TBBM/Pemasok Select */}
                <FilterAutocomplete
                  label="TBBM / Pemasok"
                  options={filterSupplierOptions}
                  value={graphicSupplier}
                  onChange={setGraphicSupplier}
                  placeholder="Semua Pemasok"
                />

                {/* Produk Select */}
                <FilterAutocomplete
                  label="Produk"
                  options={filterProductOptions}
                  value={graphicProduct}
                  onChange={setGraphicProduct}
                  placeholder="Semua Produk"
                />

                {/* Moda Transportasi Select */}
                <FilterAutocomplete
                  label="Moda Transportasi"
                  options={filterModaOptions}
                  value={graphicModa}
                  onChange={setGraphicModa}
                  placeholder="Semua Moda Transportasi"
                />

                {/* Tanggal Filter */}
                <>
                  {/* Period Selectors */}
                  <p className="block text-sm font-medium text-gray-700 mt-2 mb-2">
                    Periode
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { label: "1 Minggu", val: "1W", interval: "Hari" },
                      { label: "1 Bulan", val: "1M", interval: "Hari" },
                      { label: "1 Tahun", val: "1Y", interval: "Bulan" },
                      { label: "3 Tahun", val: "3Y", interval: "Tahun" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors text-center ${
                          graphicPeriod === item.val
                            ? "bg-primary text-white shadow-sm"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setGraphicPeriod(item.val as Periode);
                          setGraphicIntervalMode(item.interval as any);

                          const now = new Date();
                          let newStart = "";
                          let newEnd = "";

                          if (item.val === "1W") {
                            const start = new Date(now);
                            start.setDate(now.getDate() - 7);
                            newStart = formatLocalISODate(start);
                            newEnd = formatLocalISODate(now);
                          } else if (item.val === "1M") {
                            const start = new Date(now);
                            start.setDate(now.getDate() - 31);
                            newStart = formatLocalISODate(start);
                            newEnd = formatLocalISODate(now);
                          } else if (item.val === "1Y") {
                            const start = new Date(now.getFullYear(), 0, 1);
                            const end = new Date(now.getFullYear(), 11, 31);
                            newStart = formatLocalISODate(start);
                            newEnd = formatLocalISODate(end);
                          } else if (item.val === "3Y") {
                            const start = new Date(now.getFullYear() - 2, 0, 1);
                            const end = new Date(now.getFullYear(), 11, 31);
                            newStart = formatLocalISODate(start);
                            newEnd = formatLocalISODate(end);
                          }

                          if (newStart && newEnd) {
                            setGraphicStart(newStart);
                            setGraphicEnd(newEnd);
                          }
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Interval Selectors */}
                  <p className="block text-sm font-medium text-gray-700 mb-2">
                    Interval
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(["Tahun", "Bulan", "Hari"] as const).map((mode) => {
                      if (
                        graphicPeriod === "1W" &&
                        (mode === "Tahun" || mode === "Bulan")
                      )
                        return null;
                      if (graphicPeriod === "1M" && mode === "Tahun")
                        return null;

                      return (
                        <button
                          key={mode}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            graphicIntervalMode === mode
                              ? "bg-primary text-white shadow-sm"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                          onClick={() => setGraphicIntervalMode(mode)}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>

                  <DateRangeFilter
                    startDate={graphicStart}
                    endDate={graphicEnd}
                    setStartDate={setGraphicStart}
                    setEndDate={setGraphicEnd}
                    periode={graphicPeriod}
                    isSingleDate={false}
                    mode={
                      graphicPeriod === "3Y" ? "Tahun" : graphicIntervalMode
                    }
                  />
                </>
              </div>
            </div>
          </div>

          {/* Section: BBM Data Table */}
          <div className="mt-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Daftar Realisasi Pengiriman BBM
            </h2>
            <EditBbmDataTable
              records={bbmMonthlyData || []}
              isLoading={isBbmMonthlyLoading}
              hideActions={true}
            />
          </div>
        </div>
      </main>

      <PieChartDetailModal
        isOpen={isOpen}
        onClose={close}
        data={dataPieChart}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        startDate={distributionStartDate}
        endDate={distributionEndDate}
        onStartDateChange={setDistributionStartDate}
        onEndDateChange={setDistributionEndDate}
        title="Volume BBM"
        tabs={["TBBM", "Pembangkit"]}
        descriptionPrefix="Visualisasi volume BBM"
        unit="KL"
      />
    </div>
  );
}

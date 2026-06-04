"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Shared hooks
import { useModal } from "@/app/_hooks";

// Component imports
import FuelTypeDonutChart from "@/app/components/FuelTypeDonutChart";
import TopVolumeList from "@/app/components/TopVolumeList";
import FilterAutocomplete from "@/app/components/FilterAutocomplete";
import EditBbmDataTable from "@/app/components/EditBbmDataTable";
import BbmCompositeChart from "@/app/components/BbmCompositeChart";

// API services
import {
  useBbmMonthly,
  useTopTbbm,
  useTopPembangkit,
  useRealizationByModa,
} from "@/hooks/service/bbm-api";
import { useSites } from "@/hooks/service/site-api";

// Dynamic map import
const MapBBM = dynamic(() => import("../../components/MapBBM"), { ssr: false });

// Chart view mode type
type ChartMode = "akumulasi" | "realisasi-moda";

// Helper to get current month date range
function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

// Helper to get current year start date
function getCurrentYearStart() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return start.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// High-Fidelity Dummy Data
// ---------------------------------------------------------------------------

const DUMMY_DONUT_SUPPLIER = [
  { name: "HSD (High Speed Diesel)", value: 450000 },
  { name: "B35 Biodiesel", value: 320000 },
  { name: "B30 Biodiesel", value: 180000 },
  { name: "MFO (Marine Fuel Oil)", value: 120000 },
  { name: "LSFO (Low Sulfur Fuel Oil)", value: 80000 },
];

const DUMMY_DONUT_PLANT = [
  { name: "PLTD Bima", value: 380000 },
  { name: "PLTD Lumok", value: 290000 },
  { name: "PLTD Labuan", value: 240000 },
  { name: "PLTD Riau", value: 190000 },
  { name: "PLTD Balikpapan", value: 150000 },
];

const DUMMY_GRAPHIC_POOL = [
  {
    name: "PLTD RIAU (HSD)",
    supplier: "TBBM Pertamina Tual",
    plant: "PLTD Riau (HSD)",
    nominasi: 120000,
    realisasi: 104500,
    pemakaian: 98200,
  },
  {
    name: "PLTD RIAU (B40)",
    supplier: "TBBM Pertamina Tual",
    plant: "PLTD Riau (HSD)",
    nominasi: 95000,
    realisasi: 88000,
    pemakaian: 81200,
  },
  {
    name: "PLTD BALIKPAPAN (B40)",
    supplier: "TBBM Pertamina Kalabahi",
    plant: "PLTD Balikpapan (B40)",
    nominasi: 78000,
    realisasi: 72400,
    pemakaian: 68500,
  },
  {
    name: "PLTD BIMA",
    supplier: "TBBM Pertamina Poso",
    plant: "PLTD Bima",
    nominasi: 110000,
    realisasi: 98000,
    pemakaian: 91000,
  },
  {
    name: "PLTD LUMOK",
    supplier: "TBBM Pertamina Tarakan",
    plant: "PLTD Lumok",
    nominasi: 85000,
    realisasi: 79200,
    pemakaian: 74100,
  },
  {
    name: "PLTD LABUAN",
    supplier: "TBBM Pertamina Kupang",
    plant: "PLTD Labuan",
    nominasi: 72000,
    realisasi: 65100,
    pemakaian: 60500,
  },
];

// ---------------------------------------------------------------------------

const EmptyChartState = ({ type }: { type: "supplier" | "plant" }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
    <div className="w-12 h-12 rounded-full bg-[#14a2bb]/10 flex items-center justify-center mb-4">
      <BarChart3 className="text-[#14a2bb]" size={24} />
    </div>
    <h4 className="text-sm font-semibold text-gray-900 mb-1">
      {type === "supplier" ? "Pilih Pemasok" : "Pilih Pembangkit"}
    </h4>
    <p className="text-xs text-gray-500 max-w-[280px]">
      Silakan pilih {type === "supplier" ? "Pemasok (TBBM)" : "Pembangkit"} terlebih dahulu pada panel filter untuk menampilkan visualisasi data grafik.
    </p>
  </div>
);

export default function Home() {
  const { isOpen, open, close } = useModal();
  const [filterType, setFilterType] = useState<string | null>("Pemasok");

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

  const [topSuppliersStart, setTopSuppliersStart] = useState(initialYearStart);
  const [topSuppliersEnd, setTopSuppliersEnd] = useState(initialEnd);
  const [topSuppliersProduct, setTopSuppliersProduct] = useState<string | null>(
    null,
  );
  const [topSuppliersModa, setTopSuppliersModa] = useState<string | null>(null);

  const [topPlantsStart, setTopPlantsStart] = useState(initialYearStart);
  const [topPlantsEnd, setTopPlantsEnd] = useState(initialEnd);
  const [topPlantsProduct, setTopPlantsProduct] = useState<string | null>(null);
  const [topPlantsModa, setTopPlantsModa] = useState<string | null>(null);

  // Filter Grafik states
  const [graphicFilterBy, setGraphicFilterBy] = useState<"supplier" | "plant">(
    "supplier",
  );
  const [graphicSupplier, setGraphicSupplier] = useState<string | null>(null);
  const [graphicPlant, setGraphicPlant] = useState<string | null>(null);
  const [graphicStart, setGraphicStart] = useState<string>(initialStart);
  const [graphicEnd, setGraphicEnd] = useState<string>(initialEnd);
  const [graphicProduct, setGraphicProduct] = useState<string | null>(null);
  const [graphicModa, setGraphicModa] = useState<string | null>(null);

  // 1. Card Volume BBM Donut Chart (Dummy Data)
  const dataPieChart = useMemo(() => {
    return filterType === "Pemasok" ? DUMMY_DONUT_SUPPLIER : DUMMY_DONUT_PLANT;
  }, [filterType]);

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
  const { data: tbbmData } = useSites({ type: "PEMASOK", commodity: "BBM" });
  const { data: pembangkitData } = useSites({
    type: "PEMBANGKIT",
    commodity: "BBM",
  });

  const filterSupplierOptions = useMemo(() => {
    if (!tbbmData) return [];
    return Array.from(new Set(tbbmData.map((t) => t.name))).sort();
  }, [tbbmData]);

  const filterPlantOptions = useMemo(() => {
    if (!pembangkitData) return [];
    return Array.from(new Set(pembangkitData.map((p) => p.name))).sort();
  }, [pembangkitData]);

  const filterProductOptions = useMemo(() => {
    if (!bbmMonthlyData) return [];
    return Array.from(
      new Set(bbmMonthlyData.map((r) => r.product).filter(Boolean)),
    ).sort();
  }, [bbmMonthlyData]);

  const filterModaOptions = useMemo(() => {
    if (!bbmMonthlyData) return [];
    return Array.from(
      new Set(bbmMonthlyData.map((r) => r.moda).filter(Boolean) as string[]),
    ).sort();
  }, [bbmMonthlyData]);

  // 4. Grafik BBM Bar Chart (Real Data)
  const barChartData = useMemo(() => {
    if (!bbmMonthlyData) return [];

    const filtered = bbmMonthlyData.filter((record) => {
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
        nominasi: number;
        realisasi: number;
        pemakaian: number;
      }
    > = {};

    filtered.forEach((record) => {
      const groupKey = `${record.reportDate}|${record.tbbm}|${record.pembangkit}|${record.product}`;

      if (!monthlyGroups[groupKey]) {
        monthlyGroups[groupKey] = {
          reportDate: record.reportDate,
          tbbm: record.tbbm,
          pembangkit: record.pembangkit,
          product: record.product,
          nominasi: record.nomination || 0,
          realisasi: record.realization || 0,
          pemakaian: record.usage || 0,
        };
      } else {
        // Same month + tbbm + pembangkit + product but different moda:
        // - nominasi & pemakaian: do not accumulate, just take the value (max)
        // - realisasi: accumulate (sum) the values
        monthlyGroups[groupKey].nominasi = Math.max(
          monthlyGroups[groupKey].nominasi,
          record.nomination || 0,
        );
        monthlyGroups[groupKey].realisasi += record.realization || 0;
        monthlyGroups[groupKey].pemakaian = Math.max(
          monthlyGroups[groupKey].pemakaian,
          record.usage || 0,
        );
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
        pemakaian: number;
      }
    > = {};

    Object.values(monthlyGroups).forEach((record) => {
      const name =
        graphicFilterBy === "supplier"
          ? `${record.pembangkit || "Unknown"} (${record.product || "Unknown"})`
          : `${record.tbbm || "Unknown"} (${record.product || "Unknown"})`;

      if (!chartGroups[name]) {
        chartGroups[name] = {
          name,
          supplier: record.tbbm,
          plant: record.pembangkit,
          nominasi: 0,
          realisasi: 0,
          pemakaian: 0,
        };
      }

      chartGroups[name].nominasi += record.nominasi;
      chartGroups[name].realisasi += record.realisasi;
      chartGroups[name].pemakaian += record.pemakaian;
    });

    return Object.values(chartGroups);
  }, [
    bbmMonthlyData,
    graphicSupplier,
    graphicPlant,
    graphicStart,
    graphicEnd,
    graphicFilterBy,
    graphicProduct,
    graphicModa,
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
          chartMode === "realisasi-moda" || graphicFilterBy === "supplier"
            ? graphicSupplier || undefined
            : undefined,
        pembangkit:
          chartMode === "realisasi-moda" || graphicFilterBy === "plant"
            ? graphicPlant || undefined
            : undefined,
      },
      {
        enabled:
          graphicFilterBy === "supplier"
            ? !!graphicSupplier
            : !!graphicPlant,
      }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            />

            <TopVolumeList
              title="Top 5 TBBM"
              list={topSuppliersList}
              unit="KL"
              description="List top 5 performa TBBM dengan volume tertinggi"
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

            <TopVolumeList
              title="Top 5 Pembangkit"
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

          {/* Section: Custom Bar Chart & Graphic Filter Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Grafik BBM
                  </h3>

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
                      Realisasi Harian
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-6">
                  {chartMode === "akumulasi"
                    ? "Visualisasi perbandingan Rencana/Nominasi, Realisasi, dan Pemakaian per Unit Pembangkit"
                    : "Visualisasi realisasi volume BBM per moda transportasi dengan akumulasi bulanan"}
                </p>
              </div>
              <div className="w-full flex-1 min-h-[320px] mt-4">
                {chartMode === "akumulasi" ? (
                  /* ── Existing: Grafik Akumulasi ─────────────── */
                  graphicFilterBy === "supplier" && !graphicSupplier ? (
                    <EmptyChartState type="supplier" />
                  ) : graphicFilterBy === "plant" && !graphicPlant ? (
                    <EmptyChartState type="plant" />
                  ) : isBbmMonthlyLoading ? (
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
                          tick={{ fill: "#6b7280", fontSize: 11 }}
                          axisLine={{ stroke: "#e5e7eb" }}
                          tickLine={false}
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
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          labelStyle={{ fontWeight: "bold", color: "#111827" }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                        />
                        <Bar
                          dataKey="nominasi"
                          name="Nominasi"
                          fill="#fb923c"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="realisasi"
                          name="Realisasi"
                          fill="#60a5fa"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="pemakaian"
                          name="Pemakaian"
                          fill="#34d399"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  /* ── New: Realisasi per Moda ────────────────── */
                  graphicFilterBy === "supplier" && !graphicSupplier ? (
                    <EmptyChartState type="supplier" />
                  ) : graphicFilterBy === "plant" && !graphicPlant ? (
                    <EmptyChartState type="plant" />
                  ) : (
                    <BbmCompositeChart
                      data={realizationByModaData}
                      isLoading={isRealizationByModaLoading}
                    />
                  )
                )}
              </div>
            </div>

            {/* Filter Grafik Panel */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  Filter Grafik
                </h3>

                <div className="space-y-4">
                  {/* Filter Berdasar */}
                  {chartMode === "akumulasi" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Filter Berdasar
                      </label>
                      <select
                        value={graphicFilterBy}
                        onChange={(e) => {
                          setGraphicFilterBy(
                            e.target.value as "supplier" | "plant",
                          );
                          setGraphicSupplier(null);
                          setGraphicPlant(null);
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb] transition-all"
                      >
                        <option value="supplier">Pemasok (TBBM)</option>
                        <option value="plant">Pembangkit</option>
                      </select>
                    </div>
                  )}

                  {/* TBBM/Pemasok Select */}
                  {(chartMode === "realisasi-moda" || graphicFilterBy === "supplier") && (
                    <FilterAutocomplete
                      label="TBBM / Pemasok"
                      options={filterSupplierOptions}
                      value={graphicSupplier}
                      onChange={setGraphicSupplier}
                      placeholder="Semua Pemasok"
                    />
                  )}

                  {/* Pembangkit Select */}
                  {(chartMode === "realisasi-moda" || graphicFilterBy === "plant") && (
                    <FilterAutocomplete
                      label="Pembangkit"
                      options={filterPlantOptions}
                      value={graphicPlant}
                      onChange={setGraphicPlant}
                      placeholder="Semua Pembangkit"
                    />
                  )}

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

                  {/* Tanggal Awal */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Tanggal Awal
                    </label>
                    <input
                      type="date"
                      value={graphicStart}
                      onChange={(e) => setGraphicStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb] transition-all"
                    />
                  </div>

                  {/* Tanggal Akhir */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Tanggal Akhir
                    </label>
                    <input
                      type="date"
                      value={graphicEnd}
                      min={graphicStart}
                      onChange={(e) => setGraphicEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    setGraphicSupplier(null);
                    setGraphicPlant(null);
                    setGraphicProduct(null);
                    setGraphicModa(null);
                    setGraphicStart(initialStart);
                    setGraphicEnd(initialEnd);
                  }}
                  className="w-full py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  Reset Filter Grafik
                </button>
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
    </div>
  );
}

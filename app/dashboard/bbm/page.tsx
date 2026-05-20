"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
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
import BBMDataTable from "@/app/components/BBMDataTable";

// API services
import { useReports } from "@/hooks/service/reports-api";

// Dynamic map import
const MapBBM = dynamic(() => import("../../components/MapBBM"), { ssr: false });

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

const DUMMY_TOP_TBBM = [
  { name: "TBBM Pertamina Tual", volume: "92.5" },
  { name: "TBBM Pertamina Kalabahi", volume: "88.1" },
  { name: "TBBM Pertamina Poso", volume: "85.4" },
  { name: "TBBM Pertamina Tarakan", volume: "82.0" },
  { name: "TBBM Pertamina Kupang", volume: "79.3" },
];

const DUMMY_TOP_PEMBANGKIT = [
  { name: "PLTD Bima", volume: "10,120.00" },
  { name: "PLTD Lumok", volume: "8,845.50" },
  { name: "PLTD Labuan", volume: "7,210.20" },
  { name: "PLTD Riau (HSD)", volume: "6,950.00" },
  { name: "PLTD Balikpapan (B40)", volume: "5,800.30" },
];

const DUMMY_GRAPHIC_POOL = [
  { name: "PLTD RIAU (HSD)", supplier: "TBBM Pertamina Tual", plant: "PLTD Riau (HSD)", nominasi: 120000, realisasi: 104500, pemakaian: 98200 },
  { name: "PLTD RIAU (B40)", supplier: "TBBM Pertamina Tual", plant: "PLTD Riau (HSD)", nominasi: 95000, realisasi: 88000, pemakaian: 81200 },
  { name: "PLTD BALIKPAPAN (B40)", supplier: "TBBM Pertamina Kalabahi", plant: "PLTD Balikpapan (B40)", nominasi: 78000, realisasi: 72400, pemakaian: 68500 },
  { name: "PLTD BIMA", supplier: "TBBM Pertamina Poso", plant: "PLTD Bima", nominasi: 110000, realisasi: 98000, pemakaian: 91000 },
  { name: "PLTD LUMOK", supplier: "TBBM Pertamina Tarakan", plant: "PLTD Lumok", nominasi: 85000, realisasi: 79200, pemakaian: 74100 },
  { name: "PLTD LABUAN", supplier: "TBBM Pertamina Kupang", plant: "PLTD Labuan", nominasi: 72000, realisasi: 65100, pemakaian: 60500 },
];

// ---------------------------------------------------------------------------

export default function Home() {
  const { isOpen, open, close } = useModal();
  const [filterType, setFilterType] = useState<string | null>("Pemasok");

  // Date range states
  const { startDate: initialStart, endDate: initialEnd } = useMemo(() => getCurrentMonthRange(), []);
  
  const [distributionStartDate, setDistributionStartDate] = useState(initialStart);
  const [distributionEndDate, setDistributionEndDate] = useState(initialEnd);
  
  const [topSuppliersStart, setTopSuppliersStart] = useState(initialStart);
  const [topSuppliersEnd, setTopSuppliersEnd] = useState(initialEnd);
  
  const [topPlantsStart, setTopPlantsStart] = useState(initialStart);
  const [topPlantsEnd, setTopPlantsEnd] = useState(initialEnd);

  // Filter Grafik states
  const [graphicFilterBy, setGraphicFilterBy] = useState<"supplier" | "plant">("supplier");
  const [graphicSupplier, setGraphicSupplier] = useState<string | null>(null);
  const [graphicPlant, setGraphicPlant] = useState<string | null>(null);
  const [graphicStart, setGraphicStart] = useState<string>(initialStart);
  const [graphicEnd, setGraphicEnd] = useState<string>(initialEnd);

  // 1. Card Volume BBM Donut Chart (Dummy Data)
  const dataPieChart = useMemo(() => {
    return filterType === "Pemasok" ? DUMMY_DONUT_SUPPLIER : DUMMY_DONUT_PLANT;
  }, [filterType]);

  // 2. Top 5 TBBM Performer List (Dummy Data)
  const topSuppliersList = useMemo(() => {
    return DUMMY_TOP_TBBM;
  }, []);

  // 3. Top 5 Pembangkit Performer List (Dummy Data)
  const topPembangkitList = useMemo(() => {
    return DUMMY_TOP_PEMBANGKIT;
  }, []);

  // Fetch reports data for bottom table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const { data: reportsData, isLoading: isReportsLoading } = useReports({
    page,
    limit: pageSize,
  });

  const handlePageChange = useCallback((newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  }, []);

  // Dynamic filter options based on dummy data pool
  const filterSupplierOptions = useMemo(() => {
    const set = new Set(DUMMY_GRAPHIC_POOL.map((r) => r.supplier));
    return Array.from(set).sort();
  }, []);

  const filterPlantOptions = useMemo(() => {
    const set = new Set(DUMMY_GRAPHIC_POOL.map((r) => r.plant));
    return Array.from(set).sort();
  }, []);

  // 4. Grafik BBM Bar Chart (Dummy Data)
  const barChartData = useMemo(() => {
    // Filter the pool client-side based on user filter selections
    return DUMMY_GRAPHIC_POOL.filter((record) => {
      if (graphicSupplier && record.supplier !== graphicSupplier) return false;
      if (graphicPlant && record.plant !== graphicPlant) return false;
      return true;
    });
  }, [graphicSupplier, graphicPlant]);

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
                Dashboard untuk monitoring data realtime BBM dan Pembangkit PLN EPI
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
              title="Top 5 performa TBBM"
              list={topSuppliersList}
              unit="%"
              description="List top 5 performa TBBM dengan perhitungan Realisasi/TOP"
              startDate={topSuppliersStart}
              endDate={topSuppliersEnd}
              onStartDateChange={setTopSuppliersStart}
              onEndDateChange={setTopSuppliersEnd}
            />

            <TopVolumeList
              title="Top 5 performa Pembangkit"
              list={topPembangkitList}
              unit="KL"
              description="List top 5 performa pembangkit BBM dengan volume tertinggi"
              startDate={topPlantsStart}
              endDate={topPlantsEnd}
              onStartDateChange={setTopPlantsStart}
              onEndDateChange={setTopPlantsEnd}
            />
          </div>

          {/* Section: Custom Bar Chart & Graphic Filter Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Grafik BBM
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  Visualisasi perbandingan Rencana/Nominasi, Realisasi, dan Pemakaian per Unit Pembangkit
                </p>
              </div>
              <div className="w-full">
                {barChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[320px] text-gray-400 text-sm">
                    Tidak ada data laporan yang cocok dengan filter grafik
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
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
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Bar dataKey="nominasi" name="Nominasi" fill="#fb923c" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="realisasi" name="Realisasi" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pemakaian" name="Pemakaian" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Filter Berdasar
                    </label>
                    <select
                      value={graphicFilterBy}
                      onChange={(e) => {
                        setGraphicFilterBy(e.target.value as "supplier" | "plant");
                        setGraphicSupplier(null);
                        setGraphicPlant(null);
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb] transition-all"
                    >
                      <option value="supplier">Pemasok (TBBM)</option>
                      <option value="plant">Pembangkit</option>
                    </select>
                  </div>

                  {/* TBBM/Pemasok Select */}
                  {graphicFilterBy === "supplier" ? (
                    <FilterAutocomplete
                      label="TBBM / Pemasok"
                      options={filterSupplierOptions}
                      value={graphicSupplier}
                      onChange={setGraphicSupplier}
                      placeholder="Semua Pemasok"
                    />
                  ) : (
                    /* Pembangkit Select */
                    <FilterAutocomplete
                      label="Pembangkit"
                      options={filterPlantOptions}
                      value={graphicPlant}
                      onChange={setGraphicPlant}
                      placeholder="Semua Pembangkit"
                    />
                  )}

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
            <BBMDataTable
              records={reportsData?.data ?? []}
              totalItems={reportsData?.total ?? 0}
              page={page}
              pageSize={pageSize}
              isLoading={isReportsLoading}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

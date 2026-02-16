"use client";

import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

// Shared imports
import { CHART_COLORS } from "@/app/_constants";
import { useModal } from "@/app/_hooks";

// API hooks
import {
  useDistribution,
  useTopSuppliers,
  useTopPlants,
  useChartFlow,
  useFilters,
  useContractInfo,
  useEvents,
} from "@/hooks/service/dashboard-api";
import type { Granularity } from "@/app/components/RealtimeChart";

// Components
import FuelTypeDonutChart from "@/app/components/FuelTypeDonutChart";
import TopVolumeList from "@/app/components/TopVolumeList";
import RealtimeChart from "@/app/components/RealtimeChart";
import { Modal } from "@/app/components/ui";

const Map = dynamic(() => import("@/app/components/Map"), { ssr: false });

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

export default function GasDashboard() {
  const { isOpen, open, close } = useModal();
  const [filterType, setFilterType] = useState<string | null>("Pemasok");

  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const { startDate, endDate } = useMemo(() => getCurrentMonthRange(), []);
  const [startDateFilter, setStartDateFilter] = useState<string | null>(
    todayDate,
  );
  const [endDateFilter, setEndDateFilter] = useState<string | null>(todayDate);

  // Chart flow state
  const [granularity, setGranularity] = useState<Granularity>("hour");
  const [chartBy, setChartBy] = useState<"supplier" | "plant">("supplier");
  const [selectedPemasokId, setSelectedPemasokId] = useState<
    string | undefined
  >(undefined);
  const [selectedPembangkitId, setSelectedPembangkitId] = useState<
    string | undefined
  >(undefined);

  // Fetch distribution data based on filter type
  const distributionBy = filterType === "Pemasok" ? "supplier" : "plant";
  const { data: distributionData, isLoading: isDistLoading } = useDistribution(
    todayDate,
    distributionBy as "supplier" | "plant",
  );

  // Fetch top suppliers and plants
  const { data: topSuppliersData, isLoading: isSuppliersLoading } =
    useTopSuppliers(startDate, endDate, 5);
  const { data: topPlantsData, isLoading: isPlantsLoading } = useTopPlants(
    startDate,
    endDate,
    5,
  );

  // Fetch chart flow data
  const { data: chartFlowData, isLoading: isChartLoading } = useChartFlow(
    startDateFilter || "",
    endDateFilter || "",
    granularity,
    chartBy,
    selectedPemasokId,
    selectedPembangkitId,
  );

  // Fetch filter options
  const { data: filtersData } = useFilters();

  // Fetch contract info — always fetch, optionally filter by selected pemasok
  const { data: contractData, isLoading: isContractLoading } = useContractInfo(
    selectedPemasokId,
    selectedPembangkitId,
  );

  // Fetch events — always fetch
  const { data: eventsData, isLoading: isEventsLoading } = useEvents(
    startDate,
    endDate,
    10,
  );

  // Chart flow callbacks
  const handlePeriodChange = useCallback((newGranularity: Granularity) => {
    if (newGranularity === "hour") {
      setStartDateFilter(todayDate);
      setEndDateFilter(todayDate);
      setGranularity("hour");
    } else if (newGranularity === "day") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(new Date(todayDate).getDate() - 7);
      setStartDateFilter(sevenDaysAgo.toISOString().split("T")[0]);
      setEndDateFilter(todayDate);
      setGranularity("day");
    } else if (newGranularity === "three_month") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(new Date(todayDate).getDate() - 90);
      setStartDateFilter(threeMonthsAgo.toISOString().split("T")[0]);
      setEndDateFilter(todayDate);
      setGranularity("month");
    } else if (newGranularity === "six_month") {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setDate(new Date(todayDate).getDate() - 180);
      setStartDateFilter(sixMonthsAgo.toISOString().split("T")[0]);
      setEndDateFilter(endDate);
      setGranularity("month");
    } else if (newGranularity === "one_year") {
      const oneYearAgo = new Date();
      oneYearAgo.setDate(new Date(todayDate).getDate() - 365);
      setStartDateFilter(oneYearAgo.toISOString().split("T")[0]);
      setEndDateFilter(endDate);
      setGranularity("month");
    }
  }, []);

  const handlePemasokChange = useCallback((pemasokId: string | null) => {
    setSelectedPemasokId(pemasokId ?? undefined);
  }, []);

  const handlePembangkitChange = useCallback((pembangkitId: string | null) => {
    setSelectedPembangkitId(pembangkitId ?? undefined);
  }, []);

  const handleDateRangeChange = useCallback(
    (startDate: string | null, endDate: string | null) => {
      setStartDateFilter(startDate);
      setEndDateFilter(endDate);
      setGranularity("day");
    },
    [],
  );

  const handleFilterByChange = useCallback((filterType: string | null) => {
    if (filterType === "Pemasok") {
      setChartBy("supplier");
    } else if (filterType === "Pembangkit") {
      setChartBy("plant");
    }
  }, []);

  // Transform distribution data for pie chart component
  const dataPieChart = useMemo(() => {
    if (!distributionData) return [];
    const items = Array.isArray(distributionData)
      ? distributionData
      : distributionData.items;
    if (!Array.isArray(items)) return [];
    return items.map((item: { name: string; value: number }) => ({
      name: item.name,
      value: item.value,
    }));
  }, [distributionData]);

  // Transform top data for list components
  const topPemasokList = useMemo(() => {
    if (!topSuppliersData?.items) return [];
    return topSuppliersData.items.map(
      (item: { name: string; percentage: number }) => ({
        name: item.name,
        volume: `${item.percentage.toFixed(1)}`,
      }),
    );
  }, [topSuppliersData]);

  const topPembangkitList = useMemo(() => {
    if (!topPlantsData?.items) return [];
    return topPlantsData.items.map((item: { name: string; value: number }) => ({
      name: item.name,
      volume: `${item.value.toFixed(0)}`,
    }));
  }, [topPlantsData]);

  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Dashboard Gas Pipa
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Dashboard untuk monitoring data realtime pipa gas
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6 md:mb-8">
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Monitoring Gas Pipa PLN EPI
              </h2>
            </div>

            <div className="mb-6 md:mb-8">
              <Map />
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {isDistLoading ? (
                <div className="bg-white rounded-xl p-6 flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#14a2bb]" size={32} />
                </div>
              ) : (
                <FuelTypeDonutChart
                  openModalFunction={open}
                  data={dataPieChart}
                  changeFilterType={setFilterType}
                  filterType={filterType}
                />
              )}
              {isSuppliersLoading ? (
                <div className="bg-white rounded-xl p-6 flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#14a2bb]" size={32} />
                </div>
              ) : (
                <TopVolumeList
                  title="Top 5 Volume Pemasok"
                  list={topPemasokList}
                  unit="%"
                  description="List top 5 performa pemasok dengan perhitungan Realisasi/TOP"
                />
              )}
              {isPlantsLoading ? (
                <div className="bg-white rounded-xl p-6 flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#14a2bb]" size={32} />
                </div>
              ) : (
                <TopVolumeList
                  title="Top 5 Volume Pembangkit"
                  list={topPembangkitList}
                  unit="MMBTU"
                  description="List top 5 performa pembangkit dengan satuan MMBTU"
                />
              )}
            </div>

            <div className="mb-6">
              <RealtimeChart
                contractData={contractData ?? null}
                chartFlowData={chartFlowData ?? null}
                filtersData={filtersData ?? null}
                isLoading={isChartLoading}
                onFilterByChange={handleFilterByChange}
                onPeriodChange={handlePeriodChange}
                onPemasokChange={handlePemasokChange}
                onPembangkitChange={handlePembangkitChange}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <Modal isOpen={isOpen} onClose={close}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chart Section */}
          <div className="bg-white rounded-xl px-4 md:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Konsumsi Gas
              </h3>
              <div className="flex items-center">
                <button
                  className={`text-[#115d72] ${
                    filterType === "Pemasok" ? "bg-[#14a2bb92]" : ""
                  } px-2 rounded-md cursor-pointer`}
                  onClick={() => setFilterType("Pemasok")}
                >
                  Pemasok
                </button>
                <button
                  className={`text-[#115d72] ${
                    filterType === "Pembangkit" ? "bg-[#14a2bb92]" : ""
                  } px-2 rounded-md cursor-pointer`}
                  onClick={() => setFilterType("Pembangkit")}
                >
                  Pembangkit
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataPieChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {dataPieChart.map(
                    (_: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                    ),
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
              Visualisasi konsumsi gas pada setiap pembangkit PLN EPI
            </p>
          </div>

          {/* List Section */}
          <div>
            <p className="text-lg font-semibold text-gray-900 mb-4">
              Detail List {filterType}
            </p>
            <div className="p-4 md:p-8 text-gray-900 h-[300px] md:h-[400px] overflow-auto border border-gray-200 rounded-lg">
              {dataPieChart.map(
                (item: { name: string; value: number }, index: number) => (
                  <div key={index} className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index] }}
                      />
                      <p className="font-medium text-sm md:text-base">
                        {item.name}
                      </p>
                    </div>
                    <div className="text-sm md:text-base">
                      {item.value} MMBTU
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

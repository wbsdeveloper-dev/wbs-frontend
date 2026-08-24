"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Shared imports
import { useModal } from "@/app/_hooks";
import { usePrivilege } from "@/hooks/usePrivilege";
import { useAuth } from "@/components/providers/auth-provider";

// API hooks
import {
  useDistribution,
  useTopSuppliers,
  useTopPlants,
  useChartFlow,
  useFilters,
  useEvents,
  useMapLocations,
} from "@/hooks/service/dashboard-api";
import { useContracts } from "@/hooks/service/contract-api";
import { useSites } from "@/hooks/service/site-api";
import type { Granularity, Periode } from "@/app/components/RealtimeChart";

// Components
import FuelTypeDonutChart from "@/app/components/FuelTypeDonutChart";
import TopVolumeList from "@/app/components/TopVolumeList";
import RealtimeChart from "@/app/components/RealtimeChart";
import PieChartDetailModal from "@/app/components/PieChartDetailModal";

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

// Helper to get date range from 2 days ago to today
function getTwoDaysAgoRange() {
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 2);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: now.toISOString().split("T")[0],
  };
}

export default function GasDashboard() {
  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const { isLoading: isAuthLoading } = useAuth();
  const canRead = hasPrivilege("dashboard", "READ");

  const { isOpen, open, close } = useModal();
  const [filterType, setFilterType] = useState<string | null>("Pemasok");
  const [distributionCommodity, setDistributionCommodity] = useState<string | null>("GAS PIPA");

  useEffect(() => {
    if (!isAuthLoading && !canRead) {
      router.push("/landingpage");
    }
  }, [isAuthLoading, canRead, router]);

  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const { startDate, endDate } = useMemo(() => getCurrentMonthRange(), []);
  const { startDate: twoDaysAgoStart, endDate: twoDaysAgoEnd } = useMemo(
    () => getTwoDaysAgoRange(),
    []
  );
  const [distributionStartDate, setDistributionStartDate] = useState(twoDaysAgoStart);
  const [distributionEndDate, setDistributionEndDate] = useState(twoDaysAgoEnd);
  const [startDateFilter, setStartDateFilter] = useState<string | null>(
    todayDate,
  );
  const [endDateFilter, setEndDateFilter] = useState<string | null>(todayDate);

  // Chart flow state
  const [granularity, setGranularity] = useState<
    "hour" | "day" | "month" | "year"
  >("hour");
  const [chartBy, setChartBy] = useState<"supplier" | "plant">("supplier");
  const [selectedPemasokId, setSelectedPemasokId] = useState<
    string | undefined
  >(undefined);
  const [selectedPembangkitId, setSelectedPembangkitId] = useState<
    string | undefined
  >(undefined);
  const [selectedRegion, setSelectedRegion] = useState<
    string | undefined
  >(undefined);
  const [selectedCommodity, setSelectedCommodity] = useState<
    string | undefined
  >(undefined);

  // Fetch distribution data based on filter type
  const distributionBy = filterType === "Pemasok" ? "supplier" : "plant";
  const { data: distributionData, isLoading: isDistLoading } = useDistribution(
    distributionStartDate,
    distributionEndDate,
    distributionBy as "supplier" | "plant",
    selectedRegion,
    distributionCommodity || undefined,
  );

  // Top suppliers/plants date filters
  const [topSuppliersStart, setTopSuppliersStart] = useState(twoDaysAgoStart);
  const [topSuppliersEnd, setTopSuppliersEnd] = useState(twoDaysAgoEnd);
  const [topPlantsStart, setTopPlantsStart] = useState(twoDaysAgoStart);
  const [topPlantsEnd, setTopPlantsEnd] = useState(twoDaysAgoEnd);

  // Top LNG suppliers/plants date filters
  const [topLngSuppliersStart, setTopLngSuppliersStart] = useState(twoDaysAgoStart);
  const [topLngSuppliersEnd, setTopLngSuppliersEnd] = useState(twoDaysAgoEnd);
  const [topLngPlantsStart, setTopLngPlantsStart] = useState(twoDaysAgoStart);
  const [topLngPlantsEnd, setTopLngPlantsEnd] = useState(twoDaysAgoEnd);

  const formattedTopSuppliersPeriod = useMemo(() => {
    try {
      const start = new Date(topSuppliersStart + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const end = new Date(topSuppliersEnd + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `${start} - ${end}`;
    } catch {
      return `${topSuppliersStart} - ${topSuppliersEnd}`;
    }
  }, [topSuppliersStart, topSuppliersEnd]);

  const formattedTopPlantsPeriod = useMemo(() => {
    try {
      const start = new Date(topPlantsStart + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const end = new Date(topPlantsEnd + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `${start} - ${end}`;
    } catch {
      return `${topPlantsStart} - ${topPlantsEnd}`;
    }
  }, [topPlantsStart, topPlantsEnd]);

  const formattedTopLngSuppliersPeriod = useMemo(() => {
    try {
      const start = new Date(topLngSuppliersStart + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const end = new Date(topLngSuppliersEnd + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `${start} - ${end}`;
    } catch {
      return `${topLngSuppliersStart} - ${topLngSuppliersEnd}`;
    }
  }, [topLngSuppliersStart, topLngSuppliersEnd]);

  const formattedTopLngPlantsPeriod = useMemo(() => {
    try {
      const start = new Date(topLngPlantsStart + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const end = new Date(topLngPlantsEnd + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `${start} - ${end}`;
    } catch {
      return `${topLngPlantsStart} - ${topLngPlantsEnd}`;
    }
  }, [topLngPlantsStart, topLngPlantsEnd]);

  // Fetch top suppliers and plants (GAS PIPA)
  const { data: topSuppliersData, isLoading: isSuppliersLoading } =
    useTopSuppliers(topSuppliersStart, topSuppliersEnd, 5, selectedRegion, "GAS PIPA");
  const { data: topPlantsData, isLoading: isPlantsLoading } = useTopPlants(
    topPlantsStart,
    topPlantsEnd,
    5,
    selectedRegion,
    "GAS PIPA",
  );

  // Fetch top LNG suppliers and plants
  const { data: topLngSuppliersData, isLoading: isLngSuppliersLoading } =
    useTopSuppliers(topLngSuppliersStart, topLngSuppliersEnd, 5, selectedRegion, "LNG");
  const { data: topLngPlantsData, isLoading: isLngPlantsLoading } = useTopPlants(
    topLngPlantsStart,
    topLngPlantsEnd,
    5,
    selectedRegion,
    "LNG",
  );

  // Fetch chart flow data
  const { data: chartFlowData, isLoading: isChartLoading } = useChartFlow(
    startDateFilter || "",
    endDateFilter || "",
    granularity as any,
    chartBy,
    selectedPemasokId,
    selectedPembangkitId,
    selectedRegion,
    selectedCommodity,
  );

  // Fetch filter options — when a pemasok or pembangkit is selected,
  // the API returns only the related counterparts.
  const { data: filtersData } = useFilters(
    selectedPemasokId,
    selectedPembangkitId,
    selectedRegion,
    selectedCommodity,
  );

  // Fetch all sites to help with frontend region filtering (includes sites without coordinates)
  const { data: allSites } = useSites({ commodity: "LNG,GAS PIPA" });

  // Filter filtersData locally if a region is selected
  const filteredFiltersData = useMemo(() => {
    if (!filtersData) return null;
    if (!selectedRegion || !allSites) return filtersData;

    const selectedRegionLower = selectedRegion.toLowerCase();
    const regionSites = allSites.filter(s => s.region?.toLowerCase() === selectedRegionLower);
    const regionSiteIds = new Set(regionSites.map(s => s.id));

    return {
      ...filtersData,
      pemasok: filtersData.pemasok.filter(p => regionSiteIds.has(p.id)),
      pembangkit: filtersData.pembangkit.filter(p => regionSiteIds.has(p.id)),
    };
  }, [filtersData, selectedRegion, allSites]);

  // Filter chartFlowData locally if a region is selected
  const filteredChartFlowData = useMemo(() => {
    if (!chartFlowData) return null;
    if (!selectedRegion || !allSites) return chartFlowData;

    const selectedRegionLower = selectedRegion.toLowerCase();
    const regionSites = allSites.filter(s => s.region?.toLowerCase() === selectedRegionLower);
    const regionSiteIds = new Set(regionSites.map(s => s.id));

    return {
      ...chartFlowData,
      series: chartFlowData.series.filter(s => regionSiteIds.has(s.siteId))
    };
  }, [chartFlowData, selectedRegion, allSites]);

  // Fetch contract from contracts table, filtered by selected pemasok/pembangkit.
  // Enabled whenever at least pemasok OR pembangkit is chosen, so the contract
  // section shows up even before the user picks a specific pembangkit.
  const { data: contractsData, isLoading: isContractLoading } = useContracts(
    {
      pemasok_site_id: selectedPemasokId,
      pembangkit_site_id: selectedPembangkitId,
      status: "ACTIVE",
    },
    {
      enabled: !!(selectedPemasokId || selectedPembangkitId),
    },
  );

  // Fetch events — always fetch
  const { data: eventsData, isLoading: isEventsLoading } = useEvents(
    startDate,
    endDate,
    10,
  );

  // Chart flow callbacks
  const handlePeriodChange = useCallback(
    (newGranularity: Granularity) => {
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
      } else if (newGranularity === "interval_hour") {
        setGranularity("hour");
      } else if (newGranularity === "interval_day") {
        setGranularity("day");
      } else if (newGranularity === "interval_month") {
        setGranularity("month");
      } else if (newGranularity === "interval_year") {
        setGranularity("year");
      } else {
        const getFirstDateOfMonth = (dateStr: string, monthsAgo: number) => {
          const d = new Date(dateStr);
          d.setMonth(d.getMonth() - monthsAgo);
          return d.toISOString().split("T")[0];
        };

        if (newGranularity === "one_month") {
          setStartDateFilter(getFirstDateOfMonth(todayDate, 1));
          setEndDateFilter(todayDate);
          setGranularity("day");
        } else if (newGranularity === "three_month") {
          setStartDateFilter(getFirstDateOfMonth(todayDate, 3));
          setEndDateFilter(todayDate);
          setGranularity("month");
        } else if (newGranularity === "six_month") {
          setStartDateFilter(getFirstDateOfMonth(todayDate, 6));
          setEndDateFilter(todayDate);
          setGranularity("month");
        } else if (newGranularity === "one_year") {
          setStartDateFilter(getFirstDateOfMonth(todayDate, 12));
          setEndDateFilter(todayDate);
          setGranularity("month");
        } else if (newGranularity === "three_year") {
          const currentYear = new Date(todayDate).getFullYear();
          setStartDateFilter(`${currentYear - 2}-01-01`);
          setEndDateFilter(`${currentYear}-12-31`);
          setGranularity("year");
        }
      }
    },
    [todayDate],
  );

  const handlePemasokChange = useCallback((pemasokId: string | null) => {
    setSelectedPemasokId(pemasokId ?? undefined);
  }, []);

  const handlePembangkitChange = useCallback((pembangkitId: string | null) => {
    setSelectedPembangkitId(pembangkitId ?? undefined);
  }, []);

  const handleRegionChange = useCallback((region: string | null) => {
    setSelectedRegion(region ?? undefined);
    setSelectedPemasokId(undefined);
    setSelectedPembangkitId(undefined);
  }, []);

  const handleCommodityChange = useCallback((commodity: string | null) => {
    setSelectedCommodity(commodity ?? undefined);
    setSelectedPemasokId(undefined);
    setSelectedPembangkitId(undefined);
  }, []);

  const handleDateRangeChange = useCallback(
    (startDate: string | null, endDate: string | null) => {
      setStartDateFilter(startDate);
      setEndDateFilter(endDate);
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
    let items = Array.isArray(distributionData)
      ? distributionData
      : distributionData.items;
    if (!Array.isArray(items)) return [];

    // Local filtering by commodity since backend /dashboard/distribution might not support commodity param
    if (allSites && distributionCommodity) {
      const targetCommodity = distributionCommodity.toUpperCase();
      const commoditySites = new Set(
        allSites
          .filter((s) => s.commodity?.toUpperCase() === targetCommodity || (s.commodity?.toUpperCase().includes(targetCommodity)))
          .map((s) => s.name.toLowerCase())
      );
      items = items.filter((item: { name: string; value: number }) =>
        commoditySites.has(item.name.toLowerCase())
      );
    }

    return items.map((item: { name: string; value: number }) => ({
      name: item.name,
      value: item.value,
    }));
  }, [distributionData, allSites, distributionCommodity]);

  const topPemasokList = useMemo(() => {
    if (!topSuppliersData?.items) return [];
    return topSuppliersData.items.map(
      (item: { name: string; value: number }) => ({
        name: item.name,
        volume: `${item.value.toFixed(1)}`,
      }),
    );
  }, [topSuppliersData]);

  const topPembangkitList = useMemo(() => {
    if (!topPlantsData?.items) return [];
    return topPlantsData.items.map((item: { name: string; value: number }) => ({
      name: item.name,
      volume: `${item.value.toFixed(2)}`,
    }));
  }, [topPlantsData]);

  const topLngPemasokList = useMemo(() => {
    if (!topLngSuppliersData?.items) return [];
    return topLngSuppliersData.items.map(
      (item: { name: string; value: number }) => ({
        name: item.name,
        volume: `${item.value.toFixed(1)}`,
      }),
    );
  }, [topLngSuppliersData]);

  const topLngPembangkitList = useMemo(() => {
    if (!topLngPlantsData?.items) return [];
    return topLngPlantsData.items.map((item: { name: string; value: number }) => ({
      name: item.name,
      volume: `${item.value.toFixed(2)}`,
    }));
  }, [topLngPlantsData]);

  if (isAuthLoading || !canRead) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-secondary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>Dashboard</span>
                <span className="text-gray-400">/</span>
                <span className="text-primary font-medium">Gas Pipa</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Dashboard Gas Pipa
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Dashboard untuk monitoring data realtime gas pipa
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
              <Map commodity="LNG,GAS PIPA" />
            </div>

            {/* Cards Grid */}
            <div className="flex overflow-x-auto gap-4 mb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {isDistLoading ? (
                <div className="bg-white rounded-xl p-6 flex items-center justify-center w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
                  <Loader2 className="animate-spin text-secondary" size={32} />
                </div>
              ) : (
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
                    commodity={distributionCommodity}
                    onCommodityChange={setDistributionCommodity}
                    commodityOptions={["GAS PIPA", "LNG"]}
                  />
                </div>
              )}
              {isSuppliersLoading ? (
                <div className="bg-white rounded-xl p-6 flex items-center justify-center w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
                  <Loader2 className="animate-spin text-secondary" size={32} />
                </div>
              ) : (
                <div className="w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
                  <TopVolumeList
                    title="Top 5 Volume Pemasok"
                    list={topPemasokList}
                    unit={topSuppliersData?.unit || "BBTUD"}
                    description={`List top 5 performa pemasok dengan satuan ${topSuppliersData?.unit || "BBTUD"} per tanggal ${formattedTopSuppliersPeriod}`}
                    startDate={topSuppliersStart}
                    endDate={topSuppliersEnd}
                    onStartDateChange={setTopSuppliersStart}
                    onEndDateChange={setTopSuppliersEnd}
                  />
                </div>
              )}
              {isPlantsLoading ? (
                <div className="bg-white rounded-xl p-6 flex items-center justify-center w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
                  <Loader2 className="animate-spin text-secondary" size={32} />
                </div>
              ) : (
                <div className="w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
                  <TopVolumeList
                    title="Top 5 Volume Pembangkit"
                    list={topPembangkitList}
                    unit={topPlantsData?.unit || "BBTUD"}
                    description={`List top 5 performa pembangkit dengan satuan ${topPlantsData?.unit || "BBTUD"} per tanggal ${formattedTopPlantsPeriod}`}
                    startDate={topPlantsStart}
                    endDate={topPlantsEnd}
                    onStartDateChange={setTopPlantsStart}
                    onEndDateChange={setTopPlantsEnd}
                  />
                </div>
              )}
              {isLngSuppliersLoading ? (
                <div className="bg-white rounded-xl p-6 flex items-center justify-center w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
                  <Loader2 className="animate-spin text-secondary" size={32} />
                </div>
              ) : (
                <div className="w-[360px] min-w-[360px] md:w-[420px] md:min-w-[420px] flex-shrink-0">
                  <TopVolumeList
                    title="Top 5 Volume Pemasok (LNG)"
                    list={topLngPemasokList}
                    unit={topLngSuppliersData?.unit || "BBTUD"}
                    description={`List top 5 performa pemasok LNG dengan satuan ${topLngSuppliersData?.unit || "BBTUD"} per tanggal ${formattedTopLngSuppliersPeriod}`}
                    startDate={topLngSuppliersStart}
                    endDate={topLngSuppliersEnd}
                    onStartDateChange={setTopLngSuppliersStart}
                    onEndDateChange={setTopLngSuppliersEnd}
                  />
                </div>
              )}
              {isLngPlantsLoading ? (
                <div className="bg-white rounded-xl p-6 flex items-center justify-center w-[360px] min-w-[360px] md:w-[440px] md:min-w-[440px] flex-shrink-0">
                  <Loader2 className="animate-spin text-secondary" size={32} />
                </div>
              ) : (
                <div className="w-[360px] min-w-[360px] md:w-[460px] md:min-w-[460px] flex-shrink-0">
                  <TopVolumeList
                    title="Top 5 Volume Pembangkit (LNG)"
                    list={topLngPembangkitList}
                    unit={topLngPlantsData?.unit || "BBTUD"}
                    description={`List top 5 performa pembangkit LNG dengan satuan ${topLngPlantsData?.unit || "BBTUD"} per tanggal ${formattedTopLngPlantsPeriod}`}
                    startDate={topLngPlantsStart}
                    endDate={topLngPlantsEnd}
                    onStartDateChange={setTopLngPlantsStart}
                    onEndDateChange={setTopLngPlantsEnd}
                  />
                </div>
              )}
            </div>

            <div className="mb-6">
              <RealtimeChart
                contractData={contractsData ?? null}
                chartFlowData={filteredChartFlowData ?? null}
                filtersData={filteredFiltersData ?? null}
                isLoading={isChartLoading}
                isContractLoading={isContractLoading}
                onFilterByChange={handleFilterByChange}
                onPeriodChange={handlePeriodChange}
                onPemasokChange={handlePemasokChange}
                onPembangkitChange={handlePembangkitChange}
                onRegionChange={handleRegionChange}
                onCommodityChange={handleCommodityChange}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
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
        commodity={distributionCommodity}
        onCommodityChange={setDistributionCommodity}
        commodityOptions={["GAS PIPA", "LNG"]}
      />
    </div>
  );
}

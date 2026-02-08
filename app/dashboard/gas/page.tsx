"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Shared imports
import { CHART_COLORS } from "@/app/_constants";
import { useModal } from "@/app/_hooks";
import {
  topVolumePemasok,
  topVolumePembangkit,
  getPieChartDataByType,
} from "@/app/_data/chartData";

// Components
import FuelTypeDonutChart from "@/app/components/FuelTypeDonutChart";
import TopVolumeList from "@/app/components/TopVolumeList";
import RealtimeChart from "@/app/components/RealtimeChart";
import SCurveProgressChart from "@/app/components/SCurveProgressChart";
import { Modal } from "@/app/components/ui";

const Map = dynamic(() => import("@/app/components/Map"), { ssr: false });

export default function GasDashboard() {
  const { isOpen, open, close } = useModal();
  const [filterType, setFilterType] = useState<string | null>("Pemasok");

  const dataPieChart = useMemo(
    () => getPieChartDataByType(filterType),
    [filterType]
  );

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
              <FuelTypeDonutChart
                openModalFunction={open}
                data={dataPieChart}
                changeFilterType={setFilterType}
                filterType={filterType}
              />
              <TopVolumeList
                title="Top 5 Volume Pemasok"
                list={topVolumePemasok}
                unit="%"
                description="List top 5 performa pemasok dengan perhitungan Realisasi/TOP"
              />
              <TopVolumeList
                title="Top 5 Volume Pembangkit"
                list={topVolumePembangkit}
                unit="MMBTU"
                description="List top 5 performa pembangkit dengan satuan MMBTU"
              />
            </div>

            <div className="mb-6">
              <RealtimeChart />
            </div>

            {/* S-Curve Progress Chart */}
            <div className="mb-6">
              <SCurveProgressChart />
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
                  {dataPieChart.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                  ))}
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
              {dataPieChart.map((item, index) => (
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
                  <div className="text-sm md:text-base">{item.value} MMBTU</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

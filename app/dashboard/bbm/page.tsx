"use client";

import { useState, useCallback } from "react";
import StatCard from "../../components/StatCard";
import StockBarChart from "../../components/StockBarChart";
import FuelTypeDonutChart from "../../components/FuelTypeDonutChart";
import FilterAutocomplete from "../../components/FilterAutocomplete";
import TopVolumeList from "../../components/TopVolumeList";
import RealtimeChart from "../../components/RealtimeChart";

import dynamic from "next/dynamic";
import RealizationChart from "@/app/components/RealizationChart";
import BBMMonitoringTable from "@/app/components/EditDataTable";
import { useMonitoringRecords } from "@/hooks/service/monitoring-api";

const Map = dynamic(() => import("../../components/Map"), { ssr: false });

interface TopVolumeList {
  name: string;
  volume: string;
}

const regionalOptions = [
  "Regional 1",
  "Regional 2",
  "Regional 3",
  "Regional 4",
];
const pemasokOptions = ["PSHE"];
const transportirOptions = ["Transportir A", "Transportir B"];
const pembangkitOptions = ["Pembangkit A", "Pembangkit B"];
const tbbmOptions = [
  "TBBM Pertamina Tual",
  "TBBM Pertamina Kalabahi",
  "TBBM Pertamina Poso",
  "TBBM Pertamina Tarakan",
];

// const tbbm = [
//   { name: "TBBM Pertamina Tual", rencana: 1200, realisasi: 800 },
//   { name: "TBBM Pertamina Kalabahi", rencana: 1000, realisasi: 920 },
//   { name: "TBBM Pertamina Poso", rencana: 900, realisasi: 820 },
//   { name: "TBBM Pertamina Tarakan", rencana: 1400, realisasi: 100 },
// ];

const topVolumePembangkit: TopVolumeList[] = [
  { name: "PLTD BIMA", volume: "10100" },
  { name: "PLTD LUMOK", volume: "8800" },
  { name: "PLTD LABUAN", volume: "6000" },
  { name: "PLTD BIMA", volume: "10100" },
  { name: "PLTD LUMOK", volume: "8800" },
  { name: "PLTD LABUAN", volume: "6000" },
  { name: "PLTD BIMA", volume: "10100" },
  { name: "PLTD LUMOK", volume: "8800" },
  { name: "PLTD LABUAN", volume: "6000" },
  { name: "PLTD BIMA", volume: "10100" },
  { name: "PLTD LUMOK", volume: "8800" },
  { name: "PLTD LABUAN", volume: "6000" },
];

export default function Home() {
  const [regional, setRegional] = useState<string | null>(null);
  const [pemasok, setPemasok] = useState<string | null>(null);
  const [transportir, setTransportir] = useState<string | null>(null);
  const [pembangkit, setPembangkit] = useState<string | null>(null);
  const [tbbm, setTbbm] = useState<string | null>(null);
  const [period, setPeriod] = useState<string | null>(null);

  // Monitoring table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Get current date for required startDate and endDate
  const todayDate = new Date().toISOString().split("T")[0];
  const startDate = todayDate;
  const endDate = todayDate;
  
  const { data: monitoringData, isLoading: isMonitoringLoading } =
    useMonitoringRecords({ page, limit: pageSize, startDate, endDate });

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      setPage(newPage);
      setPageSize(newPageSize);
    },
    [],
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Dashboard BBM
            </h1>
          </div>

          <div className="mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Monitoring BBM PLN EPI
            </h2>
            <div className="mb-6 md:mb-8">
              <Map />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                  Filter Data Dashboard
                </h3>
                <div className="flex flex-col gap-2">
                  <FilterAutocomplete
                    label="TBBM"
                    options={tbbmOptions}
                    value={tbbm}
                    onChange={setTbbm}
                    placeholder="Pilih TBBM"
                  />
                  <FilterAutocomplete
                    label="Periode"
                    options={pemasokOptions}
                    value={pemasok}
                    onChange={setPemasok}
                    placeholder="Pilih Periode"
                  />
                </div>
              </div>
              <RealizationChart />
              <TopVolumeList
                title="Terminal Tujuan"
                list={topVolumePembangkit}
                unit=""
                description="List terminal tujuan sesuai TBBM yang terpilih"
              />
            </div>
          </div>
          <div>
            <BBMMonitoringTable
              records={monitoringData?.records ?? []}
              pagination={
                monitoringData?.pagination ?? {
                  page,
                  limit: pageSize,
                  total: 0,
                  totalPages: 0,
                }
              }
              isLoading={isMonitoringLoading}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

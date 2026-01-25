"use client";

import { useEffect, useMemo, useState } from "react";
import FuelTypeDonutChart from "../../components/FuelTypeDonutChart";
import TopVolumeList from "../../components/TopVolumeList";
import RealtimeChart from "../../components/RealtimeChart";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import FilterAutocomplete from "../../components/FilterAutocomplete";

const Map = dynamic(() => import("../../components/Map"), { ssr: false });

interface TopVolumeList {
  name: string;
  volume: string;
}

interface DataPieChart {
  name: string;
  value: number;
  [key: string]: string | number;
}

const COLORS = [
  "#2563EB", // blue-600
  "#16A34A", // green-600
  "#DC2626", // red-600
  "#F59E0B", // amber-500
  "#7C3AED", // violet-600
  "#0EA5E9", // sky-500
  "#22C55E", // green-500
  "#EF4444", // red-500
  "#EAB308", // yellow-500
  "#6366F1", // indigo-500
  "#14B8A6", // teal-500
  "#F97316", // orange-500
  "#84CC16", // lime-500
  "#06B6D4", // cyan-500
  "#A855F7", // purple-500
  "#FB7185", // rose-400
  "#10B981", // emerald-500
  "#3B82F6", // blue-500
  "#F43F5E", // rose-500
  "#8B5CF6", // violet-500
];

const filterTypeOptions = ["Pemasok", "Pembangkit"];

const topVolumePemasok = [
  { name: "PHE ONWJ", volume: "95" },
  { name: "Pertamina EP", volume: "83" },
  { name: "PT PJU", volume: "70" },
  { name: "Medco Indonesia", volume: "63" },
  { name: "PHE Jambi Merang", volume: "55" },
];

const topVolumePembangkit: TopVolumeList[] = [
  { name: "PLTD BIMA", volume: "10100" },
  { name: "PLTD LUMOK", volume: "8800" },
  { name: "PLTD LABUAN", volume: "6000" },
  { name: "PLTD BIMA", volume: "5500" },
  { name: "PLTD LUMOK", volume: "4300" },
];

const detailDataPieChart: DataPieChart[] = [
  { name: "PLTGU GRESIK", value: 55 },
  { name: "PLTMD BIMA", value: 30 },
  { name: "PLTMG GRATI", value: 15 },
  { name: "PLTGU CILEGON", value: 15 },
  { name: "UBP CILEGON", value: 15 },
  { name: "PLTGU MUARA KARANG", value: 48 },
  { name: "PLTGU TANJUNG PRIOK", value: 42 },
  { name: "PLTMG PEAKER PESANGGARAN", value: 36 },
  { name: "PLTGU BELAWAN", value: 33 },
  { name: "PLTMG LOMBOK PEAKER", value: 28 },
  { name: "PLTGU TAMBAK LOROK", value: 46 },
  { name: "PLTMG SANGGAU", value: 22 },
  { name: "PLTMG ARUN", value: 25 },
  { name: "PLTGU CILEGON 2", value: 40 },
  { name: "PLTMG PONTIANAK", value: 20 },
  { name: "PLTMG NABIRE", value: 18 },
  { name: "PLTMG SORONG", value: 26 },
  { name: "PLTGU PEKERJAAN", value: 12 },
  { name: "PLTMG MANOKWARI", value: 14 },
  { name: "PLTGU ACEH", value: 35 },
];

const detailDataPieChartPemasok: DataPieChart[] = [
  { name: "PERTAMINA", value: 120 },
  { name: "SHELL INDONESIA", value: 95 },
  { name: "BP INDONESIA", value: 88 },
  { name: "VIVO ENERGY", value: 72 },
  { name: "AKR CORPORINDO", value: 65 },
  { name: "MEDCO ENERGI", value: 90 },
  { name: "PETRONAS", value: 78 },
  { name: "EXXONMOBIL", value: 110 },
  { name: "TOTALENERGIES", value: 84 },
  { name: "CHEVRON", value: 92 },
  { name: "PUMA ENERGY", value: 60 },
  { name: "REPSOL", value: 55 },
  { name: "SINOPEC", value: 70 },
  { name: "PETROCHINA", value: 68 },
  { name: "ROSNEFT", value: 50 },
];

const daftarKontrakOptions = [
  "001/PKS-PROJECT/PLN/I/2026",
  "CTR-PLN-ENERGI-012/01/2025",
  "SPK/PROJ/045-ENRG/2024",
];

export default function Home() {
  const [openModal, setOpenModal] = useState(false);
  const [filterType, setFilterType] = useState<string | null>("Pemasok");
  const [contractActive, setContractActive] = useState<string | null>(
    "001/PKS-PROJECT/PLN/I/2026",
  );

  const openModalFunction = () => {
    setOpenModal(true);
  };

  const changeFilterType = (value: string | null) => {
    setFilterType(value);
  };

  const dataPieChart = useMemo(() => {
    if (filterType === "Pemasok") return detailDataPieChartPemasok;
    if (filterType === "Pembangkit") return detailDataPieChart;
    return [];
  }, [filterType]);

  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Pipa Gas
              </h1>
              <p className="text-gray-600 mt-1">
                Dashboard untuk monitoring data realtime pipa gas
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Monitoring Gas Pipa PLN EPI
              </h2>
              {/* <div className="flex gap-4 items-center text-gray-800 font-bold">
                <p>Kontrak Aktif</p>
                <div className="w-[300px]">
                  <FilterAutocomplete
                    label=""
                    options={daftarKontrakOptions}
                    value={contractActive}
                    onChange={setContractActive}
                    placeholder="Pilih Kontrak Aktif"
                  />
                </div>
              </div> */}
            </div>

            <div className="mb-8">
              <Map />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <FuelTypeDonutChart
                openModalFunction={openModalFunction}
                data={dataPieChart}
                changeFilterType={changeFilterType}
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
          </div>
        </div>
      </main>

      {openModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenModal(false)}
          />
          <div className="relative bg-white w-full max-w-5xl rounded-xl shadow-lg p-6 z-10">
            <div className="text-right text-gray-900">
              <button
                onClick={() => setOpenModal(false)}
                className="cursor-pointer"
              >
                <X />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl px-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Konsumsi Gas
                  </h3>
                  <div className="w-[200px]">
                    <FilterAutocomplete
                      label=""
                      options={filterTypeOptions}
                      value={filterType}
                      onChange={setFilterType}
                      placeholder="Pilih Filter Berdasar"
                    />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={dataPieChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={100}
                      outerRadius={150}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dataPieChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                  Visualisasi konsumsi gas pada setiap pembangkit PLN EPI per
                  tanggal 13 Januari 2026
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-4">
                  Detail List Pembangkit
                </p>
                <div className="p-8 text-gray-900 h-[400px] overflow-auto border border-gray-200 rounded-lg">
                  {dataPieChart.map((value, index) => {
                    return (
                      <div key={index} className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 bg-[#CCCCCC] rounded-full`}
                            style={{ backgroundColor: COLORS[index] }}
                          ></div>
                          <p className="font-medium">{value.name}</p>
                        </div>
                        <div>{value.value} MMBTU</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

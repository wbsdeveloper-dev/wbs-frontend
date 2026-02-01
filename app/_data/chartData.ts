import { ChartItem, DataPieChart, TopVolumeItem } from "@/app/_types";

// ============================================
// REALTIME CHART DATA
// ============================================

// Daily data for Pemasok A
export const dataJamA: ChartItem[] = [
  { label: "00.00", values: { "Pembangkit 1": 20, "Pembangkit 2": 35, "Pembangkit 3": 45 } },
  { label: "01.00", values: { "Pembangkit 1": 18, "Pembangkit 2": 30, "Pembangkit 3": 40 } },
  { label: "02.00", values: { "Pembangkit 1": 15, "Pembangkit 2": 28, "Pembangkit 3": 48 } },
  { label: "03.00", values: { "Pembangkit 1": 12, "Pembangkit 2": 25, "Pembangkit 3": 45 } },
  { label: "04.00", values: { "Pembangkit 1": 10, "Pembangkit 2": 22, "Pembangkit 3": 42 } },
  { label: "05.00", values: { "Pembangkit 1": 15, "Pembangkit 2": 30, "Pembangkit 3": 40 } },
  { label: "06.00", values: { "Pembangkit 1": 30, "Pembangkit 2": 45, "Pembangkit 3": 45 } },
  { label: "07.00", values: { "Pembangkit 1": 45, "Pembangkit 2": 60, "Pembangkit 3": 40 } },
  { label: "08.00", values: { "Pembangkit 1": 60, "Pembangkit 2": 70, "Pembangkit 3": 40 } },
  { label: "09.00", values: { "Pembangkit 1": 70, "Pembangkit 2": 80, "Pembangkit 3": 40 } },
  { label: "10.00", values: { "Pembangkit 1": 75, "Pembangkit 2": 85, "Pembangkit 3": 45 } },
  { label: "11.00", values: { "Pembangkit 1": 80, "Pembangkit 2": 90, "Pembangkit 3": 40 } },
  { label: "12.00", values: { "Pembangkit 1": 85, "Pembangkit 2": 95, "Pembangkit 3": 45 } },
  { label: "13.00", values: { "Pembangkit 1": 82, "Pembangkit 2": 92, "Pembangkit 3": 42 } },
  { label: "14.00", values: { "Pembangkit 1": 78, "Pembangkit 2": 88, "Pembangkit 3": 48 } },
  { label: "15.00", values: { "Pembangkit 1": 72, "Pembangkit 2": 82, "Pembangkit 3": 42 } },
  { label: "16.00", values: { "Pembangkit 1": 65, "Pembangkit 2": 75, "Pembangkit 3": 45 } },
  { label: "17.00", values: { "Pembangkit 1": 60, "Pembangkit 2": 70, "Pembangkit 3": 40 } },
  { label: "18.00", values: { "Pembangkit 1": 55, "Pembangkit 2": 65, "Pembangkit 3": 45 } },
  { label: "19.00", values: { "Pembangkit 1": 50, "Pembangkit 2": 60, "Pembangkit 3": 40 } },
  { label: "20.00", values: { "Pembangkit 1": 45, "Pembangkit 2": 55, "Pembangkit 3": 45 } },
  { label: "21.00", values: { "Pembangkit 1": 40, "Pembangkit 2": 50, "Pembangkit 3": 40 } },
  { label: "22.00", values: { "Pembangkit 1": 30, "Pembangkit 2": 45, "Pembangkit 3": 45 } },
  { label: "23.00", values: { "Pembangkit 1": 25, "Pembangkit 2": 40, "Pembangkit 3": 40 } },
];

export const dataJamAMean: Record<string, number> = {
  "Pembangkit 1": 48.83,
  "Pembangkit 2": 63.63,
  "Pembangkit 3": 42.79,
};

// Daily data for Pemasok B
export const dataJamB: ChartItem[] = [
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

// Weekly data
export const data1Minggu: ChartItem[] = [
  { label: "Senin", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Selasa", values: { pembangkit: 70, pemasok: 82 } },
  { label: "Rabu", values: { pembangkit: 72, pemasok: 85 } },
  { label: "Kamis", values: { pembangkit: 75, pemasok: 88 } },
  { label: "Jumat", values: { pembangkit: 78, pemasok: 90 } },
  { label: "Sabtu", values: { pembangkit: 74, pemasok: 86 } },
  { label: "Minggu", values: { pembangkit: 70, pemasok: 83 } },
];

// 3-month data
export const data3Bulan: ChartItem[] = [
  { label: "Juli", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Agustus", values: { pembangkit: 72, pemasok: 85 } },
  { label: "September", values: { pembangkit: 78, pemasok: 90 } },
];

// 6-month data
export const data6Bulan: ChartItem[] = [
  { label: "April", values: { pembangkit: 60, pemasok: 72 } },
  { label: "Mei", values: { pembangkit: 65, pemasok: 76 } },
  { label: "Juni", values: { pembangkit: 68, pemasok: 80 } },
  { label: "Juli", values: { pembangkit: 70, pemasok: 83 } },
  { label: "Agustus", values: { pembangkit: 74, pemasok: 87 } },
  { label: "September", values: { pembangkit: 78, pemasok: 90 } },
];

// Yearly data
export const data1Tahun: ChartItem[] = [
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

// Helper function to get data by period
export function getChartDataByPeriod(period: string, pemasok: string): ChartItem[] {
  if (period === "1D") return pemasok === "Pemasok A" ? dataJamA : dataJamB;
  if (period === "1W") return data1Minggu;
  if (period === "3M") return data3Bulan;
  if (period === "6M") return data6Bulan;
  if (period === "1Y") return data1Tahun;
  return dataJamA;
}

// ============================================
// GAS CONSUMPTION DATA
// ============================================

export const detailDataPieChart: DataPieChart[] = [
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

export const detailDataPieChartPemasok: DataPieChart[] = [
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

export function getPieChartDataByType(filterType: string | null): DataPieChart[] {
  if (filterType === "Pemasok") return detailDataPieChartPemasok;
  if (filterType === "Pembangkit") return detailDataPieChart;
  return [];
}

// ============================================
// TOP VOLUME DATA
// ============================================

export const topVolumePemasok: TopVolumeItem[] = [
  { name: "PHE ONWJ", volume: "95" },
  { name: "Pertamina EP", volume: "83" },
  { name: "PT PJU", volume: "70" },
  { name: "Medco Indonesia", volume: "63" },
  { name: "PHE Jambi Merang", volume: "55" },
];

export const topVolumePembangkit: TopVolumeItem[] = [
  { name: "PLTD BIMA", volume: "10100" },
  { name: "PLTD LUMOK", volume: "8800" },
  { name: "PLTD LABUAN", volume: "6000" },
  { name: "PLTD BIMA", volume: "5500" },
  { name: "PLTD LUMOK", volume: "4300" },
];

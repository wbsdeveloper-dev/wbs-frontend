// Shared TypeScript types for the application

export interface ChartItem {
  label: string;
  values: Record<string, number>;
}

export interface TopVolumeItem {
  name: string;
  volume: string;
}

export interface DataPieChart {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface TooltipPayload {
  name: string;
  value: number;
  color?: string;
  dataKey?: string;
}

export interface SelectedPoint {
  label: string;
  series: string;
  value: number;
}

export interface Pembangkit {
  id: string;
  name: string;
  jenis: string;
  region: string;
  lat: string;
  long: string;
  kapasitas: string;
}

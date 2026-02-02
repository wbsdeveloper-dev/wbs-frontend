// Shared chart colors used across the application
export const CHART_COLORS = [
  "#4F8EF7", // soft blue
  "#34C77B", // soft green
  "#F87171", // soft red
  "#FBBF24", // soft amber
  "#8B7CF6", // soft violet
  "#38BDF8", // soft sky
  "#4ADE80", // soft mint
  "#FB7185", // soft rose
  "#FACC15", // soft yellow
  "#6366F1", // soft indigo
  "#2DD4BF", // soft teal
  "#FB923C", // soft orange
  "#A3E635", // soft lime
  "#22D3EE", // soft cyan
  "#A78BFA", // soft purple
  "#F472B6", // soft pink
  "#34D399", // soft emerald
  "#60A5FA", // soft blue light
  "#F43F5E", // soft rose strong
  "#7C3AED", // soft violet strong
] as const;

// Pembangkit-specific colors for line charts
export const PEMBANGKIT_COLORS: Record<string, string> = {
  "Pembangkit 1": "#f87171",
  "Pembangkit 2": "#fb923c",
  "Pembangkit 3": "#facc15",
  "Pembangkit 4": "#60a5fa",
  "Mean Pembangkit 1": "#f87171",
  "Mean Pembangkit 2": "#fb923c",
  "Mean Pembangkit 3": "#facc15",
  "Mean Pembangkit 4": "#60a5fa",
};

// Theme colors
export const THEME = {
  primary: "#14a1bb",
  primaryHover: "#115d72",
  primaryLight: "#14a2bb92",
} as const;

// Filter options
export const FILTER_OPTIONS = {
  filterType: ["Pemasok", "Pembangkit"],
  pemasok: ["Pemasok A", "Pemasok B"],
  transportir: ["Transportir X", "Transportir Y"],
  pembangkitA: ["Pembangkit 1", "Pembangkit 2", "Pembangkit 3"],
  pembangkitB: ["Pembangkit 3", "Pembangkit 4"],
} as const;

export type AdminChartThemeMode = "light" | "dark";

// More vibrant, higher-contrast palette (works on both light/dark backgrounds).
export const adminChartPalette = [
  "#6366F1", // indigo
  "#06B6D4", // cyan
  "#F97316", // orange
  "#EF4444", // red
  "#10B981", // emerald
  "#F59E0B", // amber
  "#A855F7", // purple
  "#22C55E", // green
];

export const adminLeadClassColors: Record<"hot" | "warm" | "cold", string> = {
  hot: "#EF4444",
  warm: "#F59E0B",
  cold: "#06B6D4",
};

export function adminAxisTickColor(mode: AdminChartThemeMode) {
  return mode === "dark" ? "#A1A1AA" : "#64748B"; // zinc-400 / slate-500
}

export function adminGridStroke(mode: AdminChartThemeMode) {
  return mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)";
}


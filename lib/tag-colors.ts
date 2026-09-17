import { TAG_COLORS, type TagColor } from "@/lib/sequenzy";

export { TAG_COLORS };
export type { TagColor };

// Representative hex swatches for Sequenzy's named tag colors (Tailwind 500 shades).
export const TAG_COLOR_HEX: Record<TagColor, string> = {
  gray: "#6b7280",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8a2be2",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
};

export function tagColorHex(color?: string): string {
  if (color && color in TAG_COLOR_HEX) return TAG_COLOR_HEX[color as TagColor];
  return TAG_COLOR_HEX.violet;
}

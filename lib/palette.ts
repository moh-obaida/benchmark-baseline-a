export const BRAND_COLOR = "#EEDCEE";
export const BRAND_FONT = "Tajawal";

export const PASTEL_PALETTE = [
  { id: "lavender", hex: "#EEDCEE", label: "لافندر" },
  { id: "blush", hex: "#F3E4E6", label: "وردي هادئ" },
  { id: "sage", hex: "#DCE6DC", label: "مريمية" },
  { id: "dust", hex: "#D7E2EA", label: "أزرق مغبر" },
  { id: "cream", hex: "#F3EDE3", label: "كريمي" },
  { id: "mist", hex: "#E7E4EF", label: "ضباب" },
  { id: "sand", hex: "#EFE6DC", label: "رملي" },
  { id: "stone", hex: "#E6E4E2", label: "رمادي هادئ" },
] as const;

export type PaletteId = (typeof PASTEL_PALETTE)[number]["id"];

const paletteIds = new Set<string>(PASTEL_PALETTE.map((item) => item.id));

export function paletteHex(id: string) {
  return PASTEL_PALETTE.find((item) => item.id === id)?.hex ?? BRAND_COLOR;
}

export function paletteId(id: string): PaletteId {
  if (paletteIds.has(id)) return id as PaletteId;
  return "lavender";
}

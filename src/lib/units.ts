export const UNIT_TYPES = [
  { value: "piece", label: "Piece" },
  { value: "kg", label: "Kilogram" },
  { value: "gram", label: "Gram" },
  { value: "litre", label: "Litre" },
  { value: "ml", label: "Millilitre" },
  { value: "box", label: "Box" },
  { value: "packet", label: "Packet" },
  { value: "dozen", label: "Dozen" },
  { value: "meter", label: "Meter" },
] as const;

export function unitTypeLabel(value: string | null | undefined) {
  if (!value) return "—";
  return UNIT_TYPES.find((t) => t.value === value)?.label ?? value;
}

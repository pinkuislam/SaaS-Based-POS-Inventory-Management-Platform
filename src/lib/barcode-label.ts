export type BarcodeFormat = "CODE128" | "EAN13" | "UPC" | "CODE39";

export type LabelSize = "small" | "medium" | "large";

export type BarcodeLabelOptions = {
  format: BarcodeFormat;
  labelSize: LabelSize;
  showName: boolean;
  showSku: boolean;
  showPrice: boolean;
  copies: number;
};

export const DEFAULT_LABEL_OPTIONS: BarcodeLabelOptions = {
  format: "CODE128",
  labelSize: "medium",
  showName: true,
  showSku: true,
  showPrice: true,
  copies: 1,
};

export const LABEL_SIZE_STYLES: Record<
  LabelSize,
  { width: string; nameSize: string; priceSize: string }
> = {
  small: { width: "140px", nameSize: "9px", priceSize: "8px" },
  medium: { width: "180px", nameSize: "11px", priceSize: "10px" },
  large: { width: "240px", nameSize: "13px", priceSize: "12px" },
};

export function generateBarcodeValue(
  product: { id: string; sku: string | null; barcode: string | null }
): string {
  if (product.barcode?.trim()) return product.barcode.trim();
  if (product.sku?.trim()) return product.sku.trim();
  return product.id.slice(-12).toUpperCase();
}

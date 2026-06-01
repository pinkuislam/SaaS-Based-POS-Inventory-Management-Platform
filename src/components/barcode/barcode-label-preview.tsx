"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import {
  LABEL_SIZE_STYLES,
  type BarcodeFormat,
  type BarcodeLabelOptions,
  type LabelSize,
} from "@/lib/barcode-label";

export type BarcodeProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  sellingPrice: number;
};

export function renderBarcodeSvg(
  code: string,
  format: BarcodeFormat
): SVGSVGElement | null {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  try {
    JsBarcode(svg, code, {
      format,
      width: format === "CODE128" ? 1.5 : 1.2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      margin: 5,
    });
    return svg;
  } catch {
    return null;
  }
}

export function BarcodeLabelBlock({
  product,
  code,
  options,
}: {
  product: BarcodeProduct;
  code: string;
  options: Pick<
    BarcodeLabelOptions,
    "format" | "labelSize" | "showName" | "showSku" | "showPrice"
  >;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const size = LABEL_SIZE_STYLES[options.labelSize as LabelSize];

  useEffect(() => {
    if (!canvasRef.current) return;
    const svg = renderBarcodeSvg(code, options.format);
    canvasRef.current.innerHTML = "";
    if (svg) canvasRef.current.appendChild(svg);
    else canvasRef.current.textContent = "Invalid barcode";
  }, [code, options.format]);

  return (
    <div
      className="label inline-block text-center p-2 border border-dashed"
      style={{ width: size.width }}
    >
      {options.showName ? (
        <div
          className="name font-bold mb-1 break-words"
          style={{ fontSize: size.nameSize }}
        >
          {product.name}
        </div>
      ) : null}
      {options.showSku && product.sku ? (
        <div className="text-[9px] text-muted-foreground mb-1">
          SKU: {product.sku}
        </div>
      ) : null}
      <div ref={canvasRef} className="barcode-canvas" />
      {options.showPrice ? (
        <div className="price mt-1" style={{ fontSize: size.priceSize }}>
          ৳{Number(product.sellingPrice).toFixed(2)}
        </div>
      ) : null}
    </div>
  );
}

export function buildBarcodePrintHtml(
  labelsHtml: string,
  title: string
): string {
  return `
    <html><head><title>${title}</title>
    <style>
      body { font-family: sans-serif; margin: 0; padding: 8px; }
      .label { display: inline-block; text-align: center; padding: 8px; margin: 4px; border: 1px dashed #ccc; page-break-inside: avoid; }
      .name { font-weight: bold; margin-bottom: 4px; word-wrap: break-word; }
      .price { margin-top: 4px; }
    </style></head><body>${labelsHtml}</body></html>`;
}

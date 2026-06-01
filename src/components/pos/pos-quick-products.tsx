"use client";

import { useEffect, useState } from "react";
import { formatCurrency, decimalToNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type QuickProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  sellingPrice: unknown;
  stockQty: unknown;
  reorderLevel?: unknown;
  taxRate: unknown;
};

export function PosQuickProducts({
  onSelect,
}: {
  onSelect: (product: QuickProduct) => void;
}) {
  const [products, setProducts] = useState<QuickProduct[]>([]);

  useEffect(() => {
    fetch("/api/pos/quick-products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Quick products
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {products.map((p) => {
          const stock = decimalToNumber(p.stockQty);
          const out = stock <= 0;
          return (
            <button
              key={p.id}
              type="button"
              disabled={out}
              onClick={() => onSelect(p)}
              className="shrink-0 flex flex-col items-center gap-1 rounded-lg border bg-card p-2 min-w-[88px] hover:bg-muted disabled:opacity-50"
            >
              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt=""
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">
                    {p.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-center line-clamp-2 leading-tight">
                {p.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(decimalToNumber(p.sellingPrice))}
              </span>
              {out ? (
                <Badge variant="destructive" className="text-[10px] px-1">
                  Out
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

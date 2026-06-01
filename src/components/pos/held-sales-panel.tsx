"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, decimalToNumber, formatDate } from "@/lib/utils";
import { Play, RefreshCw, RotateCcw, X } from "lucide-react";
import { usePosStore } from "@/stores/pos-store";

interface HeldSale {
  id: string;
  invoiceNo: string;
  total: unknown;
  discount: unknown;
  createdAt: string;
  customerId: string | null;
  customer?: { name: string } | null;
  items: {
    quantity: unknown;
    unitPrice: unknown;
    discount: unknown;
    product: {
      id: string;
      name: string;
      sku: string | null;
      barcode: string | null;
      stockQty: unknown;
      taxRate: unknown;
    };
  }[];
}

export function HeldSalesPanel({ onResume }: { onResume?: () => void }) {
  const [held, setHeld] = useState<HeldSale[]>([]);
  const [loading, setLoading] = useState(false);
  const loadHeldSale = usePosStore((s) => s.loadHeldSale);
  const clearCart = usePosStore((s) => s.clearCart);

  async function loadHeld() {
    const res = await fetch("/api/sales/hold");
    if (res.ok) setHeld(await res.json());
  }

  useEffect(() => {
    loadHeld();
  }, []);

  async function completeSale(id: string, total: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: total, paymentMethod: "cash" }),
      });
      if (!res.ok) throw new Error();
      const sale = await res.json();
      notify.success(`Sale completed: ${sale.invoiceNo}`);
      await loadHeld();
      onResume?.();
    } catch {
      notify.error("Failed to complete held sale");
    } finally {
      setLoading(false);
    }
  }

  async function resumeToCart(sale: HeldSale) {
    clearCart();
    loadHeldSale({
      customerId: sale.customerId,
      customerName: sale.customer?.name || "Walk-in Customer",
      invoiceDiscount: decimalToNumber(sale.discount),
      items: sale.items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        barcode: item.product.barcode,
        unitPrice: decimalToNumber(item.unitPrice),
        quantity: decimalToNumber(item.quantity),
        discount: decimalToNumber(item.discount),
        taxRate: decimalToNumber(item.product.taxRate),
        stockQty: decimalToNumber(item.product.stockQty),
      })),
    });
    try {
      await fetch(`/api/sales/${sale.id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Resumed to POS cart" }),
      });
      await loadHeld();
      notify.success("Sale loaded into cart");
      onResume?.();
    } catch {
      notify.error("Loaded cart but could not remove held record");
    }
  }

  async function cancelHeld(sale: HeldSale) {
    const ok = await confirmDelete(`Cancel held sale ${sale.invoiceNo}?`);
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${sale.id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Held sale cancelled" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      notify.success("Held sale cancelled");
      await loadHeld();
      onResume?.();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed to cancel");
    } finally {
      setLoading(false);
    }
  }

  if (held.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Held Sales ({held.length})</p>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadHeld}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {held.map((sale) => (
          <div
            key={sale.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm border rounded p-2"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs">{sale.invoiceNo}</p>
              <p className="text-muted-foreground truncate">
                {sale.customer?.name || "Walk-in"} · {sale.items.length} items
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(sale.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1 shrink-0">
              <Badge variant="secondary">
                {formatCurrency(decimalToNumber(sale.total))}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={loading}
                onClick={() => resumeToCart(sale)}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Resume
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={loading}
                onClick={() =>
                  completeSale(sale.id, decimalToNumber(sale.total))
                }
              >
                <Play className="h-3 w-3 mr-1" />
                Pay
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-destructive"
                disabled={loading}
                onClick={() => cancelHeld(sale)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

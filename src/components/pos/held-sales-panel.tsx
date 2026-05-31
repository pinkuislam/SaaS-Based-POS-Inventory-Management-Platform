"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, decimalToNumber, formatDate } from "@/lib/utils";
import { Play, RefreshCw } from "lucide-react";

interface HeldSale {
  id: string;
  invoiceNo: string;
  total: unknown;
  createdAt: string;
  customer?: { name: string } | null;
  items: { quantity: unknown; product: { name: string } }[];
}

export function HeldSalesPanel({ onResume }: { onResume?: () => void }) {
  const [held, setHeld] = useState<HeldSale[]>([]);
  const [loading, setLoading] = useState(false);

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
      toast.success(`Sale completed: ${sale.invoiceNo}`);
      await loadHeld();
      onResume?.();
    } catch {
      toast.error("Failed to complete held sale");
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
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {held.map((sale) => (
          <div
            key={sale.id}
            className="flex items-center justify-between gap-2 text-sm border rounded p-2"
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
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary">
                {formatCurrency(decimalToNumber(sale.total))}
              </Badge>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

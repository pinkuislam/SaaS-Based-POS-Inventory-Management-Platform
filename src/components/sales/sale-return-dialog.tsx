"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RotateCcw } from "lucide-react";
import { decimalToNumber } from "@/lib/utils";

interface SaleItemRow {
  id: string;
  productId: string;
  quantity: unknown;
  returnedQty: unknown;
  product: { name: string };
}

export function SaleReturnDialog({
  saleId,
  invoiceNo,
  items,
  status,
}: {
  saleId: string;
  invoiceNo: string;
  items: SaleItemRow[];
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [returnQtys, setReturnQtys] = useState<Record<string, string>>({});
  const [returnReason, setReturnReason] = useState("");

  if (status === "RETURNED" || status === "CANCELLED") {
    return null;
  }

  const returnableItems = items.map((item) => {
    const max =
      decimalToNumber(item.quantity) - decimalToNumber(item.returnedQty);
    return { ...item, maxReturn: max };
  });

  async function handleFullReturn() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success(`Full return processed for ${invoiceNo}`);
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Return failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePartialReturn(e: React.FormEvent) {
    e.preventDefault();
    const returnItems = returnableItems
      .map((item) => ({
        saleItemId: item.id,
        quantity: parseFloat(returnQtys[item.id] || "0"),
      }))
      .filter((i) => i.quantity > 0);

    if (returnItems.length === 0) {
      toast.error("Enter quantities to return");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: returnItems, returnReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Return processed — stock restored");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Return failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg hover:bg-muted h-8 px-2 text-sm">
        <RotateCcw className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Return — {invoiceNo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Return reason</Label>
            <Input
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Defective, Wrong item"
            />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleFullReturn}
            disabled={loading}
          >
            Full Return (all items)
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Partial return
              </span>
            </div>
          </div>

          <form onSubmit={handlePartialReturn} className="space-y-3">
            {returnableItems.map((item) =>
              item.maxReturn > 0 ? (
                <div key={item.id} className="flex items-center gap-2">
                  <Label className="flex-1 text-sm truncate">
                    {item.product.name}
                    <span className="text-muted-foreground ml-1">
                      (max {item.maxReturn})
                    </span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={item.maxReturn}
                    step="any"
                    className="w-20 h-8"
                    value={returnQtys[item.id] || ""}
                    onChange={(e) =>
                      setReturnQtys({ ...returnQtys, [item.id]: e.target.value })
                    }
                  />
                </div>
              ) : null
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Process Partial Return"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

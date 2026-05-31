"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RotateCcw } from "lucide-react";
import { decimalToNumber } from "@/lib/utils";

interface PurchaseItemRow {
  id: string;
  quantity: unknown;
  returnedQty: unknown;
  product: { name: string };
}

export function PurchaseReturnDialog({
  purchaseId,
  invoiceNo,
  items,
  status,
}: {
  purchaseId: string;
  invoiceNo: string;
  items: PurchaseItemRow[];
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [returnQtys, setReturnQtys] = useState<Record<string, string>>({});

  if (status === "RETURNED" || status === "CANCELLED") return null;

  const returnableItems = items.map((item) => ({
    ...item,
    maxReturn:
      decimalToNumber(item.quantity) - decimalToNumber(item.returnedQty),
  }));

  async function handleFullReturn() {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Return failed");
      notify.success(`Purchase ${invoiceNo} fully returned`);
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Return failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePartialReturn(e: React.FormEvent) {
    e.preventDefault();
    const returnItems = returnableItems
      .map((item) => ({
        purchaseItemId: item.id,
        quantity: parseFloat(returnQtys[item.id] || "0"),
      }))
      .filter((i) => i.quantity > 0);

    if (returnItems.length === 0) {
      notify.error("Enter quantities to return");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: returnItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Return failed");
      notify.success("Purchase return processed — stock reduced");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Return failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <RotateCcw className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Return — {invoiceNo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Returning stock to supplier will decrease your inventory.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleFullReturn}
            disabled={loading}
          >
            Full Return
          </Button>
          <form onSubmit={handlePartialReturn} className="space-y-3" noValidate>
            {returnableItems.map((item) =>
              item.maxReturn > 0 ? (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm truncate">
                    {item.product.name}
                    <span className="text-muted-foreground ml-1">
                      (max {item.maxReturn})
                    </span>
                  </span>
                  <FormInput
                    type="number"
                    min="0"
                    max={item.maxReturn}
                    step="any"
                    className="w-20 h-8"
                    value={returnQtys[item.id] || ""}
                    onChange={(e) =>
                      setReturnQtys({
                        ...returnQtys,
                        [item.id]: e.target.value,
                      })
                    }
                  />
                </div>
              ) : null
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              Partial Return
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SerializedDuePurchase } from "@/lib/serialize";

export function SupplierPaymentDialog({
  supplierId,
  supplierName,
  duePurchases,
  totalDue,
}: {
  supplierId: string;
  supplierName: string;
  duePurchases: SerializedDuePurchase[];
  totalDue: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [purchaseId, setPurchaseId] = useState("all");
  const [notes, setNotes] = useState("");

  if (totalDue <= 0) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount,
          method,
          purchaseId: purchaseId === "all" ? null : purchaseId,
          notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Payment recorded");
      setOpen(false);
      setAmount("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-2.5 text-sm font-medium">
        <Banknote className="h-4 w-4" />
        Pay
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Supplier — {supplierName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Total payable: {formatCurrency(totalDue)}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Purchase invoice</Label>
            <Select value={purchaseId} onValueChange={(v) => v && setPurchaseId(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (oldest first)</SelectItem>
                {duePurchases.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.invoiceNo} — {formatCurrency(p.dueAmount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => v && setMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

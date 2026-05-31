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
import { ArrowLeftRight } from "lucide-react";
import type { SerializedProductStockOption } from "@/lib/serialize";

interface BranchOption {
  id: string;
  name: string;
}

export function StockTransferDialog({
  products,
  branches,
}: {
  products: SerializedProductStockOption[];
  branches: BranchOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  if (branches.length < 2) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!productId || !toBranchId || !qty) {
      toast.error("Fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          fromBranchId: fromBranchId || null,
          toBranchId,
          quantity: qty,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Transfer complete (${data.reference})`);
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg border bg-background hover:bg-muted h-8 px-2.5 text-sm font-medium">
        <ArrowLeftRight className="h-4 w-4" />
        Transfer Stock
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Branch Stock Transfer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={productId} onValueChange={(v) => v && setProductId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (stock: {p.stockQty})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From branch</Label>
            <Select
              value={fromBranchId || "any"}
              onValueChange={(v) => setFromBranchId(v === "any" ? "" : v || "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Current / any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Product&apos;s branch</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To branch *</Label>
            <Select value={toBranchId} onValueChange={(v) => v && setToBranchId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity *</Label>
            <Input
              type="number"
              min="0.001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Transferring..." : "Transfer Stock"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

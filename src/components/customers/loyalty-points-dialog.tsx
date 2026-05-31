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
import { Gift } from "lucide-react";

export function LoyaltyPointsDialog({
  customerId,
  customerName,
  currentPoints,
}: {
  customerId: string;
  customerName: string;
  currentPoints: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState("");
  const [adjustPoints, setAdjustPoints] = useState(String(currentPoints));

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/loyalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "redeem",
          points: parseInt(redeemPoints, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        `Redeemed ${data.pointsRedeemed} points (৳${data.discountValue} discount value)`
      );
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/loyalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust",
          points: parseInt(adjustPoints, 10),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Points updated");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg border px-3 h-8 text-sm hover:bg-muted">
        <Gift className="h-4 w-4" />
        Loyalty ({currentPoints} pts)
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Loyalty — {customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <form onSubmit={handleRedeem} className="space-y-3">
            <Label>Redeem points</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max={currentPoints}
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                placeholder={`Max ${currentPoints}`}
              />
              <Button type="submit" disabled={loading || currentPoints === 0}>
                Redeem
              </Button>
            </div>
          </form>
          <form onSubmit={handleAdjust} className="space-y-3 border-t pt-4">
            <Label>Manual adjust balance</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
              />
              <Button type="submit" variant="outline" disabled={loading}>
                Set
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

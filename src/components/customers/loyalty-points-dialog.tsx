"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { loyaltySchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
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

  const redeemForm = useValidatedForm({ points: "", note: "" }, loyaltySchema);
  const adjustForm = useValidatedForm(
    { points: String(currentPoints), note: "" },
    loyaltySchema
  );

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    const data = redeemForm.validate();
    if (!data) return;

    const pts = parseInt(data.points, 10);
    if (pts > currentPoints) {
      notify.error(`Maximum ${currentPoints} points available`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/loyalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", points: pts }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success(
        `Redeemed ${resData.pointsRedeemed} points (৳${resData.discountValue} discount value)`
      );
      setOpen(false);
      redeemForm.reset();
      router.refresh();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    const data = adjustForm.validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/loyalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust",
          points: parseInt(data.points, 10),
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Points updated");
      setOpen(false);
      router.refresh();
    } catch {
      notify.error("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Gift className="h-4 w-4" />
        Loyalty ({currentPoints} pts)
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Loyalty — {customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <form onSubmit={handleRedeem} className="space-y-3" noValidate>
            <FormField
              label="Redeem points"
              htmlFor="redeemPoints"
              error={redeemForm.fieldError("points")}
            >
              <div className="flex gap-2">
                <FormInput
                  id="redeemPoints"
                  name="redeemPoints"
                  type="number"
                  min="1"
                  max={currentPoints}
                  value={redeemForm.values.points}
                  error={redeemForm.fieldError("points")}
                  onChange={(e) => redeemForm.setField("points", e.target.value)}
                  placeholder={`Max ${currentPoints}`}
                />
                <Button type="submit" disabled={loading || currentPoints === 0}>
                  Redeem
                </Button>
              </div>
            </FormField>
          </form>
          <form
            onSubmit={handleAdjust}
            className="space-y-3 border-t pt-4"
            noValidate
          >
            <FormField
              label="Manual adjust balance"
              htmlFor="adjustPoints"
              error={adjustForm.fieldError("points")}
            >
              <div className="flex gap-2">
                <FormInput
                  id="adjustPoints"
                  name="adjustPoints"
                  type="number"
                  min="0"
                  value={adjustForm.values.points}
                  error={adjustForm.fieldError("points")}
                  onChange={(e) =>
                    adjustForm.setField("points", e.target.value)
                  }
                />
                <Button type="submit" variant="outline" disabled={loading}>
                  Set
                </Button>
              </div>
            </FormField>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

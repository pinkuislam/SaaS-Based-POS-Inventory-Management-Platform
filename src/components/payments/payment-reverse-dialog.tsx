"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField, FormTextarea } from "@/components/ui/form-field";

export function PaymentReverseDialog({
  paymentId,
  paymentType,
  disabled,
  onSuccess,
}: {
  paymentId: string;
  paymentType: "customer" | "supplier";
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReverse() {
    if (!reason.trim()) {
      notify.error("Reason is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/${paymentId}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: paymentType, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reverse failed");
      notify.success("Payment reversed");
      setOpen(false);
      setReason("");
      onSuccess?.();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Reverse failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" disabled={disabled}>
            Reverse
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reverse payment</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This marks the payment as reversed and updates linked sale balances when
          applicable.
        </p>
        <FormField label="Reason" required>
          <FormTextarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this payment being reversed?"
            rows={3}
          />
        </FormField>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReverse} disabled={loading}>
            {loading ? "Reversing..." : "Confirm reverse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

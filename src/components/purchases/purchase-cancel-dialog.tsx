"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Ban } from "lucide-react";

export function PurchaseCancelDialog({
  purchaseId,
  invoiceNo,
  status,
}: {
  purchaseId: string;
  invoiceNo: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  if (status !== "COMPLETED") return null;

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      notify.error("Reason is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Purchase cancelled");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Ban className="h-4 w-4 mr-1" />
        Cancel
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Purchase {invoiceNo}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCancel} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Stock added by this purchase will be reversed. This action is
            logged.
          </p>
          <FormField label="Reason" htmlFor="cancel-reason" required>
            <FormTextarea
              id="cancel-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
          <Button type="submit" variant="destructive" disabled={loading}>
            {loading ? "Cancelling..." : "Confirm Cancel"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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

export function SaleVoidDialog({
  saleId,
  invoiceNo,
  status,
}: {
  saleId: string;
  invoiceNo: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  async function handleVoid(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      notify.error("Reason is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Sale voided");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Void failed");
    } finally {
      setLoading(false);
    }
  }

  if (status === "CANCELLED") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Ban className="h-4 w-4 mr-1" />
        Void
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void Invoice {invoiceNo}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleVoid} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will cancel the sale and restore stock. A reason is required
            for the audit log.
          </p>
          <FormField label="Reason" htmlFor="void-reason" required>
            <FormTextarea
              id="void-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Wrong items, customer cancelled"
            />
          </FormField>
          <Button type="submit" variant="destructive" disabled={loading}>
            {loading ? "Voiding..." : "Confirm Void"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

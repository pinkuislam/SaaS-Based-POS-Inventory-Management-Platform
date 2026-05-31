"use client";

import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";

export function InvoiceMarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();

  async function markPaid() {
    const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    if (res.ok) {
      notify.success("Marked as paid");
      router.refresh();
    } else notify.error("Failed");
  }

  return (
    <Button size="sm" variant="outline" onClick={markPaid}>
      Mark Paid
    </Button>
  );
}

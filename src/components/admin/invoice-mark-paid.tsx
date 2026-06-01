"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { ActionButton } from "@/components/admin/loading-button";

export function InvoiceMarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markPaid() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (res.ok) {
        notify.success("Marked as paid");
        router.refresh();
      } else {
        notify.error("Failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionButton
      size="sm"
      variant="outline"
      loading={loading}
      loadingText="..."
      onClick={markPaid}
    >
      Mark Paid
    </ActionButton>
  );
}

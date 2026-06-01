"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { ActionButton } from "@/components/admin/loading-button";
import { Mail } from "lucide-react";

export function InvoiceSendButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.sent === false) {
        notify.warning("SMTP not configured — email logged only");
      } else {
        notify.success(`Invoice emailed to ${data.tenantEmail}`);
      }
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionButton
      size="sm"
      variant="outline"
      onClick={send}
      loading={loading}
      loadingText="Sending..."
    >
      <Mail className="mr-1 h-3 w-3" />
      Email
    </ActionButton>
  );
}

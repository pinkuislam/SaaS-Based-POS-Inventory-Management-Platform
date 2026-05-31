"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, Printer, Download } from "lucide-react";

export function SubscriptionInvoiceActions({
  invoiceId,
}: {
  invoiceId: string;
}) {
  const viewHref = `/admin/invoices/${invoiceId}`;
  const printHref = `/admin/invoices/${invoiceId}?print=1`;
  const downloadHref = `/api/admin/invoices/${invoiceId}/download`;

  return (
    <div className="flex items-center gap-1">
      <Link href={viewHref} title="View invoice">
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={printHref} target="_blank" title="Print invoice">
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Printer className="h-4 w-4" />
        </Button>
      </Link>
      <a href={downloadHref} download title="Download invoice">
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>
      </a>
    </div>
  );
}

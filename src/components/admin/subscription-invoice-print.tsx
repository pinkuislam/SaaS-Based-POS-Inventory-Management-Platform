"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, ArrowLeft } from "lucide-react";
import type { SubscriptionInvoiceDetail } from "@/lib/admin/subscription-invoice-detail";

export function SubscriptionInvoicePrint({
  data,
  autoPrint = false,
}: {
  data: SubscriptionInvoiceDetail;
  autoPrint?: boolean;
}) {
  const { invoice, tenant, platform } = data;

  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  const downloadUrl = `/api/admin/invoices/${invoice.id}/download`;

  return (
    <>
      <div className="print:hidden mb-6 flex flex-wrap items-center gap-2">
        <Link href="/admin/invoices">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to invoices
          </Button>
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" />
          Print
        </Button>
        <a href={downloadUrl} download>
          <Button size="sm" variant="outline">
            <Download className="mr-1 h-4 w-4" />
            Download HTML
          </Button>
        </a>
      </div>

      <div
        id="subscription-invoice"
        className="mx-auto max-w-2xl rounded-lg border bg-white p-8 text-foreground print:border-0 print:shadow-none print:max-w-none"
      >
        <div className="flex flex-wrap justify-between gap-6 border-b-2 border-foreground pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{platform.name}</h1>
            <p className="text-sm text-muted-foreground">Subscription Invoice</p>
            {platform.email ? (
              <p className="text-sm text-muted-foreground">{platform.email}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="font-mono text-xl font-bold">{invoice.invoiceNo}</p>
            <p className="text-sm text-muted-foreground">
              Issued: {formatDate(invoice.createdAt)}
            </p>
            <p className="text-sm text-muted-foreground">
              Due: {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
            </p>
            <Badge className="mt-2 capitalize">{invoice.status}</Badge>
          </div>
        </div>

        <div className="mb-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Bill to
            </p>
            <p className="font-semibold">{tenant?.name || "—"}</p>
            {tenant?.email ? (
              <p className="text-sm text-muted-foreground">{tenant.email}</p>
            ) : null}
            {tenant?.phone ? (
              <p className="text-sm text-muted-foreground">{tenant.phone}</p>
            ) : null}
            {tenant?.address ? (
              <p className="text-sm text-muted-foreground">{tenant.address}</p>
            ) : null}
          </div>
          {invoice.paidAt ? (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Paid on
              </p>
              <p className="font-semibold">{formatDate(invoice.paidAt)}</p>
            </div>
          ) : null}
        </div>

        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-2 text-left font-medium">Description</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">Platform subscription</td>
              <td className="py-3 text-right">
                {formatCurrency(invoice.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(invoice.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(invoice.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>-{formatCurrency(invoice.discount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {invoice.notes ? (
          <div className="mt-6 rounded-lg bg-muted/40 p-4 text-sm">
            <strong>Notes:</strong> {invoice.notes}
          </div>
        ) : null}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Thank you for your business.
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #subscription-invoice,
          #subscription-invoice * {
            visibility: visible;
          }
          #subscription-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
    </>
  );
}

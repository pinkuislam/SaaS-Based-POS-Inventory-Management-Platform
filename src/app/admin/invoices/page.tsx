import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import Link from "next/link";
import { InvoiceFormDialog } from "@/components/admin/invoice-form-dialog";
import { InvoiceEditDialog } from "@/components/admin/invoice-edit-dialog";
import { InvoiceMarkPaidButton } from "@/components/admin/invoice-mark-paid";
import { InvoiceSendButton } from "@/components/admin/invoice-send-button";
import { SubscriptionInvoiceActions } from "@/components/admin/subscription-invoice-actions";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export default async function InvoicesPage() {
  const [invoices, tenants] = await Promise.all([
    prisma.subscriptionInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.tenant.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const tenantMap = Object.fromEntries(tenants.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Invoices</h1>
          <p className="text-muted-foreground">Generate and manage SaaS invoices</p>
        </div>
        <InvoiceFormDialog tenants={tenants} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono">
                    <Link
                      href={`/admin/invoices/${inv.id}`}
                      className="text-primary hover:underline"
                    >
                      {inv.invoiceNo}
                    </Link>
                  </TableCell>
                  <TableCell>{tenantMap[inv.tenantId] || "—"}</TableCell>
                  <TableCell>{formatCurrency(decimalToNumber(inv.total))}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === "paid" ? "default" : "secondary"}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                  </TableCell>
                  <TableCell className="flex flex-wrap items-center gap-1">
                    <SubscriptionInvoiceActions invoiceId={inv.id} />
                    <InvoiceEditDialog
                      invoice={{
                        id: inv.id,
                        status: inv.status,
                        notes: inv.notes,
                      }}
                    />
                    <InvoiceSendButton invoiceId={inv.id} />
                    {inv.status !== "paid" && (
                      <InvoiceMarkPaidButton invoiceId={inv.id} />
                    )}
                    {inv.status !== "paid" && (
                      <DeleteButton url={`/api/admin/invoices/${inv.id}`} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { decimalToNumber } from "@/lib/utils";
import { InvoiceFormDialog } from "@/components/admin/invoice-form-dialog";
import { InvoicesList } from "@/components/admin/lists/invoices-list";

export default async function InvoicesPage() {
  const [invoices, tenants] = await Promise.all([
    prisma.subscriptionInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.tenant.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const tenantMap = Object.fromEntries(tenants.map((t) => [t.id, t.name]));

  const rows = invoices.map((inv) => ({
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    tenantId: inv.tenantId,
    tenantName: tenantMap[inv.tenantId] || "—",
    total: decimalToNumber(inv.total),
    status: inv.status,
    dueDate: inv.dueDate?.toISOString() ?? null,
    notes: inv.notes,
  }));

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
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesList invoices={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SupplierEditButton } from "@/components/suppliers/supplier-edit-button";
import { SupplierPaymentDialog } from "@/components/suppliers/supplier-payment-dialog";
import { StatementDialog } from "@/components/shared/statement-dialog";
import {
  serializeSupplierForEdit,
  serializeDuePurchase,
} from "@/lib/serialize";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenant = await getTenantSlug();
  const { id } = await params;

  const supplier = await prisma.supplier.findFirst({
    where: { id, tenantId },
    include: {
      purchases: {
        orderBy: { purchaseDate: "desc" },
        take: 20,
        include: { user: true },
      },
      payments: { orderBy: { paymentDate: "desc" }, take: 10 },
    },
  });

  if (!supplier) notFound();

  const duePurchases = await prisma.purchase.findMany({
    where: {
      tenantId,
      supplierId: id,
      dueAmount: { gt: 0 },
      status: "COMPLETED",
    },
    select: {
      id: true,
      invoiceNo: true,
      dueAmount: true,
      purchaseDate: true,
      supplierId: true,
    },
  });

  const serialized = serializeSupplierForEdit(supplier);
  const dueRows = duePurchases.map(serializeDuePurchase);
  const totalDue = dueRows.reduce((s, x) => s + x.dueAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={tenantDashboardPath(tenant, "/suppliers")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{supplier.name}</h1>
            <Badge className="mt-1">{supplier.status}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatementDialog
            entityType="suppliers"
            entityId={supplier.id}
            entityName={supplier.name}
          />
          {dueRows.length > 0 && (
            <SupplierPaymentDialog
              supplierId={supplier.id}
              supplierName={supplier.name}
              duePurchases={dueRows}
              totalDue={totalDue}
            />
          )}
          <SupplierEditButton supplier={serialized} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">Company:</span>{" "}
              {supplier.companyName || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {supplier.phone || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {supplier.email || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Address:</span>{" "}
              {supplier.address || "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balances</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              Opening:{" "}
              {formatCurrency(decimalToNumber(supplier.openingBalance))}
            </p>
            <p className="font-semibold text-amber-600">
              Total due: {formatCurrency(totalDue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplier.purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No purchases yet
                  </TableCell>
                </TableRow>
              ) : (
                supplier.purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <Link
                        href={tenantDashboardPath(
                          tenant,
                          `/purchases/${purchase.id}`
                        )}
                        className="font-mono text-primary hover:underline"
                      >
                        {purchase.invoiceNo}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                    <TableCell>{purchase.user?.name || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(decimalToNumber(purchase.total))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(decimalToNumber(purchase.dueAmount))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplier.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No payments recorded
                  </TableCell>
                </TableRow>
              ) : (
                supplier.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell className="capitalize">{p.method}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(decimalToNumber(p.amount))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

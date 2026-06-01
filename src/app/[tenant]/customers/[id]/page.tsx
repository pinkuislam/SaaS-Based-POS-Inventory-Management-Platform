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
import { CustomerEditButton } from "@/components/customers/customer-edit-button";
import { CustomerPaymentDialog } from "@/components/customers/customer-payment-dialog";
import { StatementDialog } from "@/components/shared/statement-dialog";
import { LoyaltyPointsDialog } from "@/components/customers/loyalty-points-dialog";
import {
  serializeCustomerForEdit,
  serializeDueSale,
} from "@/lib/serialize";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenant = await getTenantSlug();
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, tenantId },
    include: {
      group: true,
      sales: {
        orderBy: { saleDate: "desc" },
        take: 20,
        include: { user: true },
      },
      payments: { orderBy: { paymentDate: "desc" }, take: 10 },
    },
  });

  if (!customer) notFound();

  const dueSales = await prisma.sale.findMany({
    where: {
      tenantId,
      customerId: id,
      dueAmount: { gt: 0 },
      status: "COMPLETED",
    },
    select: {
      id: true,
      invoiceNo: true,
      dueAmount: true,
      saleDate: true,
      customerId: true,
    },
  });

  const serialized = serializeCustomerForEdit(customer);
  const dueRows = dueSales.map(serializeDueSale);
  const totalDue = dueRows.reduce((s, x) => s + x.dueAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={tenantDashboardPath(tenant, "/customers")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{customer.customerType}</Badge>
              <Badge>{customer.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatementDialog
            entityType="customers"
            entityId={customer.id}
            entityName={customer.name}
          />
          {dueRows.length > 0 && (
            <CustomerPaymentDialog
              customerId={customer.id}
              customerName={customer.name}
              dueSales={dueRows}
              totalDue={totalDue}
            />
          )}
          <LoyaltyPointsDialog
            customerId={customer.id}
            customerName={customer.name}
            currentPoints={customer.loyaltyPoints}
          />
          <CustomerEditButton customer={serialized} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {customer.phone || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {customer.email || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Address:</span>{" "}
              {customer.address || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Group:</span>{" "}
              {customer.group?.name || "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balances</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              Opening: {formatCurrency(decimalToNumber(customer.openingBalance))}
            </p>
            <p>Credit limit: {formatCurrency(decimalToNumber(customer.creditLimit))}</p>
            <p className="font-semibold text-amber-600">
              Total due: {formatCurrency(totalDue)}
            </p>
            <p>Loyalty points: {decimalToNumber(customer.loyaltyPoints)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No sales yet
                  </TableCell>
                </TableRow>
              ) : (
                customer.sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Link
                        href={tenantDashboardPath(tenant, `/sales/${sale.id}`)}
                        className="font-mono text-primary hover:underline"
                      >
                        {sale.invoiceNo}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(sale.saleDate)}</TableCell>
                    <TableCell>{sale.user?.name || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(decimalToNumber(sale.total))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(decimalToNumber(sale.dueAmount))}
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
              {customer.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No payments recorded
                  </TableCell>
                </TableRow>
              ) : (
                customer.payments.map((p) => (
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

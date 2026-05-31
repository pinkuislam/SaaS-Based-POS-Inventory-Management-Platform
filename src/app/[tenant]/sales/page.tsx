import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { SaleReturnDialog } from "@/components/sales/sale-return-dialog";
import { Eye } from "lucide-react";

export default async function SalesPage() {
  const tenantId = await getTenantId();
  const tenant = await getTenantSlug();

  const sales = await prisma.sale.findMany({
    where: { tenantId },
    orderBy: { saleDate: "desc" },
    take: 100,
    include: {
      customer: true,
      user: true,
      items: { include: { product: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Sales invoice history</p>
        </div>
        <Link href={tenantDashboardPath(tenant, "/pos")}>
          <Button>New Sale (POS)</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Invoices ({sales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono">
                    <Link
                      href={tenantDashboardPath(tenant, `/sales/${sale.id}`)}
                      className="hover:underline text-primary"
                    >
                      {sale.invoiceNo}
                    </Link>
                  </TableCell>
                  <TableCell>{sale.customer?.name || "Walk-in"}</TableCell>
                  <TableCell>{sale.user?.name || "—"}</TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(decimalToNumber(sale.total))}
                  </TableCell>
                  <TableCell className="capitalize">
                    {sale.paymentMethod}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sale.status === "RETURNED" ? "destructive" : "default"
                      }
                    >
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(sale.saleDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={tenantDashboardPath(tenant, `/sales/${sale.id}`)}>
                        <Button variant="ghost" size="icon" title="View / Print">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <SaleReturnDialog
                        saleId={sale.id}
                        invoiceNo={sale.invoiceNo}
                        items={sale.items}
                        status={sale.status}
                      />
                    </div>
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

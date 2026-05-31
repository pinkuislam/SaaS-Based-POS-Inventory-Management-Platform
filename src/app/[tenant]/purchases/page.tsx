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
import { Plus } from "lucide-react";

export default async function PurchasesPage() {
  const tenantId = await getTenantId();
  const tenant = await getTenantSlug();

  const purchases = await prisma.purchase.findMany({
    where: { tenantId },
    orderBy: { purchaseDate: "desc" },
    include: { supplier: true, user: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-muted-foreground">Supplier purchase records</p>
        </div>
        <Link href={tenantDashboardPath(tenant, "/purchases/new")}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Purchase
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Invoices ({purchases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No purchases yet. Create your first purchase order.
              </p>
              <Link href={tenantDashboardPath(tenant, "/purchases/new")}>
                <Button>Create Purchase</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.invoiceNo}</TableCell>
                    <TableCell>{p.supplier?.name || "—"}</TableCell>
                    <TableCell>
                      {formatCurrency(decimalToNumber(p.total))}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(decimalToNumber(p.paidAmount))}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(decimalToNumber(p.dueAmount))}
                    </TableCell>
                    <TableCell>
                      <Badge>{p.paymentStatus}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

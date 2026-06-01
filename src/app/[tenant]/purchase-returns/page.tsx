import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";

export default async function PurchaseReturnsPage() {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();

  const returns = await prisma.purchaseReturn.findMany({
    where: { tenantId },
    orderBy: { returnDate: "desc" },
    include: {
      purchase: { select: { invoiceNo: true } },
      supplier: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Returns</h1>
          <p className="text-muted-foreground">
            Returns to suppliers and refund tracking
          </p>
        </div>
        <Link href={tenantDashboardPath(tenantSlug, "/purchases")}>
          <Button variant="outline">From purchases</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returns ({returns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {returns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No purchase returns yet. Create a return from a completed purchase
              invoice.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return #</TableHead>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Refund</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">
                      <Link
                        href={tenantDashboardPath(
                          tenantSlug,
                          `/purchase-returns/${r.id}`
                        )}
                        className="text-primary hover:underline"
                      >
                        {r.returnNo}
                      </Link>
                    </TableCell>
                    <TableCell>{r.purchase.invoiceNo}</TableCell>
                    <TableCell>{r.supplier?.name || "—"}</TableCell>
                    <TableCell>
                      {formatCurrency(decimalToNumber(r.refundAmount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(r.returnDate.toISOString())}</TableCell>
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

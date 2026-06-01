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
import { PurchaseReturnActions } from "@/components/purchases/purchase-return-actions";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function PurchaseReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { id } = await params;

  const purchaseReturn = await prisma.purchaseReturn.findFirst({
    where: { id, tenantId },
    include: {
      purchase: { include: { supplier: true } },
      supplier: true,
      items: { include: { product: true } },
    },
  });

  if (!purchaseReturn) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href={tenantDashboardPath(tenantSlug, "/purchase-returns")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{purchaseReturn.returnNo}</h1>
            <div className="flex gap-2 mt-1">
              <Badge>{purchaseReturn.status}</Badge>
              <Badge variant="outline">
                Purchase {purchaseReturn.purchase.invoiceNo}
              </Badge>
            </div>
          </div>
        </div>
        <PurchaseReturnActions
          returnId={purchaseReturn.id}
          status={purchaseReturn.status}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Refund</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCurrency(decimalToNumber(purchaseReturn.refundAmount))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseReturn.supplier?.name ||
              purchaseReturn.purchase.supplier?.name ||
              "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Date</CardTitle>
          </CardHeader>
          <CardContent>
            {formatDate(purchaseReturn.returnDate.toISOString())}
          </CardContent>
        </Card>
      </div>

      {(purchaseReturn.reason || purchaseReturn.notes) && (
        <Card>
          <CardContent className="pt-6 text-sm space-y-1">
            {purchaseReturn.reason && <p>Reason: {purchaseReturn.reason}</p>}
            {purchaseReturn.notes && <p>Notes: {purchaseReturn.notes}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Return items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseReturn.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{decimalToNumber(item.quantity)}</TableCell>
                  <TableCell>
                    {formatCurrency(decimalToNumber(item.refundAmount))}
                  </TableCell>
                  <TableCell>{item.reason || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

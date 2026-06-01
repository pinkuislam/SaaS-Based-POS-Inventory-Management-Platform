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
import { SaleReturnActions } from "@/components/sales/sale-return-actions";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function SaleReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { id } = await params;

  const saleReturn = await prisma.saleReturn.findFirst({
    where: { id, tenantId },
    include: {
      sale: { include: { customer: true } },
      customer: true,
      items: { include: { product: true } },
    },
  });

  if (!saleReturn) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href={tenantDashboardPath(tenantSlug, "/sale-returns")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{saleReturn.returnNo}</h1>
            <div className="flex gap-2 mt-1">
              <Badge>{saleReturn.status}</Badge>
              <Badge variant="outline">
                Sale {saleReturn.sale.invoiceNo}
              </Badge>
            </div>
          </div>
        </div>
        <SaleReturnActions
          returnId={saleReturn.id}
          status={saleReturn.status}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Refund</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCurrency(decimalToNumber(saleReturn.refundAmount))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {saleReturn.customer?.name ||
              saleReturn.sale.customer?.name ||
              "Walk-in"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reason</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {saleReturn.reason || "—"}
          </CardContent>
        </Card>
      </div>

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
              {saleReturn.items.map((item) => (
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

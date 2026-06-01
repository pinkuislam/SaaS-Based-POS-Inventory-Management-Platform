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
import { PurchaseReturnDialog } from "@/components/purchases/purchase-return-dialog";
import { PurchaseCancelDialog } from "@/components/purchases/purchase-cancel-dialog";
import { PurchasePaymentForm } from "@/components/purchases/purchase-payment-form";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenant = await getTenantSlug();
  const { id } = await params;

  const purchase = await prisma.purchase.findFirst({
    where: { id, tenantId },
    include: {
      supplier: true,
      user: true,
      items: { include: { product: true } },
    },
  });

  if (!purchase) notFound();

  const dueAmount = decimalToNumber(purchase.dueAmount);
  const paidAmount = decimalToNumber(purchase.paidAmount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={tenantDashboardPath(tenant, "/purchases")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-mono">{purchase.invoiceNo}</h1>
            <div className="flex gap-2 mt-1">
              <Badge>{purchase.status}</Badge>
              <Badge variant="outline">{purchase.paymentStatus}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {purchase.status === "COMPLETED" && (
            <>
              <PurchaseReturnDialog
                purchaseId={purchase.id}
                invoiceNo={purchase.invoiceNo}
                items={purchase.items.map((item) => ({
                  id: item.id,
                  quantity: decimalToNumber(item.quantity),
                  returnedQty: decimalToNumber(item.returnedQty),
                  product: { name: item.product.name },
                }))}
                status={purchase.status}
              />
              <PurchaseCancelDialog
                purchaseId={purchase.id}
                invoiceNo={purchase.invoiceNo}
                status={purchase.status}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Purchase Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell className="text-right">
                      {decimalToNumber(item.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(decimalToNumber(item.unitPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(decimalToNumber(item.total))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier</span>
                <span>{purchase.supplier?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDate(purchase.purchaseDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(decimalToNumber(purchase.subtotal))}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(decimalToNumber(purchase.total))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span>{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due</span>
                <span>{formatCurrency(dueAmount)}</span>
              </div>
              {purchase.notes && (
                <p className="text-muted-foreground pt-2 border-t">
                  {purchase.notes}
                </p>
              )}
            </CardContent>
          </Card>

          <PurchasePaymentForm
            purchaseId={purchase.id}
            dueAmount={dueAmount}
            paidAmount={paidAmount}
          />
        </div>
      </div>
    </div>
  );
}

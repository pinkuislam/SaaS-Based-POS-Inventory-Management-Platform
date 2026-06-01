import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import { serializeProductForClient } from "@/lib/serialize";
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
import { ProductEditButton } from "@/components/products/product-edit-button";
import { ProductRestoreButton } from "@/components/products/product-restore-button";
import { BarcodePrintDialog } from "@/components/products/barcode-print-dialog";
import Image from "next/image";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenant = await getTenantSlug();
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, tenantId },
    include: {
      category: true,
      brand: true,
      unit: true,
      branch: { select: { name: true } },
      stockMovements: { orderBy: { createdAt: "desc" }, take: 15 },
      saleItems: {
        orderBy: { sale: { saleDate: "desc" } },
        take: 10,
        include: { sale: true },
      },
      purchaseItems: {
        orderBy: { purchase: { purchaseDate: "desc" } },
        take: 10,
        include: { purchase: true },
      },
    },
  });

  if (!product) notFound();

  const serialized = serializeProductForClient(product);
  const stock = decimalToNumber(product.stockQty);
  const reorder = decimalToNumber(product.reorderLevel);
  const low = stock > 0 && reorder > 0 && stock <= reorder;
  const purchase = decimalToNumber(product.purchasePrice);
  const sell = decimalToNumber(product.sellingPrice);
  const marginPerUnit = sell - purchase;
  const saleQty = product.saleItems.reduce(
    (s, i) => s + decimalToNumber(i.quantity),
    0
  );
  const estProfit = saleQty * marginPerUnit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href={tenantDashboardPath(tenant, "/products")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="flex gap-2 mt-1 flex-wrap">
              {product.deletedAt ? (
                <Badge variant="destructive">Deleted</Badge>
              ) : (
                <Badge>{product.status}</Badge>
              )}
              {stock <= 0 && <Badge variant="destructive">Out of stock</Badge>}
              {low && <Badge variant="secondary">Low stock</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {product.deletedAt ? (
            <ProductRestoreButton productId={product.id} />
          ) : (
            <>
              <BarcodePrintDialog product={serialized} />
              <ProductEditButton product={serialized} />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {product.image && (
          <Card className="md:col-span-3">
            <CardContent className="pt-6">
              <div className="relative h-48 w-48 rounded-md border overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing & stock</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Branch: {product.branch?.name || "All / default"}</p>
            <p>SKU: {product.sku || "—"}</p>
            <p>Barcode: {product.barcode || "—"}</p>
            <p>Serial: {product.serialNo || "—"}</p>
            <p>Purchase: {formatCurrency(purchase)}</p>
            <p>Sell: {formatCurrency(decimalToNumber(product.sellingPrice))}</p>
            <p>Tax: {decimalToNumber(product.taxRate)}%</p>
            <p className="font-semibold">
              Stock: {stock} (reorder at {reorder})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profit (est.)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Margin / unit: {formatCurrency(marginPerUnit)}</p>
            <p>Units sold (recent): {saleQty}</p>
            <p className="font-semibold">Est. profit: {formatCurrency(estProfit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catalog</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Category: {product.category?.name || "—"}</p>
            <p>Brand: {product.brand?.name || "—"}</p>
            <p>Unit: {product.unit?.name || "—"}</p>
            {product.expiryDate && (
              <p>Expiry: {formatDate(product.expiryDate)}</p>
            )}
            {product.batchNo && <p>Batch: {product.batchNo}</p>}
          </CardContent>
        </Card>
        {product.description && (
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {product.description}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock movements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.stockMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No movements yet
                  </TableCell>
                </TableRow>
              ) : (
                product.stockMovements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatDate(m.createdAt)}</TableCell>
                    <TableCell>{m.type}</TableCell>
                    <TableCell className="text-right">
                      {decimalToNumber(m.quantity)}
                    </TableCell>
                    <TableCell>{m.reference || m.notes || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.saleItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No sales yet
                    </TableCell>
                  </TableRow>
                ) : (
                  product.saleItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          href={tenantDashboardPath(
                            tenant,
                            `/sales/${item.sale.id}`
                          )}
                          className="text-primary hover:underline font-mono"
                        >
                          {item.sale.invoiceNo}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(item.sale.saleDate)}</TableCell>
                      <TableCell className="text-right">
                        {decimalToNumber(item.quantity)}
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
            <CardTitle>Recent purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.purchaseItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No purchases yet
                    </TableCell>
                  </TableRow>
                ) : (
                  product.purchaseItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          href={tenantDashboardPath(
                            tenant,
                            `/purchases/${item.purchase.id}`
                          )}
                          className="text-primary hover:underline font-mono"
                        >
                          {item.purchase.invoiceNo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatDate(item.purchase.purchaseDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {decimalToNumber(item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

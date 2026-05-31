import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, decimalToNumber } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { StockAdjustDialog } from "@/components/inventory/stock-adjust-dialog";
import { serializeProductAdjustOption } from "@/lib/serialize";
import { Package, AlertTriangle, TrendingUp } from "lucide-react";

export default async function InventoryPage() {
  const tenantId = await getTenantId();

  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId, status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { product: true },
    }),
  ]);

  const totalValue = products.reduce(
    (sum, p) =>
      sum + decimalToNumber(p.stockQty) * decimalToNumber(p.purchasePrice),
    0
  );
  const lowStock = products.filter(
    (p) => decimalToNumber(p.stockQty) <= decimalToNumber(p.reorderLevel)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Stock levels and movements</p>
        </div>
        <StockAdjustDialog
          products={products.map(serializeProductAdjustOption)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Products"
          value={String(products.length)}
          icon={Package}
        />
        <StatCard
          title="Stock Value"
          value={formatCurrency(totalValue)}
          icon={TrendingUp}
        />
        <StatCard
          title="Low Stock Items"
          value={String(lowStock.length)}
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Reorder Level</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const isLow =
                  decimalToNumber(p.stockQty) <= decimalToNumber(p.reorderLevel);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category?.name || "—"}</TableCell>
                    <TableCell>{decimalToNumber(p.stockQty)}</TableCell>
                    <TableCell>{decimalToNumber(p.reorderLevel)}</TableCell>
                    <TableCell>
                      {formatCurrency(
                        decimalToNumber(p.stockQty) *
                          decimalToNumber(p.purchasePrice)
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isLow ? "destructive" : "secondary"}>
                        {isLow ? "Low Stock" : "OK"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-muted-foreground text-sm">No movements yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.type}</Badge>
                    </TableCell>
                    <TableCell>{decimalToNumber(m.quantity)}</TableCell>
                    <TableCell>{m.reference || "—"}</TableCell>
                    <TableCell>
                      {new Date(m.createdAt).toLocaleDateString()}
                    </TableCell>
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

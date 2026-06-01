import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { activeProductWhere } from "@/lib/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { StockAdjustDialog } from "@/components/inventory/stock-adjust-dialog";
import { StockTransferDialog } from "@/components/inventory/stock-transfer-dialog";
import { InventoryStockTable } from "@/components/inventory/inventory-stock-table";
import { StockTransfersPanel } from "@/components/inventory/stock-transfers-panel";
import { PendingAdjustmentsPanel } from "@/components/inventory/pending-adjustments-panel";
import {
  serializeProductAdjustOption,
  serializeProductStockOption,
} from "@/lib/serialize";
import { formatCurrency, decimalToNumber } from "@/lib/utils";
import { Package, AlertTriangle, TrendingUp, Clock } from "lucide-react";

export default async function InventoryPage() {
  const tenantId = await getTenantId();

  const [products, movements, branches, pendingCount] = await Promise.all([
    prisma.product.findMany({
      where: activeProductWhere(tenantId, { includeInactive: true }),
      include: { category: true, branch: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { product: true, user: { select: { name: true } } },
    }),
    prisma.branch.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma.stockMovement.count({
      where: { tenantId, status: "PENDING" },
    }),
  ]);

  const totalValue = products.reduce(
    (sum, p) =>
      sum + decimalToNumber(p.stockQty) * decimalToNumber(p.purchasePrice),
    0
  );
  const lowStock = products.filter((p) => {
    const stock = decimalToNumber(p.stockQty);
    const reorder = decimalToNumber(p.reorderLevel);
    return stock > 0 && reorder > 0 && stock <= reorder;
  });
  const outOfStock = products.filter((p) => decimalToNumber(p.stockQty) <= 0);
  const expired = products.filter(
    (p) => p.expiryDate && new Date(p.expiryDate) < new Date()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">
            Stock levels, adjustments, transfers, and valuation
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StockAdjustDialog
            products={products.map(serializeProductAdjustOption)}
          />
          {branches.length >= 2 && (
            <StockTransferDialog
              products={products.map(serializeProductStockOption)}
              branches={branches}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
          title="Low / Out"
          value={`${lowStock.length} / ${outOfStock.length}`}
          icon={AlertTriangle}
        />
        <StatCard
          title="Pending Approvals"
          value={String(pendingCount)}
          icon={Clock}
        />
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock levels</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryStockTable
                products={products.map((p) => {
                  const stockQty = decimalToNumber(p.stockQty);
                  const reorderLevel = decimalToNumber(p.reorderLevel);
                  return {
                    id: p.id,
                    name: p.name,
                    categoryName: p.category?.name ?? null,
                    branchName: p.branch?.name ?? null,
                    stockQty,
                    reorderLevel,
                    stockValue:
                      stockQty * decimalToNumber(p.purchasePrice),
                    expiryDate: p.expiryDate?.toISOString() ?? null,
                  };
                })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock movement history</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No movements yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Ref</th>
                        <th className="pb-2">By</th>
                        <th className="pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((m) => (
                        <tr key={m.id} className="border-b">
                          <td className="py-2">{m.product.name}</td>
                          <td>{m.type}</td>
                          <td>{decimalToNumber(m.quantity)}</td>
                          <td>{m.status}</td>
                          <td>{m.reference || "—"}</td>
                          <td>{m.user?.name || "—"}</td>
                          <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer requests</CardTitle>
            </CardHeader>
            <CardContent>
              <StockTransfersPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending stock adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <PendingAdjustmentsPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

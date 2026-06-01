import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ReportsOverviewLinks } from "@/components/reports/reports-overview-links";
import { formatCurrency, decimalToNumber } from "@/lib/utils";
import { DollarSign, ShoppingBag, TrendingUp, Package } from "lucide-react";
import { ReportsChart } from "@/components/reports/reports-chart";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function ReportsPage() {
  const tenantId = await getTenantId();
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const [
    monthSales,
    monthPurchases,
    products,
    salesByDay,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        tenantId,
        saleDate: { gte: monthStart, lte: monthEnd },
        status: "COMPLETED",
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.purchase.aggregate({
      where: {
        tenantId,
        purchaseDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.findMany({
      where: { tenantId },
      select: { stockQty: true, purchasePrice: true },
    }),
    prisma.sale.findMany({
      where: {
        tenantId,
        saleDate: { gte: monthStart, lte: monthEnd },
        status: "COMPLETED",
      },
      select: { saleDate: true, total: true },
    }),
  ]);

  const salesTotal = decimalToNumber(monthSales._sum.total);
  const purchasesTotal = decimalToNumber(monthPurchases._sum.total);
  const stockValue = products.reduce(
    (s, p) => s + decimalToNumber(p.stockQty) * decimalToNumber(p.purchasePrice),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Business analytics and exportable reports
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Sales"
          value={formatCurrency(salesTotal)}
          icon={DollarSign}
          description={`${monthSales._count} invoices`}
        />
        <StatCard
          title="Monthly Purchases"
          value={formatCurrency(purchasesTotal)}
          icon={ShoppingBag}
          description={`${monthPurchases._count} orders`}
        />
        <StatCard
          title="Est. Profit"
          value={formatCurrency(salesTotal - purchasesTotal)}
          icon={TrendingUp}
        />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(stockValue)}
          icon={Package}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Trend (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportsChart sales={salesByDay} />
        </CardContent>
      </Card>

      <ReportsOverviewLinks />
    </div>
  );
}

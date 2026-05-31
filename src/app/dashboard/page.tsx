import { getTenantId } from "@/lib/tenant";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { StatCard } from "@/components/ui/stat-card";
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
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { SalesChart } from "@/components/dashboard/sales-chart";

export default async function DashboardPage() {
  const tenantId = await getTenantId();
  const stats = await getDashboardStats(tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Business overview for today
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySalesTotal)}
          icon={DollarSign}
          description={`${stats.todaySalesCount} invoices`}
        />
        <StatCard
          title="Today's Purchases"
          value={formatCurrency(stats.todayPurchasesTotal)}
          icon={ShoppingCart}
        />
        <StatCard
          title="Stock Value"
          value={formatCurrency(stats.stockValue)}
          icon={Package}
        />
        <StatCard
          title="Low Stock Items"
          value={String(stats.lowStockCount)}
          icon={AlertTriangle}
          description="Needs attention"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={stats.chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All products are above reorder level.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Reorder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.lowStockProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {decimalToNumber(p.stockQty)}
                        </Badge>
                      </TableCell>
                      <TableCell>{decimalToNumber(p.reorderLevel)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-sm">
                    {sale.invoiceNo}
                  </TableCell>
                  <TableCell>
                    {sale.customer?.name || "Walk-in"}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(decimalToNumber(sale.total))}
                  </TableCell>
                  <TableCell>{formatDate(sale.saleDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

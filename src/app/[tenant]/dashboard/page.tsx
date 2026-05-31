import Link from "next/link";
import { auth } from "@/auth";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { getBranchFilter } from "@/lib/branch-scope";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { ForbiddenAlert } from "@/components/dashboard/forbidden-alert";
import { SalesChart } from "@/components/dashboard/sales-chart";
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
  TrendingUp,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  decimalToNumber,
} from "@/lib/utils";

export default async function TenantDashboardPage() {
  const session = await auth();
  const tenantId = await getTenantId();
  const tenant = await getTenantSlug();
  const branchFilter = getBranchFilter({
    branchId: session?.user?.branchId,
    permissions: session?.user?.permissions,
  });
  const stats = await getDashboardStats(tenantId, branchFilter);

  return (
    <div className="space-y-6">
      <ForbiddenAlert />
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Today&apos;s business overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          title="Est. Today Profit"
          value={formatCurrency(stats.todayProfitEst)}
          icon={TrendingUp}
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
          description="At or below reorder level"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={stats.chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.paymentMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales today</p>
            ) : (
              <ul className="space-y-2">
                {stats.paymentMethods.map(({ method, total }) => (
                  <li
                    key={method}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize">{method}</span>
                    <span className="font-medium">
                      {formatCurrency(total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Products (Today)</CardTitle>
            <Link
              href={tenantDashboardPath(tenant, "/products")}
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales today</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topProducts.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">{p.qty}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(p.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low Stock</CardTitle>
            <Link
              href={tenantDashboardPath(tenant, "/inventory")}
              className="text-sm text-primary hover:underline"
            >
              Inventory
            </Link>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No low stock alerts
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Reorder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.lowStockProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">
                        {decimalToNumber(p.stockQty)}
                      </TableCell>
                      <TableCell className="text-right">
                        {decimalToNumber(p.reorderLevel)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Sales</CardTitle>
          <Link
            href={tenantDashboardPath(tenant, "/sales")}
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <Link
                      href={tenantDashboardPath(tenant, `/sales/${sale.id}`)}
                      className="font-medium text-primary hover:underline"
                    >
                      {sale.invoiceNo}
                    </Link>
                  </TableCell>
                  <TableCell>{sale.customer?.name || "Walk-in"}</TableCell>
                  <TableCell>
                    {formatCurrency(decimalToNumber(sale.total))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sale.status}</Badge>
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

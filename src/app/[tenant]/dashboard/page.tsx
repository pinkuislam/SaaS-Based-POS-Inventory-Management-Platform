import Link from "next/link";
import { auth } from "@/auth";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { getBranchFilter } from "@/lib/branch-scope";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { ForbiddenAlert } from "@/components/dashboard/forbidden-alert";
import {
  DashboardSalesChart,
  DashboardPurchasesChart,
  DashboardProfitChart,
  DashboardCombinedChart,
} from "@/components/dashboard/dashboard-charts";
import { DashboardNotifications } from "@/components/dashboard/dashboard-notifications";
import { DashboardSubscriptionCard } from "@/components/dashboard/subscription-card";
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
  Users,
  Truck,
  CreditCard,
  Receipt,
  Building2,
  TrendingDown,
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
          Complete business overview — today and last 7 days
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
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
          description={
            stats.todayPurchasesCount
              ? `${stats.todayPurchasesCount} bills`
              : undefined
          }
        />
        <StatCard
          title="Today's Profit"
          value={formatCurrency(stats.todayProfitEst)}
          icon={TrendingUp}
          description="Sales − purchases − expenses"
        />
        <StatCard
          title="Today's Expenses"
          value={formatCurrency(stats.todayExpensesTotal)}
          icon={CreditCard}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          description="All-time completed sales"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={Receipt}
          description="All-time recorded"
        />
        <StatCard
          title="Total Due"
          value={formatCurrency(stats.totalDue)}
          icon={AlertTriangle}
        />
        <StatCard
          title="Customers"
          value={String(stats.customerCount)}
          icon={Users}
        />
        <StatCard
          title="Suppliers"
          value={String(stats.supplierCount)}
          icon={Truck}
        />
        <StatCard
          title="Products"
          value={String(stats.productCount)}
          icon={Package}
        />
        <StatCard
          title="Low Stock"
          value={String(stats.lowStockCount)}
          icon={AlertTriangle}
        />
        <StatCard
          title="Out of Stock"
          value={String(stats.outOfStockCount)}
          icon={Package}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sales chart (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardSalesChart data={stats.chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Purchase chart (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardPurchasesChart data={stats.chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Profit chart (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardProfitChart data={stats.chartData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales, purchases & profit overview</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardCombinedChart data={stats.chartData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardSubscriptionCard
          tenantSlug={tenant}
          packageName={stats.subscriptionPackage}
          status={stats.subscriptionStatus}
          endDate={stats.subscriptionEndDate}
          billingCycle={stats.subscriptionBillingCycle}
        />
        <div className="lg:col-span-2">
          <DashboardNotifications
            tenantSlug={tenant}
            notifications={stats.notifications}
            unreadCount={stats.unreadNotificationCount}
          />
        </div>
      </div>

      {/* Branch performance */}
      {stats.branchWisePerformance.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Branch-wise performance (30 days)
            </CardTitle>
            <Link
              href={tenantDashboardPath(tenant, "/branches")}
              className="text-sm text-primary hover:underline"
            >
              Branches
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Sales count</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.branchWisePerformance.map((b) => (
                  <TableRow key={b.branchId ?? "none"}>
                    <TableCell className="font-medium">{b.branchName}</TableCell>
                    <TableCell className="text-right">{b.salesCount}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(b.salesTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top / slow products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top-selling products (7 days)</CardTitle>
            <Link
              href={tenantDashboardPath(tenant, "/reports")}
              className="text-sm text-primary hover:underline"
            >
              Reports
            </Link>
          </CardHeader>
          <CardContent>
            {stats.topSellingProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales in period</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topSellingProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={tenantDashboardPath(
                            tenant,
                            `/products/${p.id}`
                          )}
                          className="hover:underline text-primary"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
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
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Slow-moving products (30 days)
            </CardTitle>
            <Link
              href={tenantDashboardPath(tenant, "/inventory")}
              className="text-sm text-primary hover:underline"
            >
              Inventory
            </Link>
          </CardHeader>
          <CardContent>
            {stats.slowMovingProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Sold (30d)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.slowMovingProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={tenantDashboardPath(
                            tenant,
                            `/products/${p.id}`
                          )}
                          className="hover:underline text-primary"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{p.stockQty}</TableCell>
                      <TableCell className="text-right">{p.soldQty30d}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low stock products</CardTitle>
            <Link
              href={tenantDashboardPath(tenant, "/inventory")}
              className="text-sm text-primary hover:underline"
            >
              Inventory
            </Link>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No low stock alerts</p>
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
                      <TableCell>
                        <Link
                          href={tenantDashboardPath(
                            tenant,
                            `/products/${p.id}`
                          )}
                          className="hover:underline"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{p.stockQty}</TableCell>
                      <TableCell className="text-right">{p.reorderLevel}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Out of stock</CardTitle>
            <Link
              href={tenantDashboardPath(tenant, "/products")}
              className="text-sm text-primary hover:underline"
            >
              Products
            </Link>
          </CardHeader>
          <CardContent>
            {stats.outOfStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No out-of-stock products
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.outOfStockProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={tenantDashboardPath(
                            tenant,
                            `/products/${p.id}`
                          )}
                          className="hover:underline"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{p.stockQty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {stats.outOfStockCount > stats.outOfStockProducts.length && (
              <p className="text-xs text-muted-foreground mt-2">
                +{stats.outOfStockCount - stats.outOfStockProducts.length} more
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top today + payment methods */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top products (today)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProductsToday.length === 0 ? (
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
                  {stats.topProductsToday.map((p) => (
                    <TableRow key={p.id}>
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
          <CardHeader>
            <CardTitle>Payment methods (today)</CardTitle>
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
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent sales</CardTitle>
            <Link
              href={tenantDashboardPath(tenant, "/sales")}
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <Link
                          href={tenantDashboardPath(
                            tenant,
                            `/sales/${sale.id}`
                          )}
                          className="font-mono text-primary hover:underline"
                        >
                          {sale.invoiceNo}
                        </Link>
                      </TableCell>
                      <TableCell>{sale.customer?.name || "Walk-in"}</TableCell>
                      <TableCell>
                        {formatCurrency(decimalToNumber(sale.total))}
                      </TableCell>
                      <TableCell>{formatDate(sale.saleDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent purchases</CardTitle>
            <Link
              href={tenantDashboardPath(tenant, "/purchases")}
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentPurchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No purchases yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentPurchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={tenantDashboardPath(
                            tenant,
                            `/purchases/${p.id}`
                          )}
                          className="font-mono text-primary hover:underline"
                        >
                          {p.invoiceNo}
                        </Link>
                      </TableCell>
                      <TableCell>{p.supplier?.name || "—"}</TableCell>
                      <TableCell>
                        {formatCurrency(decimalToNumber(p.total))}
                      </TableCell>
                      <TableCell>{formatDate(p.purchaseDate)}</TableCell>
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
          <CardTitle>Recent payments</CardTitle>
          <Link
            href={tenantDashboardPath(tenant, "/payments")}
            className="text-sm text-primary hover:underline"
          >
            Payments
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentPayments.map((p) => (
                  <TableRow key={`${p.type}-${p.id}`}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {p.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.partyName}</TableCell>
                    <TableCell className="capitalize">{p.method}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
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

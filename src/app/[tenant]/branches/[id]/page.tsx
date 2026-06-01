import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import { parseBranchSettings, branchHasHistory } from "@/lib/branches";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BranchEditDialog } from "@/components/branches/branch-edit-dialog";
import { StatCard } from "@/components/ui/stat-card";
import {
  formatCurrency,
  formatDate,
  decimalToNumber,
} from "@/lib/utils";
import {
  ArrowLeft,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
} from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { id } = await params;

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const branch = await prisma.branch.findFirst({
    where: { id, tenantId },
    include: {
      manager: { select: { id: true, name: true, email: true, phone: true } },
      users: {
        select: { id: true, name: true, email: true, phone: true, isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!branch) notFound();

  const settings = parseBranchSettings(branch.settings);
  const hasHistory = await branchHasHistory(id);

  const [
    products,
    recentSales,
    recentPurchases,
    recentExpenses,
    monthSalesAgg,
    monthPurchasesAgg,
    monthExpensesAgg,
    stockValueAgg,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId, branchId: id, status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
      take: 50,
    }),
    prisma.sale.findMany({
      where: { tenantId, branchId: id },
      orderBy: { saleDate: "desc" },
      take: 20,
      include: { customer: true, user: true },
    }),
    prisma.purchase.findMany({
      where: { tenantId, branchId: id },
      orderBy: { purchaseDate: "desc" },
      take: 20,
      include: { supplier: true },
    }),
    prisma.expense.findMany({
      where: { tenantId, branchId: id },
      orderBy: { expenseDate: "desc" },
      take: 20,
      include: { category: true },
    }),
    prisma.sale.aggregate({
      where: {
        tenantId,
        branchId: id,
        saleDate: { gte: monthStart, lte: monthEnd },
        status: "COMPLETED",
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.purchase.aggregate({
      where: {
        tenantId,
        branchId: id,
        purchaseDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        tenantId,
        branchId: id,
        expenseDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.product.findMany({
      where: { tenantId, branchId: id, status: "ACTIVE" },
      select: { stockQty: true, purchasePrice: true },
    }),
  ]);

  const monthSales = decimalToNumber(monthSalesAgg._sum.total);
  const monthPurchases = decimalToNumber(monthPurchasesAgg._sum.total);
  const monthExpenses = decimalToNumber(monthExpensesAgg._sum.amount);
  const monthProfit = monthSales - monthPurchases - monthExpenses;
  const inventoryValue = stockValueAgg.reduce(
    (s, p) =>
      s + decimalToNumber(p.stockQty) * decimalToNumber(p.purchasePrice),
    0
  );

  const editBranch = {
    id: branch.id,
    name: branch.name,
    code: branch.code,
    address: branch.address,
    contactPerson: branch.contactPerson,
    phone: branch.phone,
    email: branch.email,
    openingBalance:
      branch.openingBalance != null
        ? decimalToNumber(branch.openingBalance)
        : null,
    managerId: branch.managerId,
    isMain: branch.isMain,
    isActive: branch.isActive,
    deletedAt: branch.deletedAt?.toISOString() ?? null,
    settings,
  };

  const branchesHref = tenantDashboardPath(tenantSlug, "/branches");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href={branchesHref}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{branch.name}</h1>
            <div className="mt-1 flex flex-wrap gap-2">
              {branch.code ? (
                <Badge variant="outline">{branch.code}</Badge>
              ) : null}
              {branch.isMain ? <Badge>Main</Badge> : null}
              {branch.deletedAt ? (
                <Badge variant="destructive">Deleted</Badge>
              ) : (
                <Badge variant={branch.isActive ? "default" : "secondary"}>
                  {branch.isActive ? "Active" : "Archived"}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <BranchEditDialog branch={editBranch} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Sales (this month)"
          value={formatCurrency(monthSales)}
          icon={DollarSign}
          description={`${monthSalesAgg._count} invoices`}
        />
        <StatCard
          title="Purchases (this month)"
          value={formatCurrency(monthPurchases)}
          icon={ShoppingBag}
          description={`${monthPurchasesAgg._count} orders`}
        />
        <StatCard
          title="Est. profit (this month)"
          value={formatCurrency(monthProfit)}
          icon={TrendingUp}
          description="Sales − purchases − expenses"
        />
        <StatCard
          title="Inventory value"
          value={formatCurrency(inventoryValue)}
          icon={Package}
          description={`${products.length} products shown`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branch details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p className="text-muted-foreground">Address</p>
            <p>{branch.address || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Contact person</p>
            <p>{branch.contactPerson || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone / Email</p>
            <p>
              {branch.phone || "—"}
              {branch.email ? ` · ${branch.email}` : ""}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Branch manager</p>
            <p>{branch.manager?.name || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Opening balance</p>
            <p>
              {branch.openingBalance != null
                ? formatCurrency(decimalToNumber(branch.openingBalance))
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Settings</p>
            <p>
              {settings.invoicePrefix
                ? `Invoice prefix: ${settings.invoicePrefix}`
                : "—"}
              {settings.notes ? ` · ${settings.notes}` : ""}
            </p>
          </div>
          {hasHistory ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted-foreground">
                This branch has transaction history and cannot be permanently
                deleted — only archived.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            Users ({branch.users.length})
          </TabsTrigger>
          <TabsTrigger value="stock">Stock ({products.length})</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branch.users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No users assigned to this branch.
                      </TableCell>
                    </TableRow>
                  ) : (
                    branch.users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? "default" : "secondary"}>
                            {u.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No products at this branch.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((p) => {
                      const qty = decimalToNumber(p.stockQty);
                      const val =
                        qty * decimalToNumber(p.purchasePrice);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.sku || "—"}</TableCell>
                          <TableCell>{p.category?.name || "—"}</TableCell>
                          <TableCell className="text-right">{qty}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(val)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No sales for this branch.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentSales.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Link
                            href={tenantDashboardPath(
                              tenantSlug,
                              `/sales/${s.id}`
                            )}
                            className="text-primary hover:underline"
                          >
                            {s.invoiceNo}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(s.saleDate)}</TableCell>
                        <TableCell>{s.customer?.name || "Walk-in"}</TableCell>
                        <TableCell>{s.user?.name || "—"}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(decimalToNumber(s.total))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No purchases for this branch.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentPurchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            href={tenantDashboardPath(
                              tenantSlug,
                              `/purchases/${p.id}`
                            )}
                            className="text-primary hover:underline"
                          >
                            {p.invoiceNo}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                        <TableCell>{p.supplier?.name || "—"}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(decimalToNumber(p.total))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No expenses linked to this branch yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentExpenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.title}</TableCell>
                        <TableCell>{formatDate(e.expenseDate)}</TableCell>
                        <TableCell>{e.category?.name || "—"}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(decimalToNumber(e.amount))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Branch performance (this month)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground">Total sales</p>
                  <p className="text-xl font-bold">{formatCurrency(monthSales)}</p>
                  <p className="text-xs text-muted-foreground">
                    {monthSalesAgg._count} completed sales
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground">Total purchases</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(monthPurchases)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {monthPurchasesAgg._count} purchase orders
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground">Branch expenses</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(monthExpenses)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {monthExpensesAgg._count} expense entries
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground">Estimated net profit</p>
                  <p className="text-xl font-bold">{formatCurrency(monthProfit)}</p>
                  <p className="text-xs text-muted-foreground">
                    Staff: {branch.users.length} · Products: {products.length}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground">
                For full analytics, use{" "}
                <Link
                  href={tenantDashboardPath(tenantSlug, "/reports/branch_sales")}
                  className="text-primary hover:underline"
                >
                  Branch-wise Sales Report
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

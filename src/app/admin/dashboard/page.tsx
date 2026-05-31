import { prisma } from "@/lib/prisma";
import { getAdminPlatformStats } from "@/lib/admin-stats";
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
  Building2,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  ShoppingCart,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TenantGrowthChart,
  PackagePieChart,
} from "@/components/admin/admin-charts";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { decimalToNumber } from "@/lib/utils";
import { HeadphonesIcon } from "lucide-react";
import { AdminModulesOverview } from "@/components/admin/admin-modules-overview";

export default async function AdminDashboardPage() {
  const [stats, recentTenants] = await Promise.all([
    getAdminPlatformStats(),
    prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        package: true,
        subscriptions: {
          where: { status: { in: ["ACTIVE", "TRIAL"] } },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground">
          SaaS platform performance overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={String(stats.tenantCount)}
          icon={Building2}
          description={`${stats.activeTenants} active`}
        />
        <StatCard
          title="Est. MRR"
          value={formatCurrency(stats.mrr)}
          icon={DollarSign}
          description="From active subscriptions"
        />
        <StatCard
          title="Revenue (This Month)"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={TrendingUp}
        />
        <StatCard
          title="Active Subscriptions"
          value={String(stats.activeSubscriptions)}
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Trial Tenants"
          value={String(stats.trialTenants)}
          icon={Users}
        />
        <StatCard
          title="Pending Payments"
          value={String(stats.pendingPayments)}
          icon={CreditCard}
        />
        <StatCard
          title="Open Support Tickets"
          value={String(stats.openTickets)}
          icon={HeadphonesIcon}
        />
        <StatCard
          title="Expired Subscriptions"
          value={String(stats.expiredSubscriptions)}
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={stats.revenueChart} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Tenants (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantGrowthChart data={stats.tenantGrowth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tenants by Package</CardTitle>
          </CardHeader>
          <CardContent>
            <PackagePieChart data={stats.packageStats} />
          </CardContent>
        </Card>
      </div>

      {stats.expiringSoon.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Subscriptions Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.expiringSoon.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.tenant.name}</TableCell>
                    <TableCell>{sub.package.name}</TableCell>
                    <TableCell>{formatDate(sub.endDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>{tenant.package?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tenant.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tenant.subscriptions[0]
                      ? formatDate(tenant.subscriptions[0].endDate)
                      : "—"}
                  </TableCell>
                  <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminModulesOverview />
    </div>
  );
}

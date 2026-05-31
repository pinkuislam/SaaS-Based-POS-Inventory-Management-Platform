import { prisma } from "@/lib/prisma";
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
import { Building2, CreditCard, Package, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [tenantCount, activeTenants, packages, recentTenants, subscriptions] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.subscriptionPackage.count(),
      prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { package: true },
      }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your SaaS platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={String(tenantCount)}
          icon={Building2}
          description={`${activeTenants} active`}
        />
        <StatCard
          title="Active Subscriptions"
          value={String(subscriptions)}
          icon={CreditCard}
        />
        <StatCard
          title="Packages"
          value={String(packages)}
          icon={Package}
        />
        <StatCard
          title="Pending Approval"
          value={String(
            await prisma.tenant.count({ where: { status: "PENDING" } })
          )}
          icon={Users}
        />
      </div>

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
                  <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

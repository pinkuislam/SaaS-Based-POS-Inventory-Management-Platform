import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { TenantActions } from "@/components/admin/tenant-actions";

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      package: true,
      subscriptions: {
        where: { status: { in: ["ACTIVE", "TRIAL"] } },
        orderBy: { endDate: "desc" },
        take: 1,
      },
      _count: { select: { users: true, products: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tenant Management</h1>
        <p className="text-muted-foreground">
          Manage all registered businesses on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants ({tenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tenant.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{tenant.slug}</TableCell>
                  <TableCell>{tenant.package?.name || "—"}</TableCell>
                  <TableCell>{tenant._count.users}</TableCell>
                  <TableCell>{tenant._count.products}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tenant.status === "ACTIVE"
                          ? "default"
                          : tenant.status === "SUSPENDED"
                            ? "destructive"
                            : "secondary"
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
                  <TableCell>
                    <TenantActions tenantId={tenant.id} status={tenant.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

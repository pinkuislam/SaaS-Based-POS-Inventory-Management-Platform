import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TenantCreateDialog } from "@/components/admin/tenant-create-dialog";
import {
  TenantsList,
  type TenantListRow,
} from "@/components/admin/lists/tenants-list";

export default async function TenantsPage() {
  const [tenants, packages] = await Promise.all([
    prisma.tenant.findMany({
      where: { deletedAt: null },
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
    }),
    prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const rows: TenantListRow[] = tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    slug: tenant.slug,
    status: tenant.status,
    packageId: tenant.packageId,
    packageName: tenant.package?.name ?? null,
    dbProvisioned: tenant.dbProvisioned,
    dbName: tenant.dbName,
    userCount: tenant._count.users,
    productCount: tenant._count.products,
    subscriptionEnd: tenant.subscriptions[0]?.endDate.toISOString() ?? null,
    tenantEdit: {
      id: tenant.id,
      name: tenant.name,
      ownerName: tenant.ownerName,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      slug: tenant.slug,
      packageId: tenant.packageId,
      status: tenant.status,
      loginBlocked: tenant.loginBlocked,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenant Management</h1>
          <p className="text-muted-foreground">
            Manage all registered businesses on the platform
          </p>
        </div>
        <TenantCreateDialog packages={packages} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantsList tenants={rows} packages={packages} />
        </CardContent>
      </Card>
    </div>
  );
}

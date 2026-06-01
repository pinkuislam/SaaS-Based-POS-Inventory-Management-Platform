import { Suspense } from "react";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UsersTable } from "@/components/users/users-table";
import { ShowAllUsersToggle } from "@/components/users/show-all-users-toggle";
import Link from "next/link";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { Button } from "@/components/ui/button";
import { filterValidPermissions } from "@/lib/permissions";

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenantId = await getTenantId();
  const slug = await getTenantSlug();
  const { show } = await searchParams;
  const showAll = show === "all";

  const [users, roles, branches] = await Promise.all([
    prisma.user.findMany({
      where: {
        tenantId,
        ...(showAll ? {} : { deletedAt: null }),
      },
      include: { role: true, branch: true },
      orderBy: { name: "asc" },
    }),
    prisma.role.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    profileImage: u.profileImage,
    roleId: u.roleId,
    branchId: u.branchId,
    isActive: u.isActive,
    deletedAt: u.deletedAt?.toISOString() ?? null,
    roleName: u.role?.name || "—",
    branchName: u.branch?.name || "—",
    extraPermissions: filterValidPermissions(u.extraPermissions),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage team members, roles, and access
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={tenantDashboardPath(slug, "/roles")}>
            <Button variant="outline">Roles & Permissions</Button>
          </Link>
          <UserFormDialog roles={roles} branches={branches} />
        </div>
      </div>

      <Suspense fallback={null}>
        <ShowAllUsersToggle tenantSlug={tenantSlug} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable
            tenantSlug={tenantSlug}
            users={rows}
            roles={roles}
            branches={branches}
          />
        </CardContent>
      </Card>
    </div>
  );
}

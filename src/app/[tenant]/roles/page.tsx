import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { parseRoleBranchIds } from "@/lib/roles";
import { PERMISSION_LABELS, type Permission } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RolePermissionEditor } from "@/components/roles/role-permission-editor";
import { RoleCreateDialog } from "@/components/roles/role-create-dialog";
import { RoleDeleteButton } from "@/components/roles/role-delete-button";
import { RoleEditDialog } from "@/components/roles/role-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default async function RolesPage() {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();

  const [roles, branches] = await Promise.all([
    prisma.role.findMany({
      where: { tenantId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const base = tenantDashboardPath(tenantSlug, "/roles");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Create custom roles with module-wise and action permissions
          </p>
        </div>
        <RoleCreateDialog branches={branches} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const permissions = role.permissions as string[];
          const branchIds = parseRoleBranchIds(role.branchIds);
          return (
            <Card key={role.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="min-w-0">
                  <Link href={`${base}/${role.id}`}>
                    <CardTitle className="text-base hover:underline">
                      {role.name}
                    </CardTitle>
                  </Link>
                  {role.description ? (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {role.description}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-1">
                    {role._count.users} user(s) · {permissions.length} permissions
                    {branchIds.length > 0
                      ? ` · ${branchIds.length} branch(es)`
                      : " · all branches"}
                  </p>
                  <div className="mt-2 flex gap-1">
                    {role.isDefault ? (
                      <Badge variant="outline" className="text-xs">
                        System
                      </Badge>
                    ) : null}
                    <Badge
                      variant={role.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link href={`${base}/${role.id}`}>
                    <Button variant="ghost" size="icon" title="View role">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <RoleEditDialog
                    role={{
                      id: role.id,
                      name: role.name,
                      description: role.description,
                      permissions,
                      branchIds,
                      isDefault: role.isDefault,
                      isActive: role.isActive,
                    }}
                    branches={branches}
                  />
                  <RoleDeleteButton
                    roleId={role.id}
                    roleName={role.name}
                    userCount={role._count.users}
                    isDefault={role.isDefault}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                  {permissions.slice(0, 6).map((p) => (
                    <li key={p}>
                      • {PERMISSION_LABELS[p as Permission] || p}
                    </li>
                  ))}
                  {permissions.length > 6 && (
                    <li>…and {permissions.length - 6} more</li>
                  )}
                </ul>
                <div className="mt-3">
                  <RolePermissionEditor
                    roleId={role.id}
                    roleName={role.name}
                    permissions={permissions}
                    isDefault={role.isDefault}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

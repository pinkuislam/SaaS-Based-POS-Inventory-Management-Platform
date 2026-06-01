import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminRoleFormDialog } from "@/components/admin/admin-role-form-dialog";
import { RolesList } from "@/components/admin/lists/roles-list";

export default async function AdminRolesPage() {
  const roles = await prisma.adminRole.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { admins: true } } },
  });

  const rows = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isActive: r.isActive,
    adminCount: r._count.admins,
    permissions: r.permissions,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Internal staff access control</p>
        </div>
        <AdminRoleFormDialog />
      </div>
      <Card>
        <CardContent className="pt-6">
          <RolesList roles={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

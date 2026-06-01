import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUserFormDialog } from "@/components/admin/admin-user-form-dialog";
import { UsersList } from "@/components/admin/lists/users-list";

export default async function AdminUsersPage() {
  const [admins, roles] = await Promise.all([
    prisma.superAdmin.findMany({
      orderBy: { createdAt: "desc" },
      include: { role: true },
    }),
    prisma.adminRole.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const rows = admins.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    phone: a.phone,
    isActive: a.isActive,
    isPrimary: a.isPrimary,
    roleId: a.roleId,
    roleName: a.role?.name ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground">Platform super admin accounts</p>
        </div>
        <AdminUserFormDialog roles={roles} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersList admins={rows} roles={roles} />
        </CardContent>
      </Card>
    </div>
  );
}

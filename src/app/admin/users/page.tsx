import { prisma } from "@/lib/prisma";
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
import { formatDate } from "@/lib/utils";
import { AdminUserFormDialog } from "@/components/admin/admin-user-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

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
          <CardTitle>Admin Users ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.name}
                    {a.isPrimary && (
                      <Badge className="ml-2" variant="outline">
                        Primary
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>{a.role?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={a.isActive ? "default" : "secondary"}>
                      {a.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(a.createdAt)}</TableCell>
                  <TableCell className="flex gap-1">
                    <AdminUserFormDialog roles={roles} admin={a} mode="edit" />
                    {!a.isPrimary && (
                      <DeleteButton url={`/api/admin/admins/${a.id}`} />
                    )}
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

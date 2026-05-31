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
import { AdminRoleFormDialog } from "@/components/admin/admin-role-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export default async function AdminRolesPage() {
  const roles = await prisma.adminRole.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { admins: true } } },
  });

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Admins</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {r.description || "—"}
                  </TableCell>
                  <TableCell>{r._count.admins}</TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? "default" : "secondary"}>
                      {r.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <AdminRoleFormDialog role={r} mode="edit" />
                    <DeleteButton url={`/api/admin/roles/${r.id}`} />
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

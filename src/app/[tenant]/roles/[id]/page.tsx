import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import { parseRoleBranchIds } from "@/lib/roles";
import { PERMISSION_LABELS, type Permission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleEditDialog } from "@/components/roles/role-edit-dialog";
import { RoleDeleteButton } from "@/components/roles/role-delete-button";
import { ArrowLeft } from "lucide-react";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { id } = await params;

  const role = await prisma.role.findFirst({
    where: { id, tenantId },
    include: {
      users: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          branch: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!role) notFound();

  const permissions = role.permissions as string[];
  const branchIds = parseRoleBranchIds(role.branchIds);

  const branchNames =
    branchIds.length > 0
      ? await prisma.branch.findMany({
          where: { id: { in: branchIds }, tenantId },
          select: { name: true },
        })
      : [];

  const branches = await prisma.branch.findMany({
    where: { tenantId, deletedAt: null, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const rolesHref = tenantDashboardPath(tenantSlug, "/roles");
  const usersHref = tenantDashboardPath(tenantSlug, "/users");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href={rolesHref}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{role.name}</h1>
            {role.description ? (
              <p className="text-muted-foreground">{role.description}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {role.isDefault ? <Badge variant="outline">System role</Badge> : null}
              <Badge variant={role.isActive ? "default" : "secondary"}>
                {role.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
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
            userCount={role.users.length}
            isDefault={role.isDefault}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Branch access</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {branchIds.length === 0 ? (
              <p className="text-muted-foreground">All branches</p>
            ) : (
              <ul className="list-disc pl-4 space-y-1">
                {branchNames.map((b) => (
                  <li key={b.name}>{b.name}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Permissions ({permissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {role.name === "Owner" && role.isDefault ? (
              <p className="text-sm text-muted-foreground">Full access (all permissions)</p>
            ) : (
              <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                {permissions.map((p) => (
                  <li key={p}>• {PERMISSION_LABELS[p as Permission] || p}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned users ({role.users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {role.users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No users assigned to this role.
                  </TableCell>
                </TableRow>
              ) : (
                role.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Link
                        href={`${usersHref}/${u.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {u.name}
                      </Link>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.branch?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "default" : "secondary"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

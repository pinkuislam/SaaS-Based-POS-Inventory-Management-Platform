import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import { userHasTransactionHistory } from "@/lib/users";
import { filterValidPermissions, PERMISSION_LABELS, type Permission } from "@/lib/permissions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserEditDialog } from "@/components/users/user-edit-dialog";
import { UserProfileUpload } from "@/components/users/user-profile-upload";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    include: { role: true, branch: true },
  });

  if (!user) notFound();

  const [loginLogs, activityLogs, recentSales, roles, branches, hasHistory] =
    await Promise.all([
      prisma.loginLog.findMany({
        where: {
          tenantId,
          OR: [{ userId: id }, { email: user.email }],
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.activityLog.findMany({
        where: { tenantId, userId: id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.sale.findMany({
        where: { tenantId, userId: id },
        orderBy: { saleDate: "desc" },
        take: 25,
        include: { customer: true, branch: true },
      }),
      prisma.role.findMany({
        where: { tenantId, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.branch.findMany({
        where: { tenantId, deletedAt: null, isActive: true },
        orderBy: { name: "asc" },
      }),
      userHasTransactionHistory(id),
    ]);

  const extraPermissions = filterValidPermissions(user.extraPermissions);
  const rolePermissions = filterValidPermissions(user.role?.permissions);

  const editUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roleId: user.roleId,
    branchId: user.branchId,
    isActive: user.isActive,
    deletedAt: user.deletedAt?.toISOString() ?? null,
    extraPermissions,
  };

  const usersHref = tenantDashboardPath(tenantSlug, "/users");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href={usersHref}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{user.role?.name || "No role"}</Badge>
              {user.branch ? (
                <Badge variant="secondary">{user.branch.name}</Badge>
              ) : null}
              {user.deletedAt ? (
                <Badge variant="destructive">Deleted</Badge>
              ) : (
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <UserEditDialog user={editUser} roles={roles} branches={branches} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <UserProfileUpload
            userId={user.id}
            name={user.name}
            profileImage={user.profileImage}
          />
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p>{user.phone || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Assigned role</p>
              <p>{user.role?.name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Assigned branch</p>
              <p>{user.branch?.name || "—"}</p>
            </div>
            {hasHistory ? (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  User has linked sales or purchases — can be deactivated but not
                  permanently removed without restore.
                </p>
              </div>
            ) : null}
          </div>
          {extraPermissions.length > 0 ? (
            <div>
              <p className="text-sm font-medium mb-2">Extra permissions</p>
              <div className="flex flex-wrap gap-1">
                {extraPermissions.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">
                    {PERMISSION_LABELS[p as Permission] || p}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {rolePermissions.length > 0 ? (
            <div>
              <p className="text-sm font-medium mb-2">Role permissions</p>
              <div className="flex flex-wrap gap-1">
                {rolePermissions.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">
                    {PERMISSION_LABELS[p as Permission] || p}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales ({recentSales.length})</TabsTrigger>
          <TabsTrigger value="logins">Login history</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No sales handled by this user yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentSales.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Link
                            href={tenantDashboardPath(
                              tenantSlug,
                              `/sales/${s.id}`
                            )}
                            className="text-primary hover:underline"
                          >
                            {s.invoiceNo}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(s.saleDate)}</TableCell>
                        <TableCell>{s.customer?.name || "Walk-in"}</TableCell>
                        <TableCell>{s.branch?.name || "—"}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(decimalToNumber(s.total))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logins" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginLogs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No login history recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    loginLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={log.success ? "default" : "destructive"}>
                            {log.success ? "Success" : "Failed"}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.ip || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No activity logged for this user.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.module}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.details || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
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
import { formatDate, formatCurrency, decimalToNumber } from "@/lib/utils";
import { ImpersonateButton } from "@/components/admin/impersonate-button";
import { TenantActions } from "@/components/admin/tenant-actions";
import { TenantEditButton } from "@/components/admin/tenant-edit-button";
import { ProvisionDbButton } from "@/components/admin/provision-db-button";
import { tenantHomePath } from "@/lib/tenant-path";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      package: true,
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { package: true },
      },
      _count: {
        select: {
          users: true,
          branches: true,
          products: true,
          sales: true,
          customers: true,
          suppliers: true,
          supportTickets: true,
        },
      },
    },
  });

  if (!tenant) notFound();

  const recentLogins = await prisma.loginLog.findMany({
    where: { tenantId: id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const payments = await prisma.subscriptionPayment.findMany({
    where: { subscription: { tenantId: id } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { subscription: { include: { package: true } } },
  });

  const packages = await prisma.subscriptionPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  const tenantEditData = {
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
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/tenants" className="mb-2 inline-block text-sm text-muted-foreground hover:underline">
            ← Back to tenants
          </Link>
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <p className="text-muted-foreground">
            {tenant.ownerName && `${tenant.ownerName} · `}
            {tenant.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TenantEditButton tenant={tenantEditData} packages={packages} />
          <ImpersonateButton tenantId={tenant.id} />
          <a
            href={tenantHomePath(tenant.slug)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">Open in new tab</Button>
          </a>
          <TenantActions
            tenantId={tenant.id}
            status={tenant.status}
            tenant={tenantEditData}
            packages={packages}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{tenant.status}</Badge>
            {tenant.loginBlocked && (
              <Badge variant="destructive" className="ml-2">
                Login blocked
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Package</CardTitle>
          </CardHeader>
          <CardContent>{tenant.package?.name || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Database</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant={tenant.dbProvisioned ? "default" : "secondary"}>
              {tenant.dbProvisioned ? "Provisioned" : "Pending"}
            </Badge>
            <ProvisionDbButton
              tenantId={tenant.id}
              dbProvisioned={tenant.dbProvisioned}
              dbName={tenant.dbName}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Slug</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-sm">{tenant.slug}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          ["Users", tenant._count.users],
          ["Branches", tenant._count.branches],
          ["Products", tenant._count.products],
          ["Sales", tenant._count.sales],
          ["Customers", tenant._count.customers],
          ["Tickets", tenant._count.supportTickets],
        ].map(([label, count]) => (
          <Card key={String(label)}>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.subscriptions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.package.name}</TableCell>
                    <TableCell>{formatDate(s.endDate)}</TableCell>
                    <TableCell>
                      <Badge>{s.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {formatCurrency(decimalToNumber(p.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Success</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogins.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>
                    <Badge variant={l.success ? "default" : "destructive"}>
                      {l.success ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>{l.ip || "—"}</TableCell>
                  <TableCell>{formatDate(l.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

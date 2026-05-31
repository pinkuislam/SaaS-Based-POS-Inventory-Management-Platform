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
import { DatabaseActions } from "@/components/admin/database-actions";
import { BackupActions } from "@/components/admin/backup-actions";

export default async function DatabasesPage() {
  const [tenants, backups] = await Promise.all([
    prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        dbName: true,
        dbProvisioned: true,
        status: true,
      },
    }),
    prisma.tenantDatabaseBackup.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const tenantNames = Object.fromEntries(tenants.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tenant Databases</h1>
        <p className="text-muted-foreground">
          Provision, backup, and monitor per-tenant databases
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Databases</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>DB Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {t.dbProvisioned
                      ? t.dbName || `inventory_pos_${t.slug.replace(/-/g, "_")}`
                      : "Shared (master DB)"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.dbProvisioned ? "default" : "secondary"}>
                      {t.dbProvisioned ? "Provisioned" : "Not provisioned"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DatabaseActions tenantId={t.id} provisioned={t.dbProvisioned} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Backups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{tenantNames[b.tenantId] || b.tenantId}</TableCell>
                  <TableCell className="font-mono text-xs">{b.fileName}</TableCell>
                  <TableCell>
                    <Badge>{b.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(b.createdAt)}</TableCell>
                  <TableCell>
                    <BackupActions
                      backupId={b.id}
                      canDownload={!!(b.filePath && b.status === "success")}
                    />
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

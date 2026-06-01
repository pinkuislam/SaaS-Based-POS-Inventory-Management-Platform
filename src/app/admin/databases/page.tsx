import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { DatabasesList } from "@/components/admin/lists/databases-list";

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
        <CardContent className="pt-6">
          <DatabasesList
            tenants={tenants.map((t) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
              dbName: t.dbName,
              dbProvisioned: t.dbProvisioned,
              status: t.status,
            }))}
            backups={backups.map((b) => ({
              id: b.id,
              tenantId: b.tenantId,
              tenantName: tenantNames[b.tenantId] || b.tenantId,
              fileName: b.fileName,
              status: b.status,
              filePath: b.filePath,
              createdAt: b.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

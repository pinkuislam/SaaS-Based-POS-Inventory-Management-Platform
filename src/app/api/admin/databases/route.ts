import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      dbName: true,
      dbProvisioned: true,
      status: true,
      updatedAt: true,
    },
  });

  const backups = await prisma.tenantDatabaseBackup.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ tenants, backups });
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { tenantId, action } = await request.json();

  if (!tenantId || !action) {
    return NextResponse.json({ error: "tenantId and action required" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  if (action === "provision") {
    try {
      const { provisionTenantDatabase } = await import("@/lib/tenant-database");
      await provisionTenantDatabase(tenantId);
      return NextResponse.json({ success: true, message: "Database provisioned" });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Provision failed" },
        { status: 500 }
      );
    }
  }

  if (action === "backup") {
    if (!tenant.dbProvisioned) {
      return NextResponse.json(
        {
          error:
            "No dedicated database for this tenant. Click Provision first, then run backup.",
        },
        { status: 400 }
      );
    }

    const { buildTenantDatabaseName, tenantDatabaseExists } = await import(
      "@/lib/tenant-database"
    );
    const dbName = tenant.dbName || buildTenantDatabaseName(tenant.slug);

    const exists = await tenantDatabaseExists(dbName);
    if (!exists) {
      return NextResponse.json(
        {
          error: `Database "${dbName}" does not exist in MySQL. Use Provision to create it, or fix the tenant dbName.`,
        },
        { status: 400 }
      );
    }

    const fileName = `${tenant.slug}-${Date.now()}.sql`;
    const { getBackupDirectory, runMysqldump } = await import("@/lib/admin/mysqldump");
    const path = await import("path");
    const dir = getBackupDirectory();
    const filePath = path.join(dir, fileName);
    const relativePath = path.join("storage", "backups", fileName);

    try {
      const { sizeBytes } = await runMysqldump(dbName, filePath);
      const backup = await prisma.tenantDatabaseBackup.create({
        data: {
          tenantId,
          fileName,
          filePath: relativePath,
          sizeBytes,
          status: "success",
          notes: `mysqldump of ${dbName}`,
        },
      });
      return NextResponse.json(backup);
    } catch (e) {
      const backup = await prisma.tenantDatabaseBackup.create({
        data: {
          tenantId,
          fileName,
          status: "failed",
          notes: e instanceof Error ? e.message : "Backup failed",
        },
      });
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Backup failed", backup },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

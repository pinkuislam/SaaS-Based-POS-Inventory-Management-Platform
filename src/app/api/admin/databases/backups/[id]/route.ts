import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { prismaDeleteErrorMessage } from "@/lib/admin/delete-tenant";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const backup = await prisma.tenantDatabaseBackup.findUnique({ where: { id } });
    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    await prisma.tenantDatabaseBackup.delete({ where: { id } });

    if (backup.filePath) {
      try {
        const fullPath = path.isAbsolute(backup.filePath)
          ? backup.filePath
          : path.join(process.cwd(), backup.filePath);
        await unlink(fullPath);
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Backup delete failed:", e);
    return NextResponse.json(
      { error: prismaDeleteErrorMessage(e) },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const backup = await prisma.tenantDatabaseBackup.findUnique({ where: { id } });
  if (!backup?.filePath) {
    return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
  }

  const abs = path.isAbsolute(backup.filePath)
    ? backup.filePath
    : path.join(process.cwd(), backup.filePath);

  try {
    const content = await readFile(abs);
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": `attachment; filename="${backup.fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }
}

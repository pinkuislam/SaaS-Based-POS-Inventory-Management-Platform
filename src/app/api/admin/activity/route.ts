import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const module = searchParams.get("module");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

  const logs = await prisma.platformActivityLog.findMany({
    where: module ? { module } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { admin: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(logs);
}

/** Archive = delete logs older than 90 days */
export async function DELETE() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const result = await prisma.platformActivityLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return NextResponse.json({ success: true, deleted: result.count });
}

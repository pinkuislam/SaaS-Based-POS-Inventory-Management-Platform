import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_users");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, tenantId },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.deletedAt && user.isActive) {
    return NextResponse.json({ error: "User is already active" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { package: true },
  });
  const activeCount = await prisma.user.count({
    where: { tenantId, deletedAt: null },
  });
  const maxUsers = tenant?.package?.maxUsers ?? 10;
  if (user.deletedAt && activeCount >= maxUsers) {
    return NextResponse.json(
      { error: `Cannot restore: user limit reached (${maxUsers} on your plan)` },
      { status: 400 }
    );
  }

  const restored = await prisma.user.update({
    where: { id },
    data: {
      deletedAt: null,
      isActive: true,
    },
    include: { role: true, branch: true },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "restore",
    module: "users",
    details: `Restored user ${restored.email}`,
  });

  return NextResponse.json({
    success: true,
    user: restored,
    message: "User restored successfully.",
  });
}

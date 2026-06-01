import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_branches");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const branch = await prisma.branch.findFirst({
    where: { id, tenantId },
  });
  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  if (!branch.deletedAt && branch.isActive) {
    return NextResponse.json(
      { error: "Branch is already active" },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { package: true },
  });
  const activeCount = await prisma.branch.count({
    where: { tenantId, deletedAt: null },
  });
  const maxBranches = tenant?.package?.maxBranches ?? 1;
  if (branch.deletedAt && activeCount >= maxBranches) {
    return NextResponse.json(
      {
        error: `Cannot restore: branch limit reached (${maxBranches} on your plan)`,
      },
      { status: 400 }
    );
  }

  const restored = await prisma.branch.update({
    where: { id },
    data: {
      deletedAt: null,
      isActive: true,
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "restore",
    module: "branches",
    details: `Restored branch ${restored.name}`,
  });

  return NextResponse.json({
    success: true,
    branch: restored,
    message: "Branch restored successfully.",
  });
}

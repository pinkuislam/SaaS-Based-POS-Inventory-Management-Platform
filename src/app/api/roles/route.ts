import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { filterValidPermissions } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { parseRoleBranchIds } from "@/lib/roles";

export async function GET() {
  const authResult = await requirePermission("manage_users");
  if ("error" in authResult) return authResult.error;

  const roles = await prisma.role.findMany({
    where: { tenantId: authResult.session.user.tenantId! },
    include: { _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    roles.map((r) => ({
      ...r,
      branchIds: parseRoleBranchIds(r.branchIds),
    }))
  );
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_users");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();
  const { name, description, permissions, branchIds, isActive } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Role name is required" }, { status: 400 });
  }

  const existing = await prisma.role.findFirst({
    where: { tenantId, name: name.trim() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A role with this name already exists" },
      { status: 400 }
    );
  }

  const validPermissions = filterValidPermissions(permissions);
  const validBranchIds = parseRoleBranchIds(branchIds);

  if (validBranchIds.length > 0) {
    const count = await prisma.branch.count({
      where: { tenantId, id: { in: validBranchIds }, deletedAt: null },
    });
    if (count !== validBranchIds.length) {
      return NextResponse.json({ error: "Invalid branch selection" }, { status: 400 });
    }
  }

  const role = await prisma.role.create({
    data: {
      tenantId,
      name: name.trim(),
      description: description?.trim() || null,
      permissions: validPermissions,
      branchIds: validBranchIds.length > 0 ? validBranchIds : undefined,
      isDefault: false,
      isActive: isActive !== false,
    },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "create_role",
    module: "users",
    details: `Created role ${role.name}`,
  });

  return NextResponse.json({
    ...role,
    branchIds: parseRoleBranchIds(role.branchIds),
  });
}

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { filterValidPermissions } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { parseRoleBranchIds } from "@/lib/roles";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_users");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const role = await prisma.role.findFirst({
    where: { id, tenantId },
    include: {
      users: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          branch: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      },
      _count: { select: { users: true } },
    },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...role,
    permissions: role.permissions as string[],
    branchIds: parseRoleBranchIds(role.branchIds),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_users");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const role = await prisma.role.findFirst({
    where: { id, tenantId },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  if (role.name === "Owner" && role.isDefault) {
    if (body.name && body.name.trim() !== "Owner") {
      return NextResponse.json(
        { error: "Cannot rename default Owner role" },
        { status: 400 }
      );
    }
    if (body.permissions !== undefined) {
      return NextResponse.json(
        { error: "Cannot modify default Owner role permissions" },
        { status: 400 }
      );
    }
  }

  const validPermissions =
    body.permissions !== undefined
      ? filterValidPermissions(body.permissions)
      : undefined;

  let branchIdsData: string[] | null | undefined = undefined;
  if (body.branchIds !== undefined) {
    const validBranchIds = parseRoleBranchIds(body.branchIds);
    if (validBranchIds.length > 0) {
      const count = await prisma.branch.count({
        where: { tenantId, id: { in: validBranchIds }, deletedAt: null },
      });
      if (count !== validBranchIds.length) {
        return NextResponse.json({ error: "Invalid branch selection" }, { status: 400 });
      }
      branchIdsData = validBranchIds;
    } else {
      branchIdsData = [];
    }
  }

  if (body.name?.trim() && body.name.trim() !== role.name) {
    const dup = await prisma.role.findFirst({
      where: { tenantId, name: body.name.trim(), NOT: { id } },
    });
    if (dup) {
      return NextResponse.json(
        { error: "A role with this name already exists" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.role.update({
    where: { id },
    data: {
      ...(body.name?.trim() && { name: body.name.trim() }),
      ...(body.description !== undefined && {
        description: body.description?.trim() || null,
      }),
      ...(validPermissions !== undefined && { permissions: validPermissions }),
      ...(branchIdsData !== undefined && {
        branchIds: branchIdsData.length > 0 ? branchIdsData : [],
      }),
      ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
    },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "update_role",
    module: "users",
    details: `Updated role ${updated.name}`,
  });

  return NextResponse.json({
    ...updated,
    branchIds: parseRoleBranchIds(updated.branchIds),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_users");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const role = await prisma.role.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { users: true } } },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  if (role.isDefault) {
    return NextResponse.json(
      { error: "Cannot delete a default system role" },
      { status: 400 }
    );
  }

  const assignedUsers = await prisma.user.count({
    where: { roleId: id, deletedAt: null },
  });
  if (assignedUsers > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete role: ${assignedUsers} user(s) still assigned. Reassign them first.`,
      },
      { status: 400 }
    );
  }

  await prisma.role.delete({ where: { id } });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "delete_role",
    module: "users",
    details: `Deleted role ${role.name}`,
  });

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { filterValidPermissions } from "@/lib/permissions";
import { userHasTransactionHistory } from "@/lib/users";
import bcrypt from "bcryptjs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_users");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    include: {
      role: true,
      branch: true,
      _count: { select: { sales: true, purchases: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hasHistory = await userHasTransactionHistory(id);

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    roleId: user.roleId,
    branchId: user.branchId,
    isActive: user.isActive,
    deletedAt: user.deletedAt,
    role: user.role,
    branch: user.branch,
    extraPermissions: user.extraPermissions,
    hasHistory,
    salesCount: user._count.sales,
    purchasesCount: user._count.purchases,
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

  const user = await prisma.user.findFirst({
    where: { id, tenantId },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.deletedAt) {
    return NextResponse.json(
      { error: "Cannot edit a deleted user. Restore them first." },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};

  if (body.name?.trim()) updateData.name = body.name.trim();
  if (body.phone !== undefined) updateData.phone = body.phone || null;
  if (body.roleId !== undefined) {
    updateData.role = body.roleId
      ? { connect: { id: body.roleId } }
      : { disconnect: true };
  }
  if (body.branchId !== undefined) {
    updateData.branch = body.branchId
      ? { connect: { id: body.branchId } }
      : { disconnect: true };
  }
  if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;
  if (body.profileImage !== undefined) updateData.profileImage = body.profileImage;

  if (body.extraPermissions !== undefined) {
    const valid = filterValidPermissions(body.extraPermissions);
    updateData.extraPermissions = valid.length > 0 ? valid : [];
  }

  if (body.email?.trim() && body.email.trim() !== user.email) {
    const dup = await prisma.user.findFirst({
      where: { email: body.email.trim(), tenantId, NOT: { id: user.id } },
    });
    if (dup) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }
    updateData.email = body.email.trim();
  }

  if (body.password?.trim()) {
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    updateData.password = await bcrypt.hash(body.password, 10);
    updateData.mustChangePassword = body.forcePasswordReset === true;
  }

  if (typeof body.forcePasswordReset === "boolean" && !body.password?.trim()) {
    updateData.mustChangePassword = body.forcePasswordReset;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { role: true, branch: true },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "update",
    module: "users",
    details: `Updated user ${updated.email}`,
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    isActive: updated.isActive,
    role: updated.role,
    branch: updated.branch,
    profileImage: updated.profileImage,
    extraPermissions: updated.extraPermissions,
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

  if (id === authResult.session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: { id, tenantId },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.deletedAt) {
    return NextResponse.json({ error: "User is already deleted" }, { status: 400 });
  }

  const hasHistory = await userHasTransactionHistory(id);

  if (hasHistory) {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    await logActivity({
      tenantId,
      userId: authResult.session.user.id,
      userName: authResult.session.user.name || undefined,
      action: "deactivate",
      module: "users",
      details: `Deactivated user ${user.email} (linked sales/purchases)`,
    });
    return NextResponse.json({
      success: true,
      deactivated: true,
      message:
        "User has sales or purchase records and was deactivated instead of deleted.",
    });
  }

  await prisma.user.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "delete",
    module: "users",
    details: `Soft-deleted user ${user.email}`,
  });

  return NextResponse.json({
    success: true,
    deleted: true,
    message: "User deleted successfully.",
  });
}

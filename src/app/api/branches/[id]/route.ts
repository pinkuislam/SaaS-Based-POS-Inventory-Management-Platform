import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { branchHasHistory, parseBranchSettings } from "@/lib/branches";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_branches");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const branch = await prisma.branch.findFirst({
    where: { id, tenantId },
    include: {
      manager: { select: { id: true, name: true, email: true, phone: true } },
      users: {
        select: { id: true, name: true, email: true, phone: true, isActive: true },
        orderBy: { name: "asc" },
      },
      _count: {
        select: {
          users: true,
          products: true,
          sales: true,
          purchases: true,
          stockMovements: true,
          expenses: true,
        },
      },
    },
  });

  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  const settings = parseBranchSettings(branch.settings);
  const hasHistory = await branchHasHistory(id);

  return NextResponse.json({
    ...branch,
    settings,
    hasHistory,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_branches");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const branch = await prisma.branch.findFirst({
    where: { id, tenantId },
  });
  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  if (branch.deletedAt) {
    return NextResponse.json(
      { error: "Cannot edit a deleted branch. Restore it first." },
      { status: 400 }
    );
  }

  if (body.managerId) {
    const manager = await prisma.user.findFirst({
      where: { id: body.managerId, tenantId, isActive: true },
    });
    if (!manager) {
      return NextResponse.json({ error: "Invalid branch manager" }, { status: 400 });
    }
  }

  if (body.isMain) {
    await prisma.branch.updateMany({
      where: { tenantId, deletedAt: null, id: { not: id } },
      data: { isMain: false },
    });
  }

  let settings = parseBranchSettings(branch.settings);
  if (body.invoicePrefix !== undefined || body.settingsNotes !== undefined) {
    settings = {
      ...settings,
      ...(body.invoicePrefix !== undefined && {
        invoicePrefix: body.invoicePrefix?.trim() || undefined,
      }),
      ...(body.settingsNotes !== undefined && {
        notes: body.settingsNotes?.trim() || undefined,
      }),
    };
  } else if (body.settings !== undefined) {
    settings = parseBranchSettings(body.settings);
  }

  const hasSettings = settings.invoicePrefix || settings.notes;

  const updated = await prisma.branch.update({
    where: { id },
    data: {
      ...(body.name?.trim() && { name: body.name.trim() }),
      ...(body.code !== undefined && { code: body.code?.trim() || null }),
      ...(body.address !== undefined && { address: body.address?.trim() || null }),
      ...(body.contactPerson !== undefined && {
        contactPerson: body.contactPerson?.trim() || null,
      }),
      ...(body.phone !== undefined && { phone: body.phone?.trim() || null }),
      ...(body.email !== undefined && { email: body.email?.trim() || null }),
      ...(body.openingBalance !== undefined && {
        openingBalance:
          body.openingBalance === "" || body.openingBalance === null
            ? null
            : parseFloat(String(body.openingBalance)),
      }),
      ...(body.managerId !== undefined && {
        managerId: body.managerId || null,
      }),
      ...(typeof body.isMain === "boolean" && { isMain: body.isMain }),
      ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
      ...((body.invoicePrefix !== undefined ||
        body.settingsNotes !== undefined ||
        body.settings !== undefined) && {
        settings: hasSettings ? settings : null,
      }),
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "update",
    module: "branches",
    details: `Updated branch ${updated.name}`,
  });

  return NextResponse.json({
    ...updated,
    settings: parseBranchSettings(updated.settings),
  });
}

export async function DELETE(
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

  if (branch.isMain) {
    return NextResponse.json(
      { error: "Cannot delete or archive the main branch" },
      { status: 400 }
    );
  }

  if (branch.deletedAt) {
    return NextResponse.json({ error: "Branch is already deleted" }, { status: 400 });
  }

  const hasHistory = await branchHasHistory(id);

  if (hasHistory) {
    await prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
    await logActivity({
      tenantId,
      userId: authResult.session.user.id,
      userName: authResult.session.user.name || undefined,
      action: "archive",
      module: "branches",
      details: `Archived branch ${branch.name} (has transaction history)`,
    });
    return NextResponse.json({
      success: true,
      archived: true,
      message:
        "Branch has sales, purchases, stock, or products. It was archived (deactivated) instead of deleted.",
    });
  }

  await prisma.branch.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
      managerId: null,
    },
  });

  await prisma.user.updateMany({
    where: { branchId: id },
    data: { branchId: null },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "delete",
    module: "branches",
    details: `Soft-deleted branch ${branch.name}`,
  });

  return NextResponse.json({
    success: true,
    deleted: true,
    message: "Branch deleted successfully.",
  });
}

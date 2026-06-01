import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { activeBranchWhere, parseBranchSettings } from "@/lib/branches";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_branches");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const includeDeleted = searchParams.get("includeDeleted") === "1";
  const includeInactive = searchParams.get("includeInactive") === "1";

  const branches = await prisma.branch.findMany({
    where: {
      ...activeBranchWhere(tenantId, includeDeleted),
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          users: true,
          products: true,
          sales: true,
          purchases: true,
        },
      },
    },
    orderBy: [{ isMain: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(branches);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_branches");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();
  const {
    name,
    code,
    address,
    contactPerson,
    phone,
    email,
    openingBalance,
    managerId,
    isMain,
    isActive,
    invoicePrefix,
    settingsNotes,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { package: true },
  });

  const branchCount = await prisma.branch.count({
    where: { tenantId, deletedAt: null },
  });
  const maxBranches = tenant?.package?.maxBranches ?? 1;
  if (branchCount >= maxBranches) {
    return NextResponse.json(
      { error: `Branch limit reached (${maxBranches} on your plan)` },
      { status: 400 }
    );
  }

  if (managerId) {
    const manager = await prisma.user.findFirst({
      where: { id: managerId, tenantId, isActive: true },
    });
    if (!manager) {
      return NextResponse.json({ error: "Invalid branch manager" }, { status: 400 });
    }
  }

  if (isMain) {
    await prisma.branch.updateMany({
      where: { tenantId, deletedAt: null },
      data: { isMain: false },
    });
  }

  const settings =
    invoicePrefix?.trim() || settingsNotes?.trim()
      ? {
          ...(invoicePrefix?.trim() && { invoicePrefix: invoicePrefix.trim() }),
          ...(settingsNotes?.trim() && { notes: settingsNotes.trim() }),
        }
      : null;

  const branch = await prisma.branch.create({
    data: {
      tenantId,
      name: name.trim(),
      code: code?.trim() || null,
      address: address?.trim() || null,
      contactPerson: contactPerson?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      openingBalance:
        openingBalance !== undefined && openingBalance !== ""
          ? parseFloat(String(openingBalance))
          : null,
      managerId: managerId || null,
      isMain: !!isMain,
      isActive: isActive !== false,
      settings,
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "create",
    module: "branches",
    details: `Created branch ${branch.name}`,
  });

  return NextResponse.json(branch);
}

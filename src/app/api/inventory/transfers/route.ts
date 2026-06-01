import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_inventory");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const transfers = await prisma.stockTransfer.findMany({
    where: {
      tenantId,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      fromBranch: { select: { name: true } },
      toBranch: { select: { name: true } },
      requestedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  });

  return NextResponse.json(transfers);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_inventory");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const { productId, fromBranchId, toBranchId, quantity, notes } =
    await request.json();

  if (!productId || !toBranchId || !quantity || quantity <= 0) {
    return NextResponse.json(
      { error: "Product, destination branch, and quantity required" },
      { status: 400 }
    );
  }

  if (fromBranchId && fromBranchId === toBranchId) {
    return NextResponse.json(
      { error: "Source and destination must differ" },
      { status: 400 }
    );
  }

  const reference = `TRF-${Date.now().toString(36).toUpperCase()}`;

  const transfer = await prisma.stockTransfer.create({
    data: {
      tenantId,
      productId,
      fromBranchId: fromBranchId || session.user.branchId || null,
      toBranchId,
      quantity,
      reference,
      notes,
      status: "PENDING",
      requestedById: session.user.id,
    },
    include: {
      product: true,
      fromBranch: true,
      toBranch: true,
    },
  });

  return NextResponse.json(transfer);
}

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applySaleReturnStock, reverseSaleReturnStock } from "@/lib/sale-returns";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("create_sales");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const row = await prisma.saleReturn.findFirst({
    where: { id, tenantId: authResult.session.user.tenantId! },
    include: {
      sale: { include: { customer: true } },
      customer: true,
      items: { include: { product: true } },
    },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("approve_returns");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const { action, reason } = await request.json();

  const existing = await prisma.saleReturn.findFirst({
    where: { id, tenantId },
    include: { items: true, sale: { include: { items: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve" && existing.status === "PENDING") {
    await prisma.$transaction(async (tx) => {
      await applySaleReturnStock(tx, existing.sale, existing, tenantId);
      await tx.saleReturn.update({
        where: { id },
        data: { status: "COMPLETED", refundStatus: "completed" },
      });
    });
    return NextResponse.json({ success: true });
  }

  if (action === "reject" && existing.status === "PENDING") {
    await prisma.saleReturn.update({
      where: { id },
      data: { status: "REJECTED", refundStatus: "rejected", notes: reason },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("create_sales");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason =
    typeof body.reason === "string" ? body.reason.trim() : "";

  const existing = await prisma.saleReturn.findFirst({
    where: { id, tenantId },
    include: { items: true, sale: { include: { items: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.status === "DRAFT") {
    await prisma.saleReturn.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  if (existing.status !== "COMPLETED") {
    return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: "Reason required" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await reverseSaleReturnStock(tx, existing.sale, existing, tenantId);
    await tx.saleReturn.update({
      where: { id },
      data: { status: "CANCELLED", notes: reason },
    });
  });

  return NextResponse.json({ success: true });
}

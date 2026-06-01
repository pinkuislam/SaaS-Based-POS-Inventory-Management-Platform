import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const purchaseReturn = await prisma.purchaseReturn.findFirst({
    where: { id, tenantId: authResult.session.user.tenantId! },
    include: {
      purchase: { include: { supplier: true } },
      supplier: true,
      items: { include: { product: true } },
    },
  });

  if (!purchaseReturn) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(purchaseReturn);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.purchaseReturn.findFirst({
    where: { id, tenantId },
    include: { items: true, purchase: { include: { items: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft returns can be edited" },
      { status: 400 }
    );
  }

  if (body.items?.length) {
    await prisma.purchaseReturnItem.deleteMany({
      where: { purchaseReturnId: id },
    });
  }

  const updated = await prisma.purchaseReturn.update({
    where: { id },
    data: {
      ...(body.reason !== undefined && { reason: body.reason }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.refundAmount !== undefined && { refundAmount: body.refundAmount }),
      ...(body.items?.length && {
        items: {
          create: body.items.map(
            (item: {
              purchaseItemId?: string;
              productId: string;
              quantity: number;
              refundAmount?: number;
              reason?: string;
            }) => ({
              purchaseItemId: item.purchaseItemId || null,
              productId: item.productId,
              quantity: item.quantity,
              refundAmount: item.refundAmount || 0,
              reason: item.reason || null,
            })
          ),
        },
      }),
    },
    include: { items: { include: { product: true } }, purchase: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason =
    typeof body.reason === "string" ? body.reason.trim() : "";

  const existing = await prisma.purchaseReturn.findFirst({
    where: { id, tenantId },
    include: { items: true, purchase: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status === "DRAFT") {
    await prisma.purchaseReturn.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  if (existing.status !== "COMPLETED") {
    return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });
  }

  if (!reason) {
    return NextResponse.json(
      { error: "Cancellation reason required" },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const item of existing.items) {
      const qty = decimalToNumber(item.quantity);
      if (qty <= 0) continue;

      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: qty } },
      });

      if (item.purchaseItemId) {
        await tx.purchaseItem.update({
          where: { id: item.purchaseItemId },
          data: { returnedQty: { decrement: qty } },
        });
      }

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: existing.purchase.branchId,
          productId: item.productId,
          type: "ADJUSTMENT",
          quantity: qty,
          reference: existing.returnNo,
          notes: `Return cancelled: ${reason}`,
          status: "APPROVED",
        },
      });
    }

    await tx.purchaseReturn.update({
      where: { id },
      data: { status: "CANCELLED", notes: reason },
    });

    if (existing.purchase.status === "RETURNED") {
      await tx.purchase.update({
        where: { id: existing.purchaseId },
        data: { status: "COMPLETED" },
      });
    }
  });

  return NextResponse.json({ success: true });
}

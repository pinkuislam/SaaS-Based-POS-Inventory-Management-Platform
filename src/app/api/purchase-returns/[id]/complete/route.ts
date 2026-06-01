import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const existing = await prisma.purchaseReturn.findFirst({
    where: { id, tenantId, status: "DRAFT" },
    include: { items: true, purchase: { include: { items: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const purchase = existing.purchase;

  await prisma.$transaction(async (tx) => {
    for (const item of existing.items) {
      const purchaseItem = purchase.items.find(
        (pi) =>
          pi.id === item.purchaseItemId || pi.productId === item.productId
      );
      if (!purchaseItem) continue;

      const returnQty = decimalToNumber(item.quantity);
      const maxReturn =
        decimalToNumber(purchaseItem.quantity) -
        decimalToNumber(purchaseItem.returnedQty);
      const qty = Math.min(returnQty, maxReturn);
      if (qty <= 0) continue;

      const stock = await tx.product.findUnique({
        where: { id: purchaseItem.productId },
        select: { stockQty: true, name: true },
      });
      if (decimalToNumber(stock?.stockQty) < qty) {
        throw new Error(`Insufficient stock for ${stock?.name}`);
      }

      await tx.purchaseItem.update({
        where: { id: purchaseItem.id },
        data: { returnedQty: { increment: qty } },
      });

      await tx.product.update({
        where: { id: purchaseItem.productId },
        data: { stockQty: { decrement: qty } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: purchase.branchId,
          productId: purchaseItem.productId,
          type: "RETURN",
          quantity: -qty,
          reference: existing.returnNo,
          notes: `Purchase return ${existing.returnNo}`,
          status: "APPROVED",
        },
      });
    }

    const updatedItems = await tx.purchaseItem.findMany({
      where: { purchaseId: purchase.id },
    });
    const fullyReturned = updatedItems.every(
      (item) =>
        decimalToNumber(item.returnedQty) >= decimalToNumber(item.quantity)
    );

    await tx.purchaseReturn.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    if (fullyReturned) {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: "RETURNED" },
      });
    }
  });

  const updated = await prisma.purchaseReturn.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, purchase: true },
  });

  return NextResponse.json(updated);
}

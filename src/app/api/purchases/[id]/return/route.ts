import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const returnItems: { purchaseItemId: string; quantity: number }[] =
    body.items || [];

  const purchase = await prisma.purchase.findFirst({
    where: { id, tenantId },
    include: { items: { include: { product: true } } },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  if (purchase.status === "RETURNED" || purchase.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Purchase already returned or cancelled" },
      { status: 400 }
    );
  }

  const itemsToReturn =
    returnItems.length > 0
      ? returnItems.map((r) => ({
          purchaseItemId: r.purchaseItemId,
          quantity: r.quantity,
        }))
      : purchase.items.map((item) => ({
          purchaseItemId: item.id,
          quantity:
            decimalToNumber(item.quantity) -
            decimalToNumber(item.returnedQty),
        }));

  try {
  const result = await prisma.$transaction(async (tx) => {
    for (const ret of itemsToReturn) {
      const purchaseItem = purchase.items.find(
        (i) => i.id === ret.purchaseItemId
      );
      if (!purchaseItem || ret.quantity <= 0) continue;

      const maxReturn =
        decimalToNumber(purchaseItem.quantity) -
        decimalToNumber(purchaseItem.returnedQty);
      const returnQty = Math.min(ret.quantity, maxReturn);
      if (returnQty <= 0) continue;

      const currentStock = await tx.product.findUnique({
        where: { id: purchaseItem.productId },
        select: { stockQty: true },
      });
      const stock = decimalToNumber(currentStock?.stockQty);
      if (stock < returnQty) {
        throw new Error(
          `Insufficient stock for ${purchaseItem.product.name}`
        );
      }

      await tx.purchaseItem.update({
        where: { id: purchaseItem.id },
        data: { returnedQty: { increment: returnQty } },
      });

      await tx.product.update({
        where: { id: purchaseItem.productId },
        data: { stockQty: { decrement: returnQty } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: purchase.branchId,
          productId: purchaseItem.productId,
          type: "RETURN",
          quantity: -returnQty,
          reference: purchase.invoiceNo,
          notes: `Purchase return ${purchase.invoiceNo}`,
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

    if (fullyReturned) {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: "RETURNED" },
      });
    }

    return tx.purchase.findUnique({
      where: { id: purchase.id },
      include: { items: { include: { product: true } } },
    });
  });

  return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Return failed" },
      { status: 400 }
    );
  }
}

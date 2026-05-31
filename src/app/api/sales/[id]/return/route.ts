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
  const returnItems: { saleItemId: string; quantity: number }[] =
    body.items || [];

  const sale = await prisma.sale.findFirst({
    where: { id, tenantId },
    include: { items: { include: { product: true } } },
  });

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  if (sale.status === "RETURNED" || sale.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Sale already returned or cancelled" },
      { status: 400 }
    );
  }

  const itemsToReturn =
    returnItems.length > 0
      ? returnItems
      : sale.items.map((item) => ({
          saleItemId: item.id,
          quantity:
            decimalToNumber(item.quantity) - decimalToNumber(item.returnedQty),
        }));

  const result = await prisma.$transaction(async (tx) => {
    for (const ret of itemsToReturn) {
      const saleItem = sale.items.find((i) => i.id === ret.saleItemId);
      if (!saleItem || ret.quantity <= 0) continue;

      const maxReturn =
        decimalToNumber(saleItem.quantity) -
        decimalToNumber(saleItem.returnedQty);
      const returnQty = Math.min(ret.quantity, maxReturn);
      if (returnQty <= 0) continue;

      await tx.saleItem.update({
        where: { id: saleItem.id },
        data: { returnedQty: { increment: returnQty } },
      });

      await tx.product.update({
        where: { id: saleItem.productId },
        data: { stockQty: { increment: returnQty } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: sale.branchId,
          productId: saleItem.productId,
          type: "RETURN",
          quantity: returnQty,
          reference: sale.invoiceNo,
          notes: `Return from ${sale.invoiceNo}`,
        },
      });
    }

    const updatedItems = await tx.saleItem.findMany({
      where: { saleId: sale.id },
    });

    const fullyReturned = updatedItems.every(
      (item) =>
        decimalToNumber(item.returnedQty) >= decimalToNumber(item.quantity)
    );

    if (fullyReturned) {
      await tx.sale.update({
        where: { id: sale.id },
        data: { status: "RETURNED" },
      });
    }

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: { items: { include: { product: true } } },
    });
  });

  return NextResponse.json(result);
}

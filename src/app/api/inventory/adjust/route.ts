import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { productId, quantity, type, notes } = await request.json();

  if (!productId || quantity === undefined || quantity === 0) {
    return NextResponse.json(
      { error: "Product and non-zero quantity required" },
      { status: 400 }
    );
  }

  const movementType =
    type === "damage" ? "DAMAGE" : quantity > 0 ? "ADJUSTMENT" : "ADJUSTMENT";

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new Error("Product not found");

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stockQty: { increment: quantity } },
    });

    await tx.stockMovement.create({
      data: {
        tenantId,
        branchId: session.user.branchId,
        productId,
        type: movementType,
        quantity,
        reference: "ADJ",
        notes: notes || (quantity > 0 ? "Stock increase" : "Stock decrease"),
      },
    });

    return updated;
  });

  return NextResponse.json(result);
}

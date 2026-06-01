import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("approve_stock_adjustment");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const movement = await prisma.stockMovement.findFirst({
    where: { id, tenantId, status: "PENDING" },
  });
  if (!movement) {
    return NextResponse.json({ error: "Pending movement not found" }, { status: 404 });
  }

  const qty = decimalToNumber(movement.quantity);
  const product = await prisma.product.findFirst({
    where: { id: movement.productId, tenantId },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if (qty < 0 && decimalToNumber(product.stockQty) + qty < 0) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: movement.productId },
      data: { stockQty: { increment: qty } },
    });
    return tx.stockMovement.update({
      where: { id },
      data: { status: "APPROVED" },
    });
  });

  return NextResponse.json(updated);
}

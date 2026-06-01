import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_inventory");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const session = authResult.session;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason =
    typeof body.reason === "string" ? body.reason.trim() : "";

  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const movement = await prisma.stockMovement.findFirst({
    where: { id, tenantId, status: "APPROVED" },
  });
  if (!movement) {
    return NextResponse.json(
      { error: "Approved movement not found" },
      { status: 404 }
    );
  }

  const qty = decimalToNumber(movement.quantity);
  const reverseQty = -qty;

  const result = await prisma.$transaction(async (tx) => {
    await tx.stockMovement.update({
      where: { id },
      data: { status: "REVERSED", reversedAt: new Date() },
    });

    await tx.product.update({
      where: { id: movement.productId },
      data: { stockQty: { increment: reverseQty } },
    });

    return tx.stockMovement.create({
      data: {
        tenantId,
        branchId: movement.branchId,
        productId: movement.productId,
        userId: session.user.id,
        type: "ADJUSTMENT",
        quantity: reverseQty,
        reference: movement.reference,
        reason,
        notes: `Reversal of ${movement.id}: ${reason}`,
        status: "APPROVED",
        parentMovementId: movement.id,
      },
    });
  });

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";

export async function POST(
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

  if (!reason) {
    return NextResponse.json(
      { error: "Cancellation reason is required" },
      { status: 400 }
    );
  }

  const purchase = await prisma.purchase.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (purchase.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Only completed purchases can be cancelled" },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const item of purchase.items) {
      const qty =
        decimalToNumber(item.quantity) - decimalToNumber(item.returnedQty);
      if (qty <= 0) continue;

      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: qty } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: purchase.branchId,
          productId: item.productId,
          type: "ADJUSTMENT",
          quantity: -qty,
          reference: purchase.invoiceNo,
          notes: `Purchase cancelled: ${reason}`,
        },
      });
    }

    await tx.purchase.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancellationReason: reason,
        notes: purchase.notes
          ? `${purchase.notes}\nCancelled: ${reason}`
          : `Cancelled: ${reason}`,
      },
    });
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "cancel_purchase",
    module: "purchases",
    details: `Cancelled ${purchase.invoiceNo}: ${reason}`,
  });

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const { id } = await params;

  const purchase = await prisma.purchase.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (purchase.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft purchases can be completed" },
      { status: 400 }
    );
  }

  const paid = decimalToNumber(purchase.paidAmount);
  const total = decimalToNumber(purchase.total);
  const dueAmount = Math.max(0, total - paid);
  const paymentStatus =
    dueAmount <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "DUE";

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of purchase.items) {
      const qty = decimalToNumber(item.quantity);
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQty: { increment: qty },
          purchasePrice: item.unitPrice,
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: purchase.branchId,
          productId: item.productId,
          userId: session.user.id,
          type: "PURCHASE",
          quantity: qty,
          reference: purchase.invoiceNo,
          status: "APPROVED",
        },
      });
    }

    return tx.purchase.update({
      where: { id },
      data: { status: "COMPLETED", dueAmount, paymentStatus },
      include: { items: { include: { product: true } }, supplier: true },
    });
  });

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name,
    action: "complete_purchase",
    module: "purchases",
    details: `Completed ${purchase.invoiceNo}`,
  });

  return NextResponse.json(updated);
}

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_pos");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();
  const { paidAmount, paymentMethod } = body;

  const sale = await prisma.sale.findFirst({
    where: { id, tenantId, status: "HELD" },
    include: { items: true },
  });

  if (!sale) {
    return NextResponse.json({ error: "Held sale not found" }, { status: 404 });
  }

  const total = Number(sale.total);
  const paid = paidAmount ?? total;
  const dueAmount = Math.max(0, total - paid);
  const paymentStatus =
    dueAmount <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "DUE";

  const updated = await prisma.$transaction(async (tx) => {
    const completed = await tx.sale.update({
      where: { id },
      data: {
        status: "COMPLETED",
        paidAmount: paid,
        dueAmount,
        paymentMethod: paymentMethod || "cash",
        paymentStatus,
        saleDate: new Date(),
      },
      include: { items: true, customer: true },
    });

    for (const item of sale.items) {
      const qty = Number(item.quantity);
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: qty } },
      });
      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: sale.branchId,
          productId: item.productId,
          type: "SALE",
          quantity: -qty,
          reference: sale.invoiceNo,
        },
      });
    }

    return completed;
  });

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name,
    action: "complete_held_sale",
    module: "pos",
    details: `Completed held sale ${sale.invoiceNo}`,
  });

  return NextResponse.json(updated);
}

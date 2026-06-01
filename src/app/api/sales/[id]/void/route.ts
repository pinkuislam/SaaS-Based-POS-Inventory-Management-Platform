import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("create_sales");
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

  const sale = await prisma.sale.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  if (sale.status === "CANCELLED") {
    return NextResponse.json({ error: "Sale already cancelled" }, { status: 400 });
  }

  if (sale.status === "HELD") {
    await prisma.sale.update({
      where: { id },
      data: { status: "CANCELLED", notes: reason },
    });
    return NextResponse.json({ success: true });
  }

  if (sale.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Only completed or held sales can be voided" },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      const qty =
        decimalToNumber(item.quantity) - decimalToNumber(item.returnedQty);
      if (qty <= 0) continue;

      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: qty } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: sale.branchId,
          productId: item.productId,
          type: "RETURN",
          quantity: qty,
          reference: sale.invoiceNo,
          notes: `Void: ${reason}`,
        },
      });
    }

    await tx.sale.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancellationReason: reason,
        notes: sale.notes ? `${sale.notes}\nVoided: ${reason}` : `Voided: ${reason}`,
      },
    });
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "void",
    module: "sales",
    details: `Voided sale ${sale.invoiceNo}: ${reason}`,
  });

  return NextResponse.json({ success: true });
}

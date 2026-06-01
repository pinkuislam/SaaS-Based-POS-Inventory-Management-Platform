import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { executeStockTransfer } from "@/lib/inventory";
import { decimalToNumber } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_inventory");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const { id } = await params;
  const { action, reason } = await request.json();

  const transfer = await prisma.stockTransfer.findFirst({
    where: { id, tenantId },
    include: { product: true },
  });
  if (!transfer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "approve") {
    if (transfer.status !== "PENDING") {
      return NextResponse.json({ error: "Not pending" }, { status: 400 });
    }
    const qty = decimalToNumber(transfer.quantity);
    try {
      const updated = await prisma.$transaction(async (tx) => {
        await executeStockTransfer(tx, {
          tenantId,
          productId: transfer.productId,
          fromBranchId: transfer.fromBranchId,
          toBranchId: transfer.toBranchId,
          quantity: qty,
          reference: transfer.reference,
          notes: transfer.notes || undefined,
          userId: session.user.id,
        });
        return tx.stockTransfer.update({
          where: { id },
          data: {
            status: "RECEIVED",
            approvedById: session.user.id,
          },
        });
      });
      return NextResponse.json(updated);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Approve failed" },
        { status: 400 }
      );
    }
  }

  if (action === "reject") {
    if (transfer.status !== "PENDING") {
      return NextResponse.json({ error: "Not pending" }, { status: 400 });
    }
    const updated = await prisma.stockTransfer.update({
      where: { id },
      data: {
        status: "REJECTED",
        notes: reason
          ? `${transfer.notes || ""}\nRejected: ${reason}`.trim()
          : transfer.notes,
        approvedById: session.user.id,
      },
    });
    return NextResponse.json(updated);
  }

  if (action === "receive") {
    if (transfer.status !== "APPROVED") {
      return NextResponse.json({ error: "Must be approved first" }, { status: 400 });
    }
    const updated = await prisma.stockTransfer.update({
      where: { id },
      data: { status: "RECEIVED" },
    });
    return NextResponse.json(updated);
  }

  if (action === "cancel") {
    if (!["PENDING", "APPROVED"].includes(transfer.status)) {
      return NextResponse.json({ error: "Cannot cancel" }, { status: 400 });
    }
    const updated = await prisma.stockTransfer.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

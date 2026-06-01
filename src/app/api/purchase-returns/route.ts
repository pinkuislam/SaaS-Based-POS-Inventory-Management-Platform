import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";
import { decimalToNumber } from "@/lib/utils";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const supplierId = searchParams.get("supplierId");

  const returns = await prisma.purchaseReturn.findMany({
    where: {
      tenantId,
      ...(status ? { status: status as never } : {}),
      ...(supplierId ? { supplierId } : {}),
    },
    orderBy: { returnDate: "desc" },
    take: 100,
    include: {
      purchase: { select: { invoiceNo: true } },
      supplier: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  return NextResponse.json(returns);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_purchases");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();
  const {
    purchaseId,
    items,
    reason,
    notes,
    refundAmount,
    status: returnStatus,
  } = body;

  if (!purchaseId || !items?.length) {
    return NextResponse.json(
      { error: "Purchase and items required" },
      { status: 400 }
    );
  }

  const purchase = await prisma.purchase.findFirst({
    where: { id: purchaseId, tenantId },
    include: { items: true },
  });
  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  if (purchase.status === "DRAFT") {
    return NextResponse.json(
      { error: "Complete the purchase before returning" },
      { status: 400 }
    );
  }

  const count = await prisma.purchaseReturn.count({ where: { tenantId } });
  const returnNo = generateInvoiceNo("PRET", count + 1);
  const isDraft = returnStatus === "DRAFT";
  const totalRefund =
    refundAmount ??
    items.reduce(
      (s: number, i: { refundAmount?: number }) => s + (i.refundAmount || 0),
      0
    );

  const result = await prisma.$transaction(async (tx) => {
    const purchaseReturn = await tx.purchaseReturn.create({
      data: {
        tenantId,
        purchaseId,
        supplierId: purchase.supplierId,
        returnNo,
        status: isDraft ? "DRAFT" : "COMPLETED",
        refundAmount: totalRefund,
        reason: reason || null,
        notes: notes || null,
        items: {
          create: items.map(
            (item: {
              purchaseItemId?: string;
              productId?: string;
              quantity: number;
              refundAmount?: number;
              reason?: string;
            }) => {
              const pi = purchase.items.find(
                (p) =>
                  p.id === item.purchaseItemId ||
                  p.productId === item.productId
              );
              if (!pi) throw new Error("Invalid return item");
              return {
                purchaseItemId: pi.id,
                productId: pi.productId,
                quantity: item.quantity,
                refundAmount: item.refundAmount || 0,
                reason: item.reason || null,
              };
            }
          ),
        },
      },
      include: { items: true, purchase: true },
    });

    if (!isDraft) {
      for (const item of items) {
        const purchaseItem = purchase.items.find(
          (pi) =>
            pi.id === item.purchaseItemId || pi.productId === item.productId
        );
        if (!purchaseItem) continue;

        const maxReturn =
          decimalToNumber(purchaseItem.quantity) -
          decimalToNumber(purchaseItem.returnedQty);
        const returnQty = Math.min(item.quantity, maxReturn);
        if (returnQty <= 0) continue;

        const stock = await tx.product.findUnique({
          where: { id: purchaseItem.productId },
          select: { stockQty: true, name: true },
        });
        if (decimalToNumber(stock?.stockQty) < returnQty) {
          throw new Error(`Insufficient stock for ${stock?.name}`);
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
            reference: returnNo,
            notes: `Purchase return ${returnNo}`,
            status: "APPROVED",
          },
        });
      }

      const updatedItems = await tx.purchaseItem.findMany({
        where: { purchaseId },
      });
      const fullyReturned = updatedItems.every(
        (item) =>
          decimalToNumber(item.returnedQty) >= decimalToNumber(item.quantity)
      );
      if (fullyReturned) {
        await tx.purchase.update({
          where: { id: purchaseId },
          data: { status: "RETURNED" },
        });
      }
    }

    return purchaseReturn;
  });

  return NextResponse.json(result);
}

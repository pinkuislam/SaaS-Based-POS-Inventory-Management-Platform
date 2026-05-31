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

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const returnItems: { saleItemId: string; quantity: number }[] =
    body.returnItems || [];
  const newItems: {
    productId: string;
    quantity: number;
    unitPrice?: number;
  }[] = body.newItems || [];
  const exchangeReason =
    typeof body.exchangeReason === "string" ? body.exchangeReason.trim() : "";

  if (returnItems.length === 0 && newItems.length === 0) {
    return NextResponse.json(
      { error: "Add items to return or exchange" },
      { status: 400 }
    );
  }

  const sale = await prisma.sale.findFirst({
    where: { id, tenantId },
    include: { items: { include: { product: true } } },
  });

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  if (sale.status === "RETURNED" || sale.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Sale cannot be exchanged" },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
    for (const ret of returnItems) {
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
          notes: `Exchange return — ${sale.invoiceNo}`,
        },
      });
    }

    for (const item of newItems) {
      if (item.quantity <= 0) continue;

      const product = await tx.product.findFirst({
        where: { id: item.productId, tenantId },
      });
      if (!product) continue;

      const stock = decimalToNumber(product.stockQty);
      if (stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const unitPrice = item.unitPrice ?? decimalToNumber(product.sellingPrice);
      const lineTotal = unitPrice * item.quantity;

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          discount: 0,
          tax: 0,
          total: lineTotal,
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: { stockQty: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: sale.branchId,
          productId: product.id,
          type: "SALE",
          quantity: -item.quantity,
          reference: sale.invoiceNo,
          notes: `Exchange sale — ${sale.invoiceNo}`,
        },
      });
    }

    const allItems = await tx.saleItem.findMany({
      where: { saleId: sale.id },
    });

    let subtotal = 0;
    for (const line of allItems) {
      const activeQty =
        decimalToNumber(line.quantity) - decimalToNumber(line.returnedQty);
      if (activeQty > 0) {
        subtotal += activeQty * decimalToNumber(line.unitPrice);
      }
    }

    const discount = decimalToNumber(sale.discount);
    const tax = decimalToNumber(sale.tax);
    const total = Math.max(0, subtotal - discount + tax);
    const paidAmount = decimalToNumber(sale.paidAmount);
    const dueAmount = Math.max(0, total - paidAmount);
    const paymentStatus =
      dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE";

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        subtotal,
        total,
        dueAmount,
        paymentStatus,
        notes: exchangeReason
          ? `${sale.notes || ""}\n[Exchange] ${exchangeReason}`.trim()
          : sale.notes,
      },
    });

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: { items: { include: { product: true } } },
    });
    });

    await logActivity({
      tenantId,
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: "EXCHANGE",
      module: "sales",
      details: `Exchange on ${sale.invoiceNo}${exchangeReason ? `: ${exchangeReason}` : ""}`,
      metadata: { saleId: sale.id },
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Exchange failed" },
      { status: 400 }
    );
  }
}

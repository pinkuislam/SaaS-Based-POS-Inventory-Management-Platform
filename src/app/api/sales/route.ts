import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sales = await prisma.sale.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { saleDate: "desc" },
    take: 100,
    include: { customer: true, user: true, items: { include: { product: true } } },
  });

  return NextResponse.json(sales);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const body = await request.json();
  const {
    items,
    customerId,
    subtotal,
    discount,
    tax,
    total,
    paidAmount,
    paymentMethod,
    notes,
    branchId,
  } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "No items in sale" }, { status: 400 });
  }

  const saleCount = await prisma.sale.count({ where: { tenantId } });
  const invoiceNo = generateInvoiceNo("INV", saleCount + 1);
  const dueAmount = Math.max(0, total - paidAmount);
  const paymentStatus =
    dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE";

  const sale = await prisma.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        tenantId,
        branchId: branchId || session.user.branchId,
        customerId: customerId || null,
        userId: session.user.id,
        invoiceNo,
        subtotal,
        discount: discount || 0,
        tax: tax || 0,
        total,
        paidAmount: paidAmount || total,
        dueAmount,
        paymentMethod: paymentMethod || "cash",
        paymentStatus,
        status: "COMPLETED",
        notes,
        items: {
          create: items.map(
            (item: {
              productId: string;
              quantity: number;
              unitPrice: number;
              discount: number;
              tax: number;
              total: number;
            }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              tax: item.tax || 0,
              total: item.total,
            })
          ),
        },
      },
      include: { items: true, customer: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: branchId || session.user.branchId,
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity,
          reference: invoiceNo,
        },
      });
    }

    return newSale;
  });

  return NextResponse.json(sale);
}

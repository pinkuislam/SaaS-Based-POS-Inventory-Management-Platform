import { NextResponse } from "next/server";
import { authenticateRestRequest } from "@/lib/rest-api-auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(request: Request) {
  const auth = await authenticateRestRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const sales = await prisma.sale.findMany({
    where: {
      tenantId: auth.tenantId,
      status: "COMPLETED",
      ...(from && to
        ? {
            saleDate: {
              gte: parseISO(from),
              lte: endOfDay(parseISO(to)),
            },
          }
        : {
            saleDate: {
              gte: startOfDay(new Date()),
              lte: endOfDay(new Date()),
            },
          }),
    },
    include: {
      items: { include: { product: { select: { name: true, sku: true } } } },
      customer: { select: { name: true } },
    },
    orderBy: { saleDate: "desc" },
    take: 50,
  });

  return NextResponse.json({ data: sales });
}

export async function POST(request: Request) {
  const auth = await authenticateRestRequest(request);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { items, customerId, total, paidAmount, paymentMethod, notes } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "items required" }, { status: 400 });
  }

  const saleTotal = total ?? items.reduce(
    (s: number, i: { total?: number; quantity: number; unitPrice: number }) =>
      s + (i.total ?? i.quantity * i.unitPrice),
    0
  );
  const paid = paidAmount ?? saleTotal;
  const dueAmount = Math.max(0, saleTotal - paid);

  const saleCount = await prisma.sale.count({
    where: { tenantId: auth.tenantId },
  });
  const invoiceNo = generateInvoiceNo("API", saleCount + 1);

  const sale = await prisma.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        tenantId: auth.tenantId,
        customerId: customerId || null,
        invoiceNo,
        subtotal: saleTotal,
        total: saleTotal,
        paidAmount: paid,
        dueAmount,
        paymentMethod: paymentMethod || "cash",
        paymentStatus: dueAmount <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "DUE",
        status: "COMPLETED",
        notes: notes ? `[API] ${notes}` : "[API]",
        items: {
          create: items.map(
            (item: {
              productId: string;
              quantity: number;
              unitPrice: number;
              total?: number;
            }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total ?? item.quantity * item.unitPrice,
            })
          ),
        },
      },
      include: { items: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          tenantId: auth.tenantId,
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity,
          reference: invoiceNo,
          notes: "REST API sale",
        },
      });
    }

    return newSale;
  });

  return NextResponse.json({ data: sale }, { status: 201 });
}

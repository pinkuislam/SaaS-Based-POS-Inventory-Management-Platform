import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const customerId = id;

  const [payments, dueSales] = await Promise.all([
    prisma.customerPayment.findMany({
      where: { customerId, tenantId: session.user.tenantId },
      orderBy: { paymentDate: "desc" },
      include: { sale: true },
    }),
    prisma.sale.findMany({
      where: {
        customerId,
        tenantId: session.user.tenantId,
        dueAmount: { gt: 0 },
        status: "COMPLETED",
      },
      orderBy: { saleDate: "desc" },
    }),
  ]);

  const totalDue = dueSales.reduce(
    (s, sale) => s + decimalToNumber(sale.dueAmount),
    0
  );

  return NextResponse.json({ payments, dueSales, totalDue });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { id: customerId } = await params;
  const body = await request.json();
  const { amount, method, saleId, notes, transactionRef } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const payment = await prisma.$transaction(async (tx) => {
    let remaining = amount;

    if (saleId) {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, customerId, tenantId },
      });
      if (!sale) throw new Error("Sale not found");

      const due = decimalToNumber(sale.dueAmount);
      const applied = Math.min(remaining, due);
      const newPaid = decimalToNumber(sale.paidAmount) + applied;
      const newDue = due - applied;

      await tx.sale.update({
        where: { id: saleId },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
          paymentStatus:
            newDue <= 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "DUE",
        },
      });
      remaining -= applied;
    } else {
      const dueSales = await tx.sale.findMany({
        where: {
          customerId,
          tenantId,
          dueAmount: { gt: 0 },
          status: "COMPLETED",
        },
        orderBy: { saleDate: "asc" },
      });

      for (const sale of dueSales) {
        if (remaining <= 0) break;
        const due = decimalToNumber(sale.dueAmount);
        const applied = Math.min(remaining, due);
        const newPaid = decimalToNumber(sale.paidAmount) + applied;
        const newDue = due - applied;

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            paidAmount: newPaid,
            dueAmount: newDue,
            paymentStatus:
              newDue <= 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "DUE",
          },
        });
        remaining -= applied;
      }
    }

    return tx.customerPayment.create({
      data: {
        tenantId,
        customerId,
        saleId: saleId || null,
        amount,
        method: method || "cash",
        transactionRef: transactionRef?.trim() || null,
        notes,
      },
      include: { sale: true },
    });
  });

  return NextResponse.json(payment);
}

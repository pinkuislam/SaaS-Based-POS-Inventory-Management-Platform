import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_expenses");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();
  const { type, reason } = body;

  if (!reason?.trim()) {
    return NextResponse.json({ error: "Reason required" }, { status: 400 });
  }

  if (type === "customer") {
    const payment = await prisma.customerPayment.findFirst({
      where: { id, tenantId, status: "completed" },
      include: { sale: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const amt = decimalToNumber(payment.amount);
      if (payment.saleId && payment.sale) {
        const sale = payment.sale;
        const newPaid = Math.max(0, decimalToNumber(sale.paidAmount) - amt);
        const newDue = decimalToNumber(sale.dueAmount) + amt;
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            paidAmount: newPaid,
            dueAmount: newDue,
            paymentStatus: newPaid > 0 ? "PARTIAL" : "DUE",
          },
        });
      }
      await tx.customerPayment.update({
        where: { id },
        data: {
          status: "reversed",
          reversedAt: new Date(),
          reversalReason: reason.trim(),
        },
      });
    });

    return NextResponse.json({ success: true });
  }

  if (type === "supplier") {
    const payment = await prisma.supplierPayment.findFirst({
      where: { id, tenantId, status: "completed" },
    });
    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.supplierPayment.update({
      where: { id },
      data: {
        status: "reversed",
        reversedAt: new Date(),
        reversalReason: reason.trim(),
      },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

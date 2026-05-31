import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { id: supplierId } = await params;
  const { amount, method, purchaseId, notes } = await request.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, tenantId },
  });
  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }

  const payment = await prisma.$transaction(async (tx) => {
    let remaining = amount;

    if (purchaseId) {
      const purchase = await tx.purchase.findFirst({
        where: { id: purchaseId, supplierId, tenantId },
      });
      if (!purchase) throw new Error("Purchase not found");

      const due = decimalToNumber(purchase.dueAmount);
      const applied = Math.min(remaining, due);
      const newPaid = decimalToNumber(purchase.paidAmount) + applied;
      const newDue = due - applied;

      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
          paymentStatus:
            newDue <= 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "DUE",
        },
      });
      remaining -= applied;
    } else {
      const duePurchases = await tx.purchase.findMany({
        where: {
          supplierId,
          tenantId,
          dueAmount: { gt: 0 },
          status: "COMPLETED",
        },
        orderBy: { purchaseDate: "asc" },
      });

      for (const purchase of duePurchases) {
        if (remaining <= 0) break;
        const due = decimalToNumber(purchase.dueAmount);
        const applied = Math.min(remaining, due);
        const newPaid = decimalToNumber(purchase.paidAmount) + applied;
        const newDue = due - applied;

        await tx.purchase.update({
          where: { id: purchase.id },
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

    return tx.supplierPayment.create({
      data: {
        tenantId,
        supplierId,
        purchaseId: purchaseId || null,
        amount,
        method: method || "cash",
        notes,
      },
    });
  });

  return NextResponse.json(payment);
}

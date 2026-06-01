import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const method = searchParams.get("method");

  const [customerPayments, supplierPayments] = await Promise.all([
    type === "supplier"
      ? []
      : prisma.customerPayment.findMany({
          where: {
            tenantId,
            ...(method ? { method } : {}),
          },
          orderBy: { paymentDate: "desc" },
          take: 100,
          include: {
            customer: { select: { name: true } },
            sale: { select: { invoiceNo: true } },
          },
        }),
    type === "customer"
      ? []
      : prisma.supplierPayment.findMany({
          where: {
            tenantId,
            ...(method ? { method } : {}),
          },
          orderBy: { paymentDate: "desc" },
          take: 100,
          include: {
            supplier: { select: { name: true } },
          },
        }),
  ]);

  const rows = [
    ...customerPayments.map((p) => ({
      id: p.id,
      type: "customer" as const,
      partyName: p.customer.name,
      amount: p.amount,
      method: p.method,
      transactionRef: p.transactionRef,
      status: p.status,
      reference: p.sale?.invoiceNo || null,
      paymentDate: p.paymentDate.toISOString(),
      notes: p.notes,
    })),
    ...supplierPayments.map((p) => ({
      id: p.id,
      type: "supplier" as const,
      partyName: p.supplier.name,
      amount: p.amount,
      method: p.method,
      transactionRef: p.transactionRef,
      status: p.status,
      reference: null,
      paymentDate: p.paymentDate.toISOString(),
      notes: p.notes,
    })),
  ].sort(
    (a, b) =>
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  return NextResponse.json(rows);
}

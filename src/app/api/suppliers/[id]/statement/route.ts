import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_suppliers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const supplier = await prisma.supplier.findFirst({
    where: { id, tenantId },
  });
  if (!supplier) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [purchases, payments] = await Promise.all([
    prisma.purchase.findMany({
      where: { tenantId, supplierId: id },
      orderBy: { purchaseDate: "desc" },
    }),
    prisma.supplierPayment.findMany({
      where: { tenantId, supplierId: id },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  const totalPurchases = purchases.reduce(
    (s, x) => s + decimalToNumber(x.total),
    0
  );
  const totalPaid = payments.reduce((s, x) => s + decimalToNumber(x.amount), 0);
  const totalDue = purchases.reduce((s, x) => s + decimalToNumber(x.dueAmount), 0);

  return NextResponse.json({
    supplier,
    openingBalance: decimalToNumber(supplier.openingBalance),
    purchases: purchases.map((p) => ({
      invoice: p.invoiceNo,
      date: p.purchaseDate,
      total: decimalToNumber(p.total),
      due: decimalToNumber(p.dueAmount),
    })),
    payments: payments.map((p) => ({
      date: p.paymentDate,
      amount: decimalToNumber(p.amount),
      method: p.method,
    })),
    summary: { totalPurchases, totalPaid, totalDue },
  });
}

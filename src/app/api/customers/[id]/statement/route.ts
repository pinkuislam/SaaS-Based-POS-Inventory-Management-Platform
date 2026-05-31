import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, tenantId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [sales, payments] = await Promise.all([
    prisma.sale.findMany({
      where: { tenantId, customerId: id },
      orderBy: { saleDate: "desc" },
    }),
    prisma.customerPayment.findMany({
      where: { tenantId, customerId: id },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  const totalSales = sales.reduce((s, x) => s + decimalToNumber(x.total), 0);
  const totalPaid = payments.reduce((s, x) => s + decimalToNumber(x.amount), 0);
  const totalDue = sales.reduce((s, x) => s + decimalToNumber(x.dueAmount), 0);

  return NextResponse.json({
    customer,
    openingBalance: decimalToNumber(customer.openingBalance),
    sales: sales.map((s) => ({
      invoice: s.invoiceNo,
      date: s.saleDate,
      total: decimalToNumber(s.total),
      due: decimalToNumber(s.dueAmount),
    })),
    payments: payments.map((p) => ({
      date: p.paymentDate,
      amount: decimalToNumber(p.amount),
      method: p.method,
    })),
    summary: { totalSales, totalPaid, totalDue },
  });
}

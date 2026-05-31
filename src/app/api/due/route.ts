import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  const dueSales = await prisma.sale.findMany({
    where: {
      tenantId,
      dueAmount: { gt: 0 },
      status: "COMPLETED",
    },
    include: { customer: true },
    orderBy: { saleDate: "desc" },
  });

  const duePurchases = await prisma.purchase.findMany({
    where: {
      tenantId,
      dueAmount: { gt: 0 },
      status: "COMPLETED",
    },
    include: { supplier: true },
    orderBy: { purchaseDate: "desc" },
  });

  const customerDueMap = new Map<
    string,
    { customerId: string; name: string; phone: string | null; totalDue: number }
  >();

  for (const sale of dueSales) {
    const key = sale.customerId || "walkin";
    const name = sale.customer?.name || "Walk-in (no customer)";
    const existing = customerDueMap.get(key) || {
      customerId: sale.customerId || "",
      name,
      phone: sale.customer?.phone || null,
      totalDue: 0,
    };
    existing.totalDue += decimalToNumber(sale.dueAmount);
    customerDueMap.set(key, existing);
  }

  return NextResponse.json({
    customerDues: Array.from(customerDueMap.values()).filter(
      (c) => c.customerId
    ),
    dueSales,
    duePurchases,
    totalCustomerDue: dueSales.reduce(
      (s, sale) => s + decimalToNumber(sale.dueAmount),
      0
    ),
    totalSupplierDue: duePurchases.reduce(
      (s, p) => s + decimalToNumber(p.dueAmount),
      0
    ),
  });
}

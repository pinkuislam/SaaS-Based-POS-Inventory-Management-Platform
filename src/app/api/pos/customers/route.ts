import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET() {
  const authResult = await requirePermission("manage_pos");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;

  const customers = await prisma.customer.findMany({
    where: { tenantId, status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const dueAgg = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      tenantId,
      status: "COMPLETED",
      customerId: { not: null },
      dueAmount: { gt: 0 },
    },
    _sum: { dueAmount: true },
  });

  const dueByCustomer = new Map(
    dueAgg
      .filter((d) => d.customerId)
      .map((d) => [d.customerId!, decimalToNumber(d._sum.dueAmount)])
  );

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      totalDue: dueByCustomer.get(c.id) ?? 0,
    }))
  );
}

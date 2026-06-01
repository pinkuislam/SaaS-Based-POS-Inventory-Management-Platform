import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await prisma.subscription.findFirst({
    where: { tenantId: session.user.tenantId, status: "ACTIVE" },
    orderBy: { endDate: "desc" },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 50 },
      package: { select: { name: true, billingCycle: true } },
    },
  });

  if (!sub) {
    return NextResponse.json({ payments: [], subscription: null });
  }

  return NextResponse.json({
    subscription: {
      id: sub.id,
      startDate: sub.startDate,
      endDate: sub.endDate,
      status: sub.status,
      amount: decimalToNumber(sub.amount),
      packageName: sub.package.name,
      billingCycle: sub.package.billingCycle,
    },
    payments: sub.payments.map((p) => ({
      id: p.id,
      amount: decimalToNumber(p.amount),
      method: p.method,
      status: p.status,
      transactionId: p.transactionId,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
  });
}

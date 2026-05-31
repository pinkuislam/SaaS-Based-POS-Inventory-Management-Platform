import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { logPlatformActivity } from "@/lib/admin/log-activity";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const payments = await prisma.subscriptionPayment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      subscription: {
        include: { tenant: true, package: true },
      },
    },
  });

  return NextResponse.json(payments);
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { subscriptionId, amount, method, transactionId, status = "PAID" } = body;

  if (!subscriptionId || amount === undefined) {
    return NextResponse.json(
      { error: "subscriptionId and amount required" },
      { status: 400 }
    );
  }

  const payment = await prisma.subscriptionPayment.create({
    data: {
      subscriptionId,
      amount,
      method: method || "manual",
      transactionId: transactionId || null,
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
    include: {
      subscription: { include: { tenant: true, package: true } },
    },
  });

  if (status === "PAID") {
    const sub = payment.subscription;
    await prisma.tenant.update({
      where: { id: sub.tenantId },
      data: { status: "ACTIVE" },
    });
  }

  await logPlatformActivity({
    adminId: auth.session.user.id,
    adminName: auth.session.user.name || undefined,
    action: "CREATE",
    module: "payments",
    details: `Recorded payment ${payment.id}`,
  });

  return NextResponse.json(payment, { status: 201 });
}

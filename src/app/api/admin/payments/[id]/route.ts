import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { logPlatformActivity } from "@/lib/admin/log-activity";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.method !== undefined) data.method = body.method || null;
  if (body.transactionId !== undefined) {
    data.transactionId = body.transactionId || null;
  }
  if (body.status) {
    data.status = body.status;
    if (body.status === "PAID") {
      data.paidAt = new Date();
    } else if (body.status !== "PAID") {
      data.paidAt = null;
    }
  }

  const payment = await prisma.subscriptionPayment.update({
    where: { id },
    data,
    include: {
      subscription: { include: { tenant: true, package: true } },
    },
  });

  if (body.status === "PAID") {
    await prisma.tenant.update({
      where: { id: payment.subscription.tenantId },
      data: { status: "ACTIVE" },
    });
  }

  await logPlatformActivity({
    adminId: auth.session.user.id,
    adminName: auth.session.user.name || undefined,
    action: "UPDATE",
    module: "payments",
    details: `Updated payment ${id}`,
  });

  return NextResponse.json(payment);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.subscriptionPayment.delete({ where: { id } });

  await logPlatformActivity({
    adminId: auth.session.user.id,
    adminName: auth.session.user.name || undefined,
    action: "DELETE",
    module: "payments",
    details: `Deleted payment ${id}`,
  });

  return NextResponse.json({ success: true });
}

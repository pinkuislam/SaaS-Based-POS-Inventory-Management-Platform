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
  if (body.packageId) data.packageId = body.packageId;
  if (body.endDate) data.endDate = new Date(body.endDate);
  if (body.startDate) data.startDate = new Date(body.startDate);
  if (body.status) data.status = body.status;
  if (body.amount !== undefined) data.amount = body.amount;

  const sub = await prisma.subscription.update({
    where: { id },
    data,
    include: { tenant: true, package: true },
  });

  if (body.packageId) {
    await prisma.tenant.update({
      where: { id: sub.tenantId },
      data: { packageId: body.packageId },
    });
  }

  await logPlatformActivity({
    adminId: auth.session.user.id,
    adminName: auth.session.user.name || undefined,
    action: "UPDATE",
    module: "subscriptions",
    details: `Updated subscription ${id}`,
  });

  return NextResponse.json(sub);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const payments = await prisma.subscriptionPayment.count({
    where: { subscriptionId: id, status: "PAID" },
  });
  if (payments > 0) {
    return NextResponse.json(
      { error: "Cannot delete subscription with paid payments" },
      { status: 400 }
    );
  }

  await prisma.subscription.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

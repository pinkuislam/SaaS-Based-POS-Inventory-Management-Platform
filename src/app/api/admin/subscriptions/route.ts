import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { logPlatformActivity } from "@/lib/admin/log-activity";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { tenant: true, package: true, payments: true },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { tenantId, packageId, startDate, endDate, status, amount } = body;

  if (!tenantId || !packageId || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pkg = await prisma.subscriptionPackage.findUnique({
    where: { id: packageId },
  });
  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const sub = await prisma.subscription.create({
    data: {
      tenantId,
      packageId,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      status: status || "ACTIVE",
      amount: amount ?? pkg.price,
    },
    include: { tenant: true, package: true },
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { packageId },
  });

  await logPlatformActivity({
    adminId: auth.session.user.id,
    adminName: auth.session.user.name || undefined,
    action: "CREATE",
    module: "subscriptions",
    details: `Assigned subscription to ${sub.tenant.name}`,
  });

  return NextResponse.json(sub, { status: 201 });
}

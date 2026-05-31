import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const pkg = await prisma.subscriptionPackage.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.billingCycle !== undefined && { billingCycle: body.billingCycle }),
      ...(body.trialDays !== undefined && { trialDays: body.trialDays }),
      ...(body.graceDays !== undefined && { graceDays: body.graceDays }),
      ...(body.maxUsers !== undefined && { maxUsers: body.maxUsers }),
      ...(body.maxBranches !== undefined && { maxBranches: body.maxBranches }),
      ...(body.maxProducts !== undefined && { maxProducts: body.maxProducts }),
      ...(body.maxInvoices !== undefined && { maxInvoices: body.maxInvoices }),
      ...(body.features !== undefined && { features: body.features }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.yearlyPrice !== undefined && {
        yearlyPrice: body.yearlyPrice === "" || body.yearlyPrice == null ? null : body.yearlyPrice,
      }),
      ...(body.isPopular !== undefined && { isPopular: body.isPopular }),
    },
  });

  return NextResponse.json(pkg);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [tenantCount, subscriptionCount] = await Promise.all([
    prisma.tenant.count({ where: { packageId: id } }),
    prisma.subscription.count({ where: { packageId: id } }),
  ]);

  if (tenantCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete: tenants are assigned to this package" },
      { status: 400 }
    );
  }

  if (subscriptionCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete: subscriptions reference this package" },
      { status: 400 }
    );
  }

  try {
    await prisma.subscriptionPackage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const { prismaDeleteErrorMessage } = await import("@/lib/admin/delete-tenant");
    return NextResponse.json(
      { error: prismaDeleteErrorMessage(e) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addMonths, addYears } from "date-fns";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { packageId, extendMonths } = await request.json();

  const pkg = await prisma.subscriptionPackage.findUnique({
    where: { id: packageId },
  });
  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const endDate =
    pkg.billingCycle === "yearly"
      ? addYears(new Date(), extendMonths || 1)
      : addMonths(new Date(), extendMonths || 1);

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id },
      data: { packageId, status: "ACTIVE" },
    });

    const existing = await tx.subscription.findFirst({
      where: { tenantId: id, status: { in: ["ACTIVE", "TRIAL", "EXPIRED"] } },
      orderBy: { endDate: "desc" },
    });

    if (existing) {
      await tx.subscription.update({
        where: { id: existing.id },
        data: {
          packageId,
          status: "ACTIVE",
          endDate,
          amount: pkg.price,
        },
      });
    } else {
      await tx.subscription.create({
        data: {
          tenantId: id,
          packageId,
          status: "ACTIVE",
          endDate,
          amount: pkg.price,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}

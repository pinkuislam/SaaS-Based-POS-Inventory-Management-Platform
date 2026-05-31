import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getTenantSettings } from "@/lib/tenant-settings";
import { discountFromPoints } from "@/lib/loyalty";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const { points, action } = await request.json();

  const customer = await prisma.customer.findFirst({
    where: { id, tenantId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settings = await getTenantSettings(tenantId);

  if (action === "redeem") {
    const pts = parseInt(String(points), 10);
    if (pts <= 0 || pts > customer.loyaltyPoints) {
      return NextResponse.json({ error: "Invalid points" }, { status: 400 });
    }
    const discountValue = discountFromPoints(pts, settings);
    const updated = await prisma.customer.update({
      where: { id },
      data: { loyaltyPoints: { decrement: pts } },
    });
    await logActivity({
      tenantId,
      userId: authResult.session.user.id,
      userName: authResult.session.user.name,
      action: "loyalty_redeem",
      module: "customers",
      details: `Redeemed ${pts} points (${discountValue}) for ${customer.name}`,
    });
    return NextResponse.json({
      customer: updated,
      discountValue,
      pointsRedeemed: pts,
    });
  }

  if (action === "adjust") {
    const newPoints = parseInt(String(points), 10);
    if (newPoints < 0) {
      return NextResponse.json({ error: "Invalid points" }, { status: 400 });
    }
    const updated = await prisma.customer.update({
      where: { id },
      data: { loyaltyPoints: newPoints },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

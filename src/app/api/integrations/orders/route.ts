import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const orders = await prisma.onlineOrder.findMany({
    where: { tenantId: authResult.session.user.tenantId! },
    orderBy: { orderDate: "desc" },
    take: 100,
  });

  return NextResponse.json(orders);
}

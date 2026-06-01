import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { parsePlatform } from "@/lib/ecommerce-platform";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const platformParam = searchParams.get("platform");
  const tenantId = authResult.session.user.tenantId!;

  const orders = await prisma.onlineOrder.findMany({
    where: {
      tenantId,
      ...(platformParam
        ? { platform: parsePlatform(platformParam) }
        : {}),
    },
    orderBy: { orderDate: "desc" },
    take: 100,
  });

  return NextResponse.json(orders);
}

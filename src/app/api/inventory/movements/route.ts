import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_inventory");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

  const movements = await prisma.stockMovement.findMany({
    where: {
      tenantId,
      ...(productId ? { productId } : {}),
      ...(status ? { status: status as "PENDING" | "APPROVED" | "REVERSED" } : {}),
      ...(type ? { type: type as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      user: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });

  return NextResponse.json(movements);
}

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") || "woocommerce";

  const products = await prisma.product.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      OR: [{ sku: { not: null } }, { barcode: { not: null } }],
    },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      stockQty: true,
      sellingPrice: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const setting = await prisma.ecommerceSetting.findFirst({
    where: { tenantId, platform, isActive: true },
    select: { lastProductSync: true, platform: true },
  });

  return NextResponse.json({
    platform: setting?.platform || platform,
    lastProductSync: setting?.lastProductSync,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      stock: decimalToNumber(p.stockQty),
      price: decimalToNumber(p.sellingPrice),
      updatedAt: p.updatedAt,
    })),
  });
}

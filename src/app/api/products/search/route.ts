import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { activeProductWhere } from "@/lib/products";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const categoryId = searchParams.get("categoryId")?.trim() || "";

  if (!q && !categoryId) {
    return NextResponse.json([]);
  }

  const products = await prisma.product.findMany({
    where: {
      ...activeProductWhere(session.user.tenantId),
      ...(categoryId ? { categoryId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { sku: { contains: q } },
              { barcode: q },
              { category: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    take: 24,
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      image: true,
      sellingPrice: true,
      stockQty: true,
      reorderLevel: true,
      taxRate: true,
      category: { select: { id: true, name: true } },
      unit: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

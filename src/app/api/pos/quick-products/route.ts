import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { activeProductWhere } from "@/lib/products";

/** Fast-selling / recently sold products for POS quick buttons */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  const recentIds = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: {
        tenantId,
        status: "COMPLETED",
        saleDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 12,
  });

  const productIds = recentIds.map((r) => r.productId);

  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: {
            id: { in: productIds },
            ...activeProductWhere(tenantId),
          },
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
          },
        })
      : await prisma.product.findMany({
          where: activeProductWhere(tenantId),
          orderBy: { name: "asc" },
          take: 12,
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
          },
        });

  const orderMap = new Map(productIds.map((id, i) => [id, i]));
  products.sort(
    (a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99)
  );

  return NextResponse.json(products);
}

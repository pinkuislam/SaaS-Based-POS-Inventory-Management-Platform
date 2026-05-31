import { NextResponse } from "next/server";
import { authenticateRestRequest } from "@/lib/rest-api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await authenticateRestRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  const products = await prisma.product.findMany({
    where: {
      tenantId: auth.tenantId,
      status: "ACTIVE",
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
              { barcode: { contains: search } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      sellingPrice: true,
      stockQty: true,
      image: true,
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: products });
}

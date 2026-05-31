import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json([]);
  }

  const products = await prisma.product.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: "ACTIVE",
      OR: [
        { name: { contains: q } },
        { sku: { contains: q } },
        { barcode: q },
      ],
    },
    take: 20,
    include: { category: true, unit: true },
  });

  return NextResponse.json(products);
}

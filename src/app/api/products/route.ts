import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const tenantId = session.user.tenantId;

  const { activeProductWhere } = await import("@/lib/products");
  const products = await prisma.product.findMany({
    where: {
      ...activeProductWhere(tenantId),
      OR: search
        ? [
            { name: { contains: search } },
            { sku: { contains: search } },
            { barcode: { contains: search } },
          ]
        : undefined,
    },
    include: { category: true, brand: true, unit: true },
    orderBy: { name: "asc" },
    take: 50,
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const body = await request.json();

  try {
    const { assertProductLimit } = await import("@/lib/package-limits");
    await assertProductLimit(tenantId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Limit reached" },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: {
      tenantId,
      branchId: body.branchId || session.user.branchId,
      categoryId: body.categoryId || null,
      brandId: body.brandId || null,
      unitId: body.unitId || null,
      name: body.name,
      sku: body.sku,
      barcode: body.barcode,
      purchasePrice: body.purchasePrice || 0,
      sellingPrice: body.sellingPrice || 0,
      wholesalePrice: body.wholesalePrice,
      taxRate: body.taxRate || 0,
      stockQty: body.stockQty || 0,
      reorderLevel: body.reorderLevel || 0,
      description: body.description,
      batchNo: body.batchNo || null,
      serialNo: body.serialNo?.trim() || null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    },
  });

  if (body.stockQty > 0) {
    await prisma.stockMovement.create({
      data: {
        tenantId,
        productId: product.id,
        type: "ADJUSTMENT",
        quantity: body.stockQty,
        reference: "Opening stock",
        notes: "Initial stock entry",
      },
    });
  }

  return NextResponse.json(product);
}

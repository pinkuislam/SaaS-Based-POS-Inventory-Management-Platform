import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.product.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      sku: body.sku ?? existing.sku,
      barcode: body.barcode ?? existing.barcode,
      categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
      brandId: body.brandId !== undefined ? body.brandId : existing.brandId,
      unitId: body.unitId !== undefined ? body.unitId : existing.unitId,
      purchasePrice: body.purchasePrice ?? existing.purchasePrice,
      sellingPrice: body.sellingPrice ?? existing.sellingPrice,
      wholesalePrice: body.wholesalePrice ?? existing.wholesalePrice,
      taxRate: body.taxRate ?? existing.taxRate,
      reorderLevel: body.reorderLevel ?? existing.reorderLevel,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : existing.expiryDate,
      batchNo: body.batchNo ?? existing.batchNo,
      description: body.description ?? existing.description,
      status: body.status ?? existing.status,
    },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name,
    action: "update",
    module: "products",
    details: `Updated product ${product.name}`,
  });

  return NextResponse.json(product);
}

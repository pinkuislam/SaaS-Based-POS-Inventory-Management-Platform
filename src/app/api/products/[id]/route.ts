import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { productHasHistory } from "@/lib/products";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, tenantId },
    include: {
      category: true,
      brand: true,
      unit: true,
      branch: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hasHistory = await productHasHistory(id);

  return NextResponse.json({ ...product, hasHistory });
}

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

  if (existing.deletedAt) {
    return NextResponse.json(
      { error: "Cannot edit a deleted product. Restore it first." },
      { status: 400 }
    );
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      sku: body.sku ?? existing.sku,
      barcode: body.barcode ?? existing.barcode,
      serialNo:
        body.serialNo !== undefined ? body.serialNo || null : existing.serialNo,
      categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
      brandId: body.brandId !== undefined ? body.brandId : existing.brandId,
      unitId: body.unitId !== undefined ? body.unitId : existing.unitId,
      branchId: body.branchId !== undefined ? body.branchId : existing.branchId,
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, tenantId },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hasHistory = await productHasHistory(id);

  if (hasHistory) {
    await prisma.product.update({
      where: { id },
      data: { status: "INACTIVE" },
    });
    await logActivity({
      tenantId,
      userId: authResult.session.user.id,
      userName: authResult.session.user.name || undefined,
      action: "archive",
      module: "products",
      details: `Archived product ${product.name}`,
    });
    return NextResponse.json({
      success: true,
      archived: true,
      message: "Product has sales/purchase history and was archived (deactivated).",
    });
  }

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), status: "INACTIVE" },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "delete",
    module: "products",
    details: `Soft-deleted product ${product.name}`,
  });

  return NextResponse.json({ success: true, deleted: true });
}

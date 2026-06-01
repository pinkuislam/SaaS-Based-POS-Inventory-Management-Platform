import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type CatalogType = "category" | "brand" | "unit";

function getType(searchParams: URLSearchParams): CatalogType {
  const t = searchParams.get("type");
  if (t === "brand" || t === "unit") return t;
  return "category";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = getType(searchParams);
  const body = await request.json();

  if (type === "brand") {
    const brand = await prisma.brand.findFirst({ where: { id, tenantId } });
    if (!brand) return NextResponse.json({ error: "Not found" }, { status: 404 });
    try {
      const updated = await prisma.brand.update({
        where: { id },
        data: {
          ...(body.name?.trim() && { name: body.name.trim() }),
          ...(body.description !== undefined && {
            description: body.description?.trim() || null,
          }),
          ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
        },
      });
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({ error: "Name already exists" }, { status: 400 });
    }
  }

  if (type === "unit") {
    const unit = await prisma.unit.findFirst({ where: { id, tenantId } });
    if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });
    try {
      const updated = await prisma.unit.update({
        where: { id },
        data: {
          ...(body.name?.trim() && { name: body.name.trim() }),
          ...(body.shortName !== undefined && {
            shortName: body.shortName?.trim() || null,
          }),
          ...(body.unitType !== undefined && {
            unitType: body.unitType?.trim() || null,
          }),
          ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
        },
      });
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({ error: "Name already exists" }, { status: 400 });
    }
  }

  const category = await prisma.productCategory.findFirst({
    where: { id, tenantId },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const updated = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(body.name?.trim() && { name: body.name.trim() }),
        ...(body.code !== undefined && { code: body.code?.trim() || null }),
        ...(body.parentId !== undefined && {
          parentId: body.parentId || null,
        }),
        ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Name already exists" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = getType(searchParams);

  if (type === "brand") {
    const brand = await prisma.brand.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const moveToBrandId = searchParams.get("moveToBrandId");
    if (brand._count.products > 0) {
      if (!moveToBrandId) {
        return NextResponse.json(
          {
            error:
              "Cannot delete: products use this brand. Provide moveToBrandId to reassign.",
          },
          { status: 400 }
        );
      }
      const target = await prisma.brand.findFirst({
        where: { id: moveToBrandId, tenantId },
      });
      if (!target) {
        return NextResponse.json({ error: "Target brand not found" }, { status: 400 });
      }
      await prisma.product.updateMany({
        where: { tenantId, brandId: id },
        data: { brandId: moveToBrandId },
      });
    }
    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  if (type === "unit") {
    const unit = await prisma.unit.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { products: true } } },
    });
    if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (unit._count.products > 0) {
      return NextResponse.json(
        { error: "Cannot delete: products use this unit" },
        { status: 400 }
      );
    }
    await prisma.unit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  const category = await prisma.productCategory.findFirst({
    where: { id, tenantId },
    include: {
      _count: { select: { products: true, children: true } },
    },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const moveToCategoryId = searchParams.get("moveToCategoryId");

  if (category._count.products > 0) {
    if (!moveToCategoryId) {
      return NextResponse.json(
        {
          error:
            "Cannot delete: products are in this category. Provide moveToCategoryId to reassign them.",
        },
        { status: 400 }
      );
    }
    const target = await prisma.productCategory.findFirst({
      where: { id: moveToCategoryId, tenantId },
    });
    if (!target) {
      return NextResponse.json(
        { error: "Target category not found" },
        { status: 400 }
      );
    }
    await prisma.product.updateMany({
      where: { tenantId, categoryId: id },
      data: { categoryId: moveToCategoryId },
    });
  }
  if (category._count.children > 0) {
    return NextResponse.json(
      { error: "Cannot delete: category has sub-categories" },
      { status: 400 }
    );
  }
  await prisma.productCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

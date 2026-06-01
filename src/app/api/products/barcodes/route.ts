import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateBarcodeValue } from "@/lib/barcode-label";

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();
  const productIds = Array.isArray(body.productIds)
    ? (body.productIds as string[])
    : [];
  const generateMissing = body.generateMissing !== false;

  if (productIds.length === 0) {
    return NextResponse.json(
      { error: "No products selected" },
      { status: 400 }
    );
  }

  const products = await prisma.product.findMany({
    where: { tenantId, id: { in: productIds }, status: "ACTIVE" },
    select: { id: true, sku: true, barcode: true },
  });

  const updated: { id: string; barcode: string }[] = [];

  for (const product of products) {
    if (product.barcode?.trim()) {
      updated.push({ id: product.id, barcode: product.barcode });
      continue;
    }
    if (!generateMissing) continue;

    const barcode = generateBarcodeValue(product);
    const conflict = await prisma.product.findFirst({
      where: { tenantId, barcode, NOT: { id: product.id } },
    });
    const finalCode = conflict
      ? `${barcode}-${product.id.slice(-4)}`
      : barcode;

    await prisma.product.update({
      where: { id: product.id },
      data: { barcode: finalCode },
    });
    updated.push({ id: product.id, barcode: finalCode });
  }

  return NextResponse.json({ updated, count: updated.length });
}

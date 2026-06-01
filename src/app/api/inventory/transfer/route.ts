import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { productId, fromBranchId, toBranchId, quantity, notes } =
    await request.json();

  if (!productId || !toBranchId || !quantity || quantity <= 0) {
    return NextResponse.json(
      { error: "Product, destination branch, and quantity required" },
      { status: 400 }
    );
  }

  if (fromBranchId === toBranchId) {
    return NextResponse.json(
      { error: "Source and destination must differ" },
      { status: 400 }
    );
  }

  const sourceProduct = await prisma.product.findFirst({
    where: { id: productId, tenantId },
  });
  if (!sourceProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const available = decimalToNumber(sourceProduct.stockQty);
  if (available < quantity) {
    return NextResponse.json(
      { error: `Insufficient stock (available: ${available})` },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { stockQty: { decrement: quantity } },
    });

    let targetProduct = await tx.product.findFirst({
      where: {
        tenantId,
        branchId: toBranchId,
        sku: sourceProduct.sku || undefined,
        name: sourceProduct.name,
      },
    });

    if (!targetProduct && sourceProduct.sku) {
      targetProduct = await tx.product.findFirst({
        where: { tenantId, branchId: toBranchId, sku: sourceProduct.sku },
      });
    }

    if (targetProduct) {
      await tx.product.update({
        where: { id: targetProduct.id },
        data: { stockQty: { increment: quantity } },
      });
    } else {
      targetProduct = await tx.product.create({
        data: {
          tenantId,
          branchId: toBranchId,
          categoryId: sourceProduct.categoryId,
          brandId: sourceProduct.brandId,
          unitId: sourceProduct.unitId,
          name: sourceProduct.name,
          sku: sourceProduct.sku,
          barcode: sourceProduct.barcode,
          purchasePrice: sourceProduct.purchasePrice,
          sellingPrice: sourceProduct.sellingPrice,
          wholesalePrice: sourceProduct.wholesalePrice,
          taxRate: sourceProduct.taxRate,
          stockQty: quantity,
          reorderLevel: sourceProduct.reorderLevel,
          status: "ACTIVE",
        },
      });
    }

    const ref = `TRF-${Date.now().toString(36).toUpperCase()}`;

    await tx.stockMovement.create({
      data: {
        tenantId,
        branchId: fromBranchId || sourceProduct.branchId,
        productId,
        type: "TRANSFER_OUT",
        quantity: -quantity,
        reference: ref,
        notes: notes || `Transfer to branch`,
      },
    });

    await tx.stockMovement.create({
      data: {
        tenantId,
        branchId: toBranchId,
        productId: targetProduct.id,
        type: "TRANSFER_IN",
        quantity,
        reference: ref,
        notes: notes || `Transfer from branch`,
      },
    });

    return { reference: ref, targetProductId: targetProduct.id };
  });

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: "stock_transfer",
    module: "inventory",
    details: `Transfer ${quantity} units — ref ${result.reference}`,
  });

  return NextResponse.json(result);
}

import type { Prisma } from "@prisma/client";
import { decimalToNumber } from "@/lib/utils";

type Tx = Prisma.TransactionClient;

export async function executeStockTransfer(
  tx: Tx,
  opts: {
    tenantId: string;
    productId: string;
    fromBranchId: string | null;
    toBranchId: string;
    quantity: number;
    reference: string;
    notes?: string;
    userId?: string;
  }
) {
  const { tenantId, productId, toBranchId, quantity, reference, notes, userId } =
    opts;
  const fromBranchId = opts.fromBranchId;

  const sourceProduct = await tx.product.findFirst({
    where: { id: productId, tenantId },
  });
  if (!sourceProduct) throw new Error("Product not found");

  const available = decimalToNumber(sourceProduct.stockQty);
  if (available < quantity) {
    throw new Error(`Insufficient stock (available: ${available})`);
  }

  await tx.product.update({
    where: { id: productId },
    data: { stockQty: { decrement: quantity } },
  });

  let targetProduct = await tx.product.findFirst({
    where: {
      tenantId,
      branchId: toBranchId,
      ...(sourceProduct.sku
        ? { sku: sourceProduct.sku }
        : { name: sourceProduct.name }),
    },
  });

  if (!targetProduct) {
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
  } else {
    await tx.product.update({
      where: { id: targetProduct.id },
      data: { stockQty: { increment: quantity } },
    });
  }

  await tx.stockMovement.create({
    data: {
      tenantId,
      branchId: fromBranchId || sourceProduct.branchId,
      productId,
      userId,
      type: "TRANSFER_OUT",
      quantity: -quantity,
      reference,
      notes: notes || "Transfer out",
      status: "APPROVED",
    },
  });

  await tx.stockMovement.create({
    data: {
      tenantId,
      branchId: toBranchId,
      productId: targetProduct.id,
      userId,
      type: "TRANSFER_IN",
      quantity,
      reference,
      notes: notes || "Transfer in",
      status: "APPROVED",
    },
  });

  return targetProduct.id;
}

export const ADJUSTMENT_TYPES = [
  { value: "adjustment", label: "General adjustment", movement: "ADJUSTMENT" },
  { value: "opening", label: "Opening stock", movement: "OPENING" },
  { value: "damage", label: "Damaged stock", movement: "DAMAGE" },
  { value: "expired", label: "Expired stock", movement: "EXPIRED" },
  { value: "return", label: "Returned stock", movement: "RETURN" },
] as const;

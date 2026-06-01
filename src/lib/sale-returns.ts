import type { Prisma } from "@prisma/client";
import { decimalToNumber } from "@/lib/utils";

type Tx = Prisma.TransactionClient;

export async function applySaleReturnStock(
  tx: Tx,
  sale: {
    id: string;
    invoiceNo: string;
    branchId: string | null;
    items: {
      id: string;
      productId: string;
      quantity: unknown;
      returnedQty: unknown;
    }[];
  },
  saleReturn: {
    returnNo: string;
    items: {
      saleItemId: string | null;
      productId: string;
      quantity: unknown;
    }[];
  },
  tenantId: string
) {
  for (const item of saleReturn.items) {
    const saleItem = sale.items.find(
      (si) => si.id === item.saleItemId || si.productId === item.productId
    );
    if (!saleItem) continue;

    const returnQty = Math.min(
      decimalToNumber(item.quantity),
      decimalToNumber(saleItem.quantity) -
        decimalToNumber(saleItem.returnedQty)
    );
    if (returnQty <= 0) continue;

    await tx.saleItem.update({
      where: { id: saleItem.id },
      data: { returnedQty: { increment: returnQty } },
    });

    await tx.product.update({
      where: { id: saleItem.productId },
      data: { stockQty: { increment: returnQty } },
    });

    await tx.stockMovement.create({
      data: {
        tenantId,
        branchId: sale.branchId,
        productId: saleItem.productId,
        type: "RETURN",
        quantity: returnQty,
        reference: saleReturn.returnNo,
        notes: `Sale return ${saleReturn.returnNo}`,
        status: "APPROVED",
      },
    });
  }

  const updatedItems = await tx.saleItem.findMany({
    where: { saleId: sale.id },
  });
  const fullyReturned = updatedItems.every(
    (i) => decimalToNumber(i.returnedQty) >= decimalToNumber(i.quantity)
  );
  if (fullyReturned) {
    await tx.sale.update({
      where: { id: sale.id },
      data: { status: "RETURNED" },
    });
  }
}

export async function reverseSaleReturnStock(
  tx: Tx,
  sale: { id: string; branchId: string | null; items: { id: string; productId: string; quantity: unknown; returnedQty: unknown }[] },
  saleReturn: {
    returnNo: string;
    items: { saleItemId: string | null; productId: string; quantity: unknown }[];
  },
  tenantId: string
) {
  for (const item of saleReturn.items) {
    const qty = decimalToNumber(item.quantity);
    if (qty <= 0) continue;
    const saleItem = sale.items.find(
      (si) => si.id === item.saleItemId || si.productId === item.productId
    );
    if (!saleItem) continue;

    await tx.product.update({
      where: { id: saleItem.productId },
      data: { stockQty: { decrement: qty } },
    });
    await tx.saleItem.update({
      where: { id: saleItem.id },
      data: { returnedQty: { decrement: qty } },
    });
    await tx.stockMovement.create({
      data: {
        tenantId,
        branchId: sale.branchId,
        productId: saleItem.productId,
        type: "ADJUSTMENT",
        quantity: -qty,
        reference: saleReturn.returnNo,
        notes: "Return cancelled — stock reversed",
        status: "APPROVED",
      },
    });
  }
  if (sale.id) {
    await tx.sale.update({
      where: { id: sale.id },
      data: { status: "COMPLETED" },
    });
  }
}

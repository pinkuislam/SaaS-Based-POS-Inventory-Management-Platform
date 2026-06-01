import { prisma } from "@/lib/prisma";

export async function productHasHistory(productId: string) {
  const counts = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      _count: {
        select: {
          saleItems: true,
          purchaseItems: true,
          stockMovements: true,
        },
      },
    },
  });
  if (!counts) return false;
  const c = counts._count;
  return c.saleItems > 0 || c.purchaseItems > 0;
}

export function activeProductWhere(
  tenantId: string,
  opts?: { includeDeleted?: boolean; includeInactive?: boolean }
) {
  return {
    tenantId,
    ...(opts?.includeDeleted ? {} : { deletedAt: null }),
    ...(opts?.includeInactive ? {} : { status: "ACTIVE" as const }),
  };
}

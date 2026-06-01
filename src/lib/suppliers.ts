import { prisma } from "@/lib/prisma";

export async function supplierHasHistory(supplierId: string) {
  const counts = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: {
      _count: { select: { purchases: true, payments: true } },
    },
  });
  if (!counts) return false;
  return counts._count.purchases > 0 || counts._count.payments > 0;
}

export function activeSupplierWhere(
  tenantId: string,
  opts?: { includeDeleted?: boolean }
) {
  return {
    tenantId,
    ...(opts?.includeDeleted ? {} : { deletedAt: null }),
  };
}

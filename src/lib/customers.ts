import { prisma } from "@/lib/prisma";

export async function customerHasHistory(customerId: string) {
  const counts = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      _count: { select: { sales: true, payments: true } },
    },
  });
  if (!counts) return false;
  return counts._count.sales > 0 || counts._count.payments > 0;
}

export function activeCustomerWhere(
  tenantId: string,
  opts?: { includeDeleted?: boolean }
) {
  return {
    tenantId,
    ...(opts?.includeDeleted ? {} : { deletedAt: null }),
  };
}

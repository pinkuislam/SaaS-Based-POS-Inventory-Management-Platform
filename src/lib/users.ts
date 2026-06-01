import { prisma } from "@/lib/prisma";

export async function userHasTransactionHistory(userId: string) {
  const counts = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      _count: { select: { sales: true, purchases: true } },
    },
  });
  if (!counts) return false;
  return counts._count.sales > 0 || counts._count.purchases > 0;
}

export function activeUserWhere(
  tenantId: string,
  opts?: { includeDeleted?: boolean; includeInactive?: boolean }
) {
  return {
    tenantId,
    ...(opts?.includeDeleted ? {} : { deletedAt: null }),
    ...(opts?.includeInactive ? {} : {}),
  };
}

import { prisma } from "@/lib/prisma";

export type BranchSettings = {
  invoicePrefix?: string;
  notes?: string;
};

export function parseBranchSettings(raw: unknown): BranchSettings {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    invoicePrefix:
      typeof o.invoicePrefix === "string" ? o.invoicePrefix : undefined,
    notes: typeof o.notes === "string" ? o.notes : undefined,
  };
}

export async function branchHasHistory(branchId: string) {
  const counts = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      _count: {
        select: {
          sales: true,
          purchases: true,
          stockMovements: true,
          products: true,
        },
      },
    },
  });
  if (!counts) return false;
  const c = counts._count;
  return (
    c.sales > 0 ||
    c.purchases > 0 ||
    c.stockMovements > 0 ||
    c.products > 0
  );
}

export function activeBranchWhere(tenantId: string, includeDeleted = false) {
  return {
    tenantId,
    ...(includeDeleted ? {} : { deletedAt: null }),
  };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      package: { select: { name: true, storageLimitMb: true } },
      _count: { select: { products: true, sales: true } },
    },
  });

  const usage = tenants.map((t) => ({
    ...t,
    estimatedMb: t._count.products * 0.05 + t._count.sales * 0.01,
    limitMb: t.package?.storageLimitMb ?? 1024,
  }));

  const totalProducts = await prisma.product.count();
  const totalSales = await prisma.sale.count();

  return NextResponse.json({
    tenants: usage,
    summary: { totalProducts, totalSales },
  });
}

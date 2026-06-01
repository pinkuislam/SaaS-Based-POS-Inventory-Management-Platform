import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantPackageLimits } from "@/lib/package-limits";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const pkg = await getTenantPackageLimits(tenantId);

  const [users, branches, products, customers, suppliers] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.branch.count({ where: { tenantId } }),
    prisma.product.count({ where: { tenantId } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.supplier.count({ where: { tenantId } }),
  ]);

  return NextResponse.json({
    package: pkg
      ? {
          name: pkg.name,
          maxUsers: pkg.maxUsers,
          maxBranches: pkg.maxBranches,
          maxProducts: pkg.maxProducts,
          maxCustomers: pkg.maxCustomers,
          maxSuppliers: pkg.maxSuppliers,
          storageLimitMb: pkg.storageLimitMb,
        }
      : null,
    usage: { users, branches, products, customers, suppliers },
  });
}

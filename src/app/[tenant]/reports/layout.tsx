import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { ReportsShell } from "@/components/reports/reports-shell";
import {
  getTenantPackageFeatures,
  hasPackageFeature,
  PACKAGE_FEATURES,
} from "@/lib/package-features";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();

  const [branches, users, customers, suppliers, products, features] =
    await Promise.all([
    prisma.branch.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.supplier.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.product.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { id: true, name: true, sku: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    getTenantPackageFeatures(tenantId),
  ]);

  const advancedReports = hasPackageFeature(
    features,
    PACKAGE_FEATURES.ADVANCED_REPORTS
  );

  return (
    <ReportsShell
      tenantSlug={tenantSlug}
      filterOptions={{
        branches,
        users,
        customers,
        suppliers,
        products: products.map((p) => ({
          id: p.id,
          name: p.sku ? `${p.name} (${p.sku})` : p.name,
        })),
      }}
      advancedReports={advancedReports}
    >
      {children}
    </ReportsShell>
  );
}

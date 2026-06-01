import { Suspense } from "react";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { activeProductWhere } from "@/lib/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductsToolbar } from "@/components/products/products-toolbar";
import { ProductsTable } from "@/components/products/products-table";
import { ShowArchivedProducts } from "@/components/products/show-archived-products";
import { serializeProductForClient } from "@/lib/serialize";
import { decimalToNumber } from "@/lib/utils";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { show } = await searchParams;
  const showAll = show === "all";

  const [products, categories, brands, units] = await Promise.all([
    prisma.product.findMany({
      where: showAll
        ? { tenantId }
        : activeProductWhere(tenantId, { includeInactive: true }),
      include: { category: true, branch: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.productCategory.findMany({ where: { tenantId } }),
    prisma.brand.findMany({ where: { tenantId } }),
    prisma.unit.findMany({ where: { tenantId } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog ({products.length} items)
          </p>
        </div>
        <ProductsToolbar
          categories={categories}
          brands={brands}
          units={units}
        />
      </div>

      <Suspense>
        <ShowArchivedProducts tenantSlug={tenantSlug} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductsTable
            products={products.map((p) => ({
              ...serializeProductForClient(p),
              stockQty: decimalToNumber(p.stockQty),
              status: p.status,
              categoryName: p.category?.name ?? null,
              branchName: p.branch?.name ?? null,
              deletedAt: p.deletedAt?.toISOString() ?? null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

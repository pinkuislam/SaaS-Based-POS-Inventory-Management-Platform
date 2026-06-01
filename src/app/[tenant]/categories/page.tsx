import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/categories/category-manager";

export default async function CategoriesPage() {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();

  const [categories, brands, units] = await Promise.all([
    prisma.productCategory.findMany({
      where: { tenantId },
      include: { parent: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.brand.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.unit.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories, Brands & Units</h1>
        <p className="text-muted-foreground">
          Organize your product catalog
        </p>
      </div>
      <CategoryManager
        tenantSlug={tenantSlug}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          isActive: c.isActive,
          parentId: c.parentId,
          parentName: c.parent?.name ?? null,
        }))}
        brands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          isActive: b.isActive,
        }))}
        units={units.map((u) => ({
          id: u.id,
          name: u.name,
          shortName: u.shortName,
          unitType: u.unitType,
          isActive: u.isActive,
        }))}
      />
    </div>
  );
}

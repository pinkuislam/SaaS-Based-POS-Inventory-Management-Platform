import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/categories/category-manager";

export default async function CategoriesPage() {
  const tenantId = await getTenantId();

  const [categories, brands, units] = await Promise.all([
    prisma.productCategory.findMany({
      where: { tenantId },
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
      <CategoryManager categories={categories} brands={brands} units={units} />
    </div>
  );
}

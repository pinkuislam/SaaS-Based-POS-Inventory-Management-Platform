import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Package, Receipt } from "lucide-react";
import { StorageList } from "@/components/admin/lists/storage-list";

export default async function StoragePage() {
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      package: { select: { storageLimitMb: true } },
      _count: { select: { products: true, sales: true } },
    },
    orderBy: { name: "asc" },
  });

  const [totalProducts, totalSales] = await Promise.all([
    prisma.product.count(),
    prisma.sale.count(),
  ]);

  const rows = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    productCount: t._count.products,
    salesCount: t._count.sales,
    estMb: Math.round(t._count.products * 0.05 + t._count.sales * 0.01),
    storageLimitMb: t.package?.storageLimitMb ?? 1024,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">File & Storage</h1>
        <p className="text-muted-foreground">Monitor tenant storage usage estimates</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Total Products" value={String(totalProducts)} icon={Package} />
        <StatCard title="Total Sales Records" value={String(totalSales)} icon={Receipt} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tenant Usage (estimated)</CardTitle>
        </CardHeader>
        <CardContent>
          <StorageList tenants={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

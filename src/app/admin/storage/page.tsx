import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/ui/stat-card";
import { Package, Receipt } from "lucide-react";

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

  const totalProducts = await prisma.product.count();
  const totalSales = await prisma.sale.count();

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Est. MB</TableHead>
                <TableHead>Limit MB</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => {
                const est = Math.round(
                  t._count.products * 0.05 + t._count.sales * 0.01
                );
                const limit = t.package?.storageLimitMb ?? 1024;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t._count.products}</TableCell>
                    <TableCell>{t._count.sales}</TableCell>
                    <TableCell>{est}</TableCell>
                    <TableCell>{limit}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

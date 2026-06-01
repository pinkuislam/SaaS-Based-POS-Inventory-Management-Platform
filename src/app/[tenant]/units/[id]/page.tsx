import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import { activeProductWhere } from "@/lib/products";
import { unitTypeLabel } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, decimalToNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { id } = await params;

  const unit = await prisma.unit.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { products: true } } },
  });
  if (!unit) notFound();

  const products = await prisma.product.findMany({
    where: { ...activeProductWhere(tenantId, { includeInactive: true }), unitId: id },
    orderBy: { name: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={tenantDashboardPath(tenantSlug, "/categories")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{unit.name}</h1>
          <div className="flex gap-2 mt-1">
            {unit.shortName && (
              <Badge variant="outline">{unit.shortName}</Badge>
            )}
            <Badge variant="secondary">{unitTypeLabel(unit.unitType)}</Badge>
            <Badge variant={unit.isActive !== false ? "default" : "secondary"}>
              {unit.isActive !== false ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Products ({unit._count.products})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products use this unit.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={tenantDashboardPath(tenantSlug, `/products/${p.id}`)}
                        className="text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>{p.sku || "—"}</TableCell>
                    <TableCell>{decimalToNumber(p.stockQty)}</TableCell>
                    <TableCell>
                      {formatCurrency(decimalToNumber(p.sellingPrice))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

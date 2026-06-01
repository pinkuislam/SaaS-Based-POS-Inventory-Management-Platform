import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import { activeProductWhere } from "@/lib/products";
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
import { BrandImageUpload } from "@/components/brands/brand-image-upload";
import { formatCurrency, decimalToNumber } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { id } = await params;

  const brand = await prisma.brand.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) notFound();

  const products = await prisma.product.findMany({
    where: { ...activeProductWhere(tenantId, { includeInactive: true }), brandId: id },
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
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          <Badge variant={brand.isActive ? "default" : "secondary"} className="mt-1">
            {brand.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand logo</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandImageUpload brandId={brand.id} logoUrl={brand.logo} />
        </CardContent>
      </Card>

      {brand.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{brand.description}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Products ({brand._count.products})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products in this brand.</p>
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

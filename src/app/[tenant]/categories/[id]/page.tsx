import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
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
import { activeProductWhere } from "@/lib/products";
import { CategoryImageUpload } from "@/components/categories/category-image-upload";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { id } = await params;

  const category = await prisma.productCategory.findFirst({
    where: { id, tenantId },
    include: {
      parent: true,
      children: { orderBy: { name: "asc" } },
      _count: { select: { products: true } },
    },
  });

  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { ...activeProductWhere(tenantId), categoryId: id },
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
          <h1 className="text-2xl font-bold">{category.name}</h1>
          <div className="flex gap-2 mt-1">
            {category.code ? (
              <Badge variant="outline">{category.code}</Badge>
            ) : null}
            <Badge variant={category.isActive ? "default" : "secondary"}>
              {category.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category image</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryImageUpload categoryId={category.id} imageUrl={category.image} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{category._count.products}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Parent</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{category.parent?.name || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sub-categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{category.children.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products in this category</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No products in this category.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={tenantDashboardPath(tenantSlug, `/products/${p.id}`)}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>{p.sku || "—"}</TableCell>
                    <TableCell className="text-right">
                      {decimalToNumber(p.stockQty)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(decimalToNumber(p.sellingPrice))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

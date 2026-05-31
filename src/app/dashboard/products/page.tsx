import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, decimalToNumber } from "@/lib/utils";
import { ProductFormDialog } from "@/components/products/product-form-dialog";

export default async function ProductsPage() {
  const tenantId = await getTenantId();

  const [products, categories, brands, units] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId },
      include: { category: true, brand: true, unit: true },
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
        <ProductFormDialog
          categories={categories}
          brands={brands}
          units={units}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.sku || "—"}
                  </TableCell>
                  <TableCell>{product.category?.name || "—"}</TableCell>
                  <TableCell>
                    {formatCurrency(decimalToNumber(product.purchasePrice))}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(decimalToNumber(product.sellingPrice))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        decimalToNumber(product.stockQty) <=
                        decimalToNumber(product.reorderLevel)
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {decimalToNumber(product.stockQty)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

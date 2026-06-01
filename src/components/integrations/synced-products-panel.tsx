"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  stock: number;
  price: number;
  updatedAt: string;
};

export function SyncedProductsPanel({
  platform = "woocommerce",
}: {
  platform?: string;
}) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/integrations/synced-products?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setLastSync(d.lastProductSync || null);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [platform]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Synced products catalog</CardTitle>
        {lastSync ? (
          <p className="text-xs text-muted-foreground">
            Last product sync: {formatDate(lastSync)}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No products with SKU/barcode yet. Run product sync from your store
            connection above.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.slice(0, 50).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.sku || "—"}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>{formatCurrency(p.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

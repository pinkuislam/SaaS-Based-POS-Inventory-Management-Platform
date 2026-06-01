"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { tenantDashboardPath } from "@/lib/tenant-path";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ProductEditButton } from "@/components/products/product-edit-button";
import { ProductRestoreButton } from "@/components/products/product-restore-button";
import { BarcodePrintDialog } from "@/components/products/barcode-print-dialog";
import type { SerializedProductClient } from "@/lib/serialize";
import { useListFilter, textIncludes } from "@/hooks/use-list-filter";
import {
  FilteredList,
  EmptyTableRow,
  FilterSelect,
} from "@/components/ui/filtered-list";

export type ProductTableRow = SerializedProductClient & {
  stockQty: number;
  status: string;
  categoryName?: string | null;
  branchName?: string | null;
  deletedAt?: string | null;
};

export function ProductsTable({
  products,
}: {
  products: ProductTableRow[];
}) {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || "";

  const categories = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...[
        ...new Set(
          products.map((p) => p.categoryName).filter(Boolean) as string[]
        ),
      ]
        .sort()
        .map((c) => ({ value: c, label: c })),
    ],
    [products]
  );

  const {
    search,
    setSearch,
    setFilter,
    filterValues,
    filtered,
    hasActiveFilters,
    clearFilters,
    totalCount,
    filteredCount,
  } = useListFilter({
    items: products,
    searchPredicate: (p, q) =>
      textIncludes(p.name, q) ||
      textIncludes(p.sku, q) ||
      textIncludes(p.categoryName, q),
    filters: [
      {
        id: "category",
        match: (p, v) => v === "all" || p.categoryName === v,
      },
      {
        id: "stock",
        match: (p, v) => {
          if (v === "all") return true;
          const low = p.stockQty <= p.reorderLevel;
          if (v === "low") return low;
          if (v === "ok") return !low;
          return true;
        },
      },
      {
        id: "status",
        match: (p, v) => v === "all" || p.status === v,
      },
    ],
  });

  return (
    <FilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search name, SKU, category..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <>
          <FilterSelect
            label="Category"
            value={filterValues.category ?? "all"}
            onValueChange={(v) => setFilter("category", v)}
            options={categories}
            className="w-[180px]"
          />
          <FilterSelect
            label="Stock"
            value={filterValues.stock ?? "all"}
            onValueChange={(v) => setFilter("stock", v)}
            options={[
              { value: "all", label: "All stock" },
              { value: "low", label: "Low stock" },
              { value: "ok", label: "In stock" },
            ]}
          />
          <FilterSelect
            label="Status"
            value={filterValues.status ?? "all"}
            onValueChange={(v) => setFilter("status", v)}
            options={[
              { value: "all", label: "All status" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <EmptyTableRow colSpan={9} />
          ) : (
            filtered.map((product) => {
              const isLow = product.stockQty <= product.reorderLevel;
              return (
                <TableRow
                  key={product.id}
                  className={product.deletedAt ? "opacity-60" : undefined}
                >
                  <TableCell className="font-medium">
                    <Link
                      href={tenantDashboardPath(
                        tenantSlug,
                        `/products/${product.id}`
                      )}
                      className="hover:underline text-primary"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.sku || "—"}
                  </TableCell>
                  <TableCell>{product.categoryName || "—"}</TableCell>
                  <TableCell>{product.branchName || "—"}</TableCell>
                  <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                  <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                  <TableCell>
                    <Badge variant={isLow ? "destructive" : "secondary"}>
                      {product.stockQty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.deletedAt ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : (
                      <Badge variant="outline">{product.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {product.deletedAt ? (
                      <ProductRestoreButton productId={product.id} />
                    ) : (
                      <>
                        <BarcodePrintDialog product={product} />
                        <ProductEditButton product={product} />
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </FilteredList>
  );
}

"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useListFilter, textIncludes } from "@/hooks/use-list-filter";
import {
  FilteredList,
  EmptyTableRow,
  FilterSelect,
} from "@/components/ui/filtered-list";

export type InventoryStockRow = {
  id: string;
  name: string;
  categoryName: string | null;
  branchName?: string | null;
  stockQty: number;
  reorderLevel: number;
  stockValue: number;
  expiryDate?: string | null;
};

export function InventoryStockTable({ products }: { products: InventoryStockRow[] }) {
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
      textIncludes(p.name, q) || textIncludes(p.categoryName, q),
    filters: [
      {
        id: "category",
        match: (p, v) => v === "all" || p.categoryName === v,
      },
      {
        id: "stock",
        match: (p, v) => {
          if (v === "all") return true;
          const isLow =
            p.reorderLevel > 0 &&
            p.stockQty > 0 &&
            p.stockQty <= p.reorderLevel;
          if (v === "low") return isLow;
          if (v === "out") return p.stockQty <= 0;
          if (v === "ok") return p.stockQty > 0 && !isLow;
          if (v === "expired") {
            if (!p.expiryDate) return false;
            return new Date(p.expiryDate) < new Date();
          }
          return true;
        },
      },
    ],
  });

  return (
    <FilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search product, category..."
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
              { value: "out", label: "Out of stock" },
              { value: "expired", label: "Expired" },
              { value: "ok", label: "In stock" },
            ]}
          />
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Reorder Level</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <EmptyTableRow colSpan={7} />
          ) : (
            filtered.map((p) => {
              const isLow = p.stockQty <= p.reorderLevel;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.categoryName || "—"}</TableCell>
                  <TableCell>{p.branchName || "—"}</TableCell>
                  <TableCell>{p.stockQty}</TableCell>
                  <TableCell>{p.reorderLevel}</TableCell>
                  <TableCell>{formatCurrency(p.stockValue)}</TableCell>
                  <TableCell>
                    <Badge variant={isLow ? "destructive" : "secondary"}>
                      {isLow ? "Low Stock" : "OK"}
                    </Badge>
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

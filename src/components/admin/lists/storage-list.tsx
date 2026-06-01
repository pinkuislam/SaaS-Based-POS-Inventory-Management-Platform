"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import {
  AdminFilteredList,
  AdminEmptyTableRow,
} from "@/components/admin/admin-filtered-list";

export type StorageTenantRow = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  salesCount: number;
  estMb: number;
  storageLimitMb: number;
};

export function StorageList({ tenants }: { tenants: StorageTenantRow[] }) {
  const {
    search,
    setSearch,
    filtered,
    hasActiveFilters,
    clearFilters,
    totalCount,
    filteredCount,
  } = useAdminListFilter({
    items: tenants,
    searchPredicate: (t, q) =>
      textIncludes(t.name, q) || textIncludes(t.slug, q),
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search tenant..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
    >
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
          {filtered.length === 0 ? (
            <AdminEmptyTableRow colSpan={5} />
          ) : (
            filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.productCount}</TableCell>
                <TableCell>{t.salesCount}</TableCell>
                <TableCell>{t.estMb}</TableCell>
                <TableCell>{t.storageLimitMb}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </AdminFilteredList>
  );
}

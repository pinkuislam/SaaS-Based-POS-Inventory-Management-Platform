"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import {
  AdminFilteredList,
  AdminEmptyTableRow,
} from "@/components/admin/admin-filtered-list";
import { AdminFilterSelect } from "@/components/admin/admin-filter-select";
import {
  ADMIN_STATUS_FILTER_OPTIONS,
  matchesAdminActiveFilter,
} from "@/components/admin/admin-status-filter-options";
import { CouponFormDialog } from "@/components/admin/coupon-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";
import type { SerializedCoupon } from "@/lib/serialize";

export function CouponsList({
  coupons,
  packages,
}: {
  coupons: SerializedCoupon[];
  packages: { id: string; name: string }[];
}) {
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
  } = useAdminListFilter({
    items: coupons,
    searchPredicate: (c, q) =>
      textIncludes(c.code, q) ||
      textIncludes(c.discountType, q) ||
      textIncludes(c.packageName, q),
    filters: [
      {
        id: "status",
        match: (c, v) => matchesAdminActiveFilter(c.isActive, v),
      },
      {
        id: "type",
        match: (c, v) => v === "all" || c.discountType === v,
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search coupon code..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <>
          <AdminFilterSelect
            label="Status"
            value={filterValues.status ?? "all"}
            onValueChange={(v) => setFilter("status", v)}
            options={[...ADMIN_STATUS_FILTER_OPTIONS]}
          />
          <AdminFilterSelect
            label="Type"
            value={filterValues.type ?? "all"}
            onValueChange={(v) => setFilter("type", v)}
            options={[
              { value: "all", label: "All types" },
              { value: "percentage", label: "Percentage" },
              { value: "fixed", label: "Fixed" },
            ]}
          />
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Used</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <AdminEmptyTableRow colSpan={8} />
          ) : (
            filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-medium">{c.code}</TableCell>
                <TableCell>{c.discountType}</TableCell>
                <TableCell>{c.discountValue}</TableCell>
                <TableCell>{c.packageName || "All"}</TableCell>
                <TableCell>
                  {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </TableCell>
                <TableCell>
                  {c.expiryDate ? formatDate(c.expiryDate) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "default" : "secondary"}>
                    {c.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  <CouponFormDialog
                    packages={packages}
                    coupon={c}
                    mode="edit"
                  />
                  <DeleteButton url={`/api/admin/coupons/${c.id}`} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </AdminFilteredList>
  );
}

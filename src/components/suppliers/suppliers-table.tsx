"use client";

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
import { SupplierEditButton } from "@/components/suppliers/supplier-edit-button";
import { SupplierRestoreButton } from "@/components/suppliers/supplier-restore-button";
import { SupplierPaymentDialog } from "@/components/suppliers/supplier-payment-dialog";
import type { SerializedDuePurchase, SerializedSupplierEdit } from "@/lib/serialize";
import { StatementDialog } from "@/components/shared/statement-dialog";
import { useListFilter, textIncludes } from "@/hooks/use-list-filter";
import {
  FilteredList,
  EmptyTableRow,
  FilterSelect,
} from "@/components/ui/filtered-list";

export type SupplierTableRow = SerializedSupplierEdit & {
  status: string;
  deletedAt?: string | null;
  duePurchases?: SerializedDuePurchase[];
};

export function SuppliersTable({ suppliers }: { suppliers: SupplierTableRow[] }) {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || "";

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
    items: suppliers,
    searchPredicate: (s, q) =>
      textIncludes(s.name, q) ||
      textIncludes(s.companyName, q) ||
      textIncludes(s.phone, q) ||
      textIncludes(s.email, q),
    filters: [
      {
        id: "status",
        match: (s, v) => v === "all" || s.status === v,
      },
    ],
  });

  return (
    <FilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search supplier..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
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
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <EmptyTableRow colSpan={6} />
          ) : (
            filtered.map((s) => (
              <TableRow key={s.id} className={s.deletedAt ? "opacity-60" : undefined}>
                <TableCell className="font-medium">
                  <Link
                    href={tenantDashboardPath(tenantSlug, `/suppliers/${s.id}`)}
                    className="hover:underline text-primary"
                  >
                    {s.name}
                  </Link>
                </TableCell>
                <TableCell>{s.companyName || "—"}</TableCell>
                <TableCell>{s.phone || "—"}</TableCell>
                <TableCell>{s.email || "—"}</TableCell>
                <TableCell>
                  {s.deletedAt ? (
                    <Badge variant="destructive">Deleted</Badge>
                  ) : (
                    <Badge variant="outline">{s.status}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {s.deletedAt ? (
                    <SupplierRestoreButton supplierId={s.id} />
                  ) : (
                    <>
                  {s.duePurchases && s.duePurchases.length > 0 && (
                    <SupplierPaymentDialog
                      supplierId={s.id}
                      supplierName={s.name}
                      duePurchases={s.duePurchases}
                      totalDue={s.duePurchases.reduce(
                        (sum, p) => sum + p.dueAmount,
                        0
                      )}
                    />
                  )}
                  <StatementDialog
                    entityType="suppliers"
                    entityId={s.id}
                    entityName={s.name}
                  />
                  <SupplierEditButton supplier={s} />
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </FilteredList>
  );
}

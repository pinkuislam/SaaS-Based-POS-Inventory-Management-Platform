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
import { CustomerEditButton } from "@/components/customers/customer-edit-button";
import { CustomerRestoreButton } from "@/components/customers/customer-restore-button";
import { CustomerPaymentDialog } from "@/components/customers/customer-payment-dialog";
import { LoyaltyPointsDialog } from "@/components/customers/loyalty-points-dialog";
import { StatementDialog } from "@/components/shared/statement-dialog";
import type { SerializedCustomerEdit, SerializedDueSale } from "@/lib/serialize";
import { useListFilter, textIncludes } from "@/hooks/use-list-filter";
import {
  FilteredList,
  EmptyTableRow,
  FilterSelect,
} from "@/components/ui/filtered-list";

export type CustomerTableRow = SerializedCustomerEdit & {
  status: string;
  deletedAt?: string | null;
  loyaltyPoints: number;
  dueSales?: SerializedDueSale[];
};

export function CustomersTable({ customers }: { customers: CustomerTableRow[] }) {
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
    items: customers,
    searchPredicate: (c, q) =>
      textIncludes(c.name, q) ||
      textIncludes(c.phone, q) ||
      textIncludes(c.email, q),
    filters: [
      {
        id: "type",
        match: (c, v) => v === "all" || c.customerType === v,
      },
      {
        id: "status",
        match: (c, v) => v === "all" || c.status === v,
      },
    ],
  });

  return (
    <FilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search name, phone, email..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <>
          <FilterSelect
            label="Type"
            value={filterValues.type ?? "all"}
            onValueChange={(v) => setFilter("type", v)}
            options={[
              { value: "all", label: "All types" },
              { value: "retail", label: "Retail" },
              { value: "wholesale", label: "Wholesale" },
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
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <EmptyTableRow colSpan={6} />
          ) : (
            filtered.map((c) => (
              <TableRow key={c.id} className={c.deletedAt ? "opacity-60" : undefined}>
                <TableCell className="font-medium">
                  <Link
                    href={tenantDashboardPath(tenantSlug, `/customers/${c.id}`)}
                    className="hover:underline text-primary"
                  >
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell>{c.phone || "—"}</TableCell>
                <TableCell>{c.email || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{c.customerType}</Badge>
                </TableCell>
                <TableCell>
                  {c.deletedAt ? (
                    <Badge variant="destructive">Deleted</Badge>
                  ) : (
                    c.status
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {c.deletedAt ? (
                    <CustomerRestoreButton customerId={c.id} />
                  ) : (
                    <>
                  {c.dueSales && c.dueSales.length > 0 && (
                    <CustomerPaymentDialog
                      customerId={c.id}
                      customerName={c.name}
                      dueSales={c.dueSales}
                      totalDue={c.dueSales.reduce((sum, s) => sum + s.dueAmount, 0)}
                    />
                  )}
                  <StatementDialog
                    entityType="customers"
                    entityId={c.id}
                    entityName={c.name}
                  />
                  <LoyaltyPointsDialog
                    customerId={c.id}
                    customerName={c.name}
                    currentPoints={c.loyaltyPoints}
                  />
                  <CustomerEditButton customer={c} />
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

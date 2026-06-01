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
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import {
  AdminFilteredList,
  AdminEmptyTableRow,
} from "@/components/admin/admin-filtered-list";
import { AdminFilterSelect } from "@/components/admin/admin-filter-select";
import { SubscriptionFormDialog } from "@/components/admin/subscription-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";
import type { SerializedSubscription } from "@/lib/serialize";

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "ACTIVE", label: "Active" },
  { value: "TRIAL", label: "Trial" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

export type SubscriptionListRow = SerializedSubscription & {
  tenantName: string;
  packageName: string;
};

export function SubscriptionsList({
  subscriptions,
  tenants,
  packages,
}: {
  subscriptions: SubscriptionListRow[];
  tenants: { id: string; name: string }[];
  packages: { id: string; name: string }[];
}) {
  const tenantOptions = useMemo(
    () => [
      { value: "all", label: "All tenants" },
      ...tenants.map((t) => ({ value: t.id, label: t.name })),
    ],
    [tenants]
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
  } = useAdminListFilter({
    items: subscriptions,
    searchPredicate: (s, q) =>
      textIncludes(s.tenantName, q) ||
      textIncludes(s.packageName, q) ||
      textIncludes(s.status, q),
    filters: [
      {
        id: "status",
        match: (s, v) => v === "all" || s.status === v,
      },
      {
        id: "tenant",
        match: (s, v) => v === "all" || s.tenantId === v,
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search tenant, package..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <>
          <AdminFilterSelect
            label="Status"
            value={filterValues.status ?? "all"}
            onValueChange={(v) => setFilter("status", v)}
            options={STATUS_OPTIONS}
          />
          <AdminFilterSelect
            label="Tenant"
            value={filterValues.tenant ?? "all"}
            onValueChange={(v) => setFilter("tenant", v)}
            options={tenantOptions}
            className="w-[200px]"
          />
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <AdminEmptyTableRow colSpan={7} />
          ) : (
            filtered.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.tenantName}</TableCell>
                <TableCell>{sub.packageName}</TableCell>
                <TableCell>{formatCurrency(sub.amount)}</TableCell>
                <TableCell>{formatDate(sub.startDate)}</TableCell>
                <TableCell>{formatDate(sub.endDate)}</TableCell>
                <TableCell>
                  <Badge>{sub.status}</Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  <SubscriptionFormDialog
                    tenants={tenants}
                    packages={packages}
                    subscription={sub}
                    mode="edit"
                  />
                  <DeleteButton url={`/api/admin/subscriptions/${sub.id}`} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </AdminFilteredList>
  );
}

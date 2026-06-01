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
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import {
  AdminFilteredList,
  AdminEmptyTableRow,
} from "@/components/admin/admin-filtered-list";
import { AdminFilterSelect } from "@/components/admin/admin-filter-select";
import { PaymentFormDialog } from "@/components/admin/payment-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";
import type { SerializedSubscriptionPayment } from "@/lib/serialize";

export type PaymentListRow = SerializedSubscriptionPayment & {
  tenantName: string;
  packageName: string;
  paidAt: string | null;
  createdAt: string;
};

export function PaymentsList({
  payments,
  subscriptionOptions,
}: {
  payments: PaymentListRow[];
  subscriptionOptions: { id: string; label: string }[];
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
    items: payments,
    searchPredicate: (p, q) =>
      textIncludes(p.tenantName, q) ||
      textIncludes(p.packageName, q) ||
      textIncludes(p.method, q) ||
      textIncludes(p.status, q),
    filters: [
      {
        id: "status",
        match: (p, v) => v === "all" || p.status === v,
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search tenant, method..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <AdminFilterSelect
          label="Status"
          value={filterValues.status ?? "all"}
          onValueChange={(v) => setFilter("status", v)}
          options={[
            { value: "all", label: "All status" },
            { value: "completed", label: "Completed" },
            { value: "pending", label: "Pending" },
            { value: "failed", label: "Failed" },
          ]}
        />
      }
    >
      {payments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No payment records yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <AdminEmptyTableRow colSpan={7} />
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.tenantName}</TableCell>
                  <TableCell>{p.packageName}</TableCell>
                  <TableCell>{formatCurrency(p.amount)}</TableCell>
                  <TableCell>{p.method || "—"}</TableCell>
                  <TableCell>
                    <Badge>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <PaymentFormDialog
                      subscriptions={subscriptionOptions}
                      payment={p}
                      mode="edit"
                    />
                    <DeleteButton url={`/api/admin/payments/${p.id}`} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </AdminFilteredList>
  );
}

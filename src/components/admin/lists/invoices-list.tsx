"use client";

import Link from "next/link";
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
import { InvoiceEditDialog } from "@/components/admin/invoice-edit-dialog";
import { InvoiceMarkPaidButton } from "@/components/admin/invoice-mark-paid";
import { InvoiceSendButton } from "@/components/admin/invoice-send-button";
import { SubscriptionInvoiceActions } from "@/components/admin/subscription-invoice-actions";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export type InvoiceListRow = {
  id: string;
  invoiceNo: string;
  tenantId: string;
  tenantName: string;
  total: number;
  status: string;
  dueDate: string | null;
  notes: string | null;
};

export function InvoicesList({ invoices }: { invoices: InvoiceListRow[] }) {
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
    items: invoices,
    searchPredicate: (inv, q) =>
      textIncludes(inv.invoiceNo, q) ||
      textIncludes(inv.tenantName, q) ||
      textIncludes(inv.status, q),
    filters: [
      {
        id: "status",
        match: (inv, v) => v === "all" || inv.status === v,
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search invoice #, tenant..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <AdminFilterSelect
          label="Status"
          value={filterValues.status ?? "all"}
          onValueChange={(v) => setFilter("status", v)}
          options={[
            { value: "all", label: "All status" },
            { value: "paid", label: "Paid" },
            { value: "pending", label: "Pending" },
            { value: "overdue", label: "Overdue" },
            { value: "draft", label: "Draft" },
          ]}
        />
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <AdminEmptyTableRow colSpan={6} />
          ) : (
            filtered.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono">
                  <Link
                    href={`/admin/invoices/${inv.id}`}
                    className="text-primary hover:underline"
                  >
                    {inv.invoiceNo}
                  </Link>
                </TableCell>
                <TableCell>{inv.tenantName}</TableCell>
                <TableCell>{formatCurrency(inv.total)}</TableCell>
                <TableCell>
                  <Badge
                    variant={inv.status === "paid" ? "default" : "secondary"}
                  >
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                </TableCell>
                <TableCell className="flex flex-wrap items-center gap-1">
                  <SubscriptionInvoiceActions invoiceId={inv.id} />
                  <InvoiceEditDialog
                    invoice={{
                      id: inv.id,
                      status: inv.status,
                      notes: inv.notes,
                    }}
                  />
                  <InvoiceSendButton invoiceId={inv.id} />
                  {inv.status !== "paid" && (
                    <InvoiceMarkPaidButton invoiceId={inv.id} />
                  )}
                  {inv.status !== "paid" && (
                    <DeleteButton url={`/api/admin/invoices/${inv.id}`} />
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </AdminFilteredList>
  );
}

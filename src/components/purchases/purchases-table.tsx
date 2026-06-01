"use client";

import Link from "next/link";
import { tenantDashboardPath } from "@/lib/tenant-path";
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
import { PurchaseReturnDialog } from "@/components/purchases/purchase-return-dialog";
import { useListFilter, textIncludes } from "@/hooks/use-list-filter";
import {
  FilteredList,
  EmptyTableRow,
  FilterSelect,
} from "@/components/ui/filtered-list";

export type PurchaseTableRow = {
  id: string;
  invoiceNo: string;
  supplierName: string;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  status: string;
  purchaseDate: string;
  items: {
    id: string;
    quantity: number;
    returnedQty: number;
    product: { name: string };
  }[];
};

export function PurchasesTable({
  purchases,
  tenantSlug,
}: {
  purchases: PurchaseTableRow[];
  tenantSlug: string;
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
  } = useListFilter({
    items: purchases,
    searchPredicate: (p, q) =>
      textIncludes(p.invoiceNo, q) || textIncludes(p.supplierName, q),
    filters: [
      {
        id: "status",
        match: (p, v) => v === "all" || p.status === v,
      },
      {
        id: "payment",
        match: (p, v) => v === "all" || p.paymentStatus === v,
      },
    ],
  });

  return (
    <FilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search invoice, supplier..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <>
          <FilterSelect
            label="Status"
            value={filterValues.status ?? "all"}
            onValueChange={(v) => setFilter("status", v)}
            options={[
              { value: "all", label: "All status" },
              { value: "DRAFT", label: "Draft" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "RETURNED", label: "Returned" },
            ]}
          />
          <FilterSelect
            label="Payment"
            value={filterValues.payment ?? "all"}
            onValueChange={(v) => setFilter("payment", v)}
            options={[
              { value: "all", label: "All payments" },
              { value: "PAID", label: "Paid" },
              { value: "PARTIAL", label: "Partial" },
              { value: "DUE", label: "Due" },
            ]}
          />
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <EmptyTableRow colSpan={8} />
          ) : (
            filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">
                  <Link
                    href={tenantDashboardPath(tenantSlug, `/purchases/${p.id}`)}
                    className="text-primary hover:underline"
                  >
                    {p.invoiceNo}
                  </Link>
                </TableCell>
                <TableCell>{p.supplierName}</TableCell>
                <TableCell>{formatCurrency(p.total)}</TableCell>
                <TableCell>{formatCurrency(p.paidAmount)}</TableCell>
                <TableCell>{formatCurrency(p.dueAmount)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{p.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge>{p.paymentStatus}</Badge>
                </TableCell>
                <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                <TableCell className="text-right">
                  {p.status === "COMPLETED" && (
                    <PurchaseReturnDialog
                      purchaseId={p.id}
                      invoiceNo={p.invoiceNo}
                      items={p.items}
                      status={p.status}
                    />
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

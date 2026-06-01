"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { useListFilter, textIncludes } from "@/hooks/use-list-filter";
import {
  FilteredList,
  EmptyTableRow,
  FilterSelect,
} from "@/components/ui/filtered-list";
import { SaleReturnDialog } from "@/components/sales/sale-return-dialog";
import { SaleVoidDialog } from "@/components/sales/sale-void-dialog";
import { Eye } from "lucide-react";

export type SaleRow = {
  id: string;
  invoiceNo: string;
  customerName: string;
  cashierName: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  saleDate: string;
  items: {
    id: string;
    productId: string;
    quantity: number;
    returnedQty: number;
    product: { name: string };
  }[];
};

export function SalesList({
  tenantSlug,
  sales,
}: {
  tenantSlug: string;
  sales: SaleRow[];
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
    items: sales,
    searchPredicate: (s, q) =>
      textIncludes(s.invoiceNo, q) ||
      textIncludes(s.customerName, q) ||
      textIncludes(s.cashierName, q),
    filters: [
      {
        id: "status",
        match: (s, v) => v === "all" || s.status === v,
      },
      {
        id: "payment",
        match: (s, v) => v === "all" || s.paymentStatus === v,
      },
    ],
  });

  return (
    <FilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search invoice, customer..."
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
              { value: "COMPLETED", label: "Completed" },
              { value: "HELD", label: "Held / draft" },
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
            <TableHead>Customer</TableHead>
            <TableHead>Cashier</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <EmptyTableRow colSpan={8} />
          ) : (
            filtered.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono">
                  <Link
                    href={tenantDashboardPath(tenantSlug, `/sales/${sale.id}`)}
                    className="text-primary hover:underline"
                  >
                    {sale.invoiceNo}
                  </Link>
                </TableCell>
                <TableCell>{sale.customerName}</TableCell>
                <TableCell>{sale.cashierName}</TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(sale.total)}
                </TableCell>
                <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sale.status === "RETURNED" ? "destructive" : "default"
                    }
                  >
                    {sale.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(sale.saleDate)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={tenantDashboardPath(tenantSlug, `/sales/${sale.id}`)}
                    >
                      <Button variant="ghost" size="icon" title="View / Print">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {sale.status === "COMPLETED" && (
                      <>
                        <SaleReturnDialog
                          saleId={sale.id}
                          invoiceNo={sale.invoiceNo}
                          items={sale.items}
                          status={sale.status}
                        />
                        <SaleVoidDialog
                          saleId={sale.id}
                          invoiceNo={sale.invoiceNo}
                          status={sale.status}
                        />
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </FilteredList>
  );
}

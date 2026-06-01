"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";

export function AdminFilteredList({
  totalCount,
  filteredCount,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  hasActiveFilters,
  onClearFilters,
  children,
}: {
  totalCount: number;
  filteredCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <AdminListToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filters={
          <>
            {filters}
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
                Clear filters
              </Button>
            ) : null}
          </>
        }
      />
      <p className="mb-3 text-sm text-muted-foreground">
        Showing {filteredCount} of {totalCount}
      </p>
      {children}
    </>
  );
}

export function AdminEmptyTableRow({
  colSpan,
  message = "No items match your search or filters.",
}: {
  colSpan: number;
  message?: string;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="py-10 text-center text-muted-foreground"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}

"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseEditDialog } from "@/components/expenses/expense-edit-dialog";
import { useListFilter, textIncludes } from "@/hooks/use-list-filter";
import {
  FilteredList,
  EmptyTableRow,
  FilterSelect,
} from "@/components/ui/filtered-list";

export type ExpenseTableRow = {
  id: string;
  title: string;
  categoryId: string | null;
  categoryName: string | null;
  amount: number;
  expenseDate: string;
  notes: string | null;
  deletedAt?: string | null;
};

export function ExpensesTable({
  expenses,
  categories = [],
}: {
  expenses: ExpenseTableRow[];
  categories?: { id: string; name: string }[];
}) {
  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...[
        ...new Set(
          expenses.map((e) => e.categoryName).filter(Boolean) as string[]
        ),
      ]
        .sort()
        .map((c) => ({ value: c, label: c })),
    ],
    [expenses]
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
  } = useListFilter({
    items: expenses,
    searchPredicate: (e, q) =>
      textIncludes(e.title, q) ||
      textIncludes(e.categoryName, q) ||
      textIncludes(e.notes, q),
    filters: [
      {
        id: "category",
        match: (e, v) => v === "all" || e.categoryName === v,
      },
    ],
  });

  return (
    <FilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search title, category, notes..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <FilterSelect
          label="Category"
          value={filterValues.category ?? "all"}
          onValueChange={(v) => setFilter("category", v)}
          options={categoryOptions}
          className="w-[180px]"
        />
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <EmptyTableRow colSpan={6} />
          ) : (
            filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>{e.categoryName || "—"}</TableCell>
                <TableCell>{formatCurrency(e.amount)}</TableCell>
                <TableCell>{formatDate(e.expenseDate)}</TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {e.notes || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <ExpenseEditDialog expense={e} categories={categories} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </FilteredList>
  );
}

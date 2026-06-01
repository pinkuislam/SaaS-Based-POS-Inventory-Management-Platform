"use client";

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

export type ActivityLogRow = {
  id: string;
  createdAt: string;
  adminName: string;
  module: string;
  action: string;
  details: string | null;
};

export function ActivityList({ logs }: { logs: ActivityLogRow[] }) {
  const modules = [...new Set(logs.map((l) => l.module))].sort();

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
    items: logs,
    searchPredicate: (l, q) =>
      textIncludes(l.adminName, q) ||
      textIncludes(l.module, q) ||
      textIncludes(l.action, q) ||
      textIncludes(l.details, q),
    filters: [
      {
        id: "module",
        match: (l, v) => v === "all" || l.module === v,
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search admin, module, action..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <AdminFilterSelect
          label="Module"
          value={filterValues.module ?? "all"}
          onValueChange={(v) => setFilter("module", v)}
          options={[
            { value: "all", label: "All modules" },
            ...modules.map((m) => ({ value: m, label: m })),
          ]}
          className="w-[200px]"
        />
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <AdminEmptyTableRow colSpan={5} />
          ) : (
            filtered.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell>{log.adminName}</TableCell>
                <TableCell>{log.module}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {log.details || "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </AdminFilteredList>
  );
}

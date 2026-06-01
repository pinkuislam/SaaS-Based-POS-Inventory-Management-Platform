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
import {
  ADMIN_STATUS_FILTER_OPTIONS,
  matchesAdminActiveFilter,
  FilteredList,
  EmptyTableRow,
  FilterSelect,
} from "@/components/ui/filtered-list";
import { useListFilter, textIncludes } from "@/hooks/use-list-filter";

export type BranchRow = {
  id: string;
  name: string;
  code: string | null;
  phone: string | null;
  userCount: number;
  isMain: boolean;
  isActive: boolean;
};

export function BranchesList({ branches }: { branches: BranchRow[] }) {
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
    items: branches,
    searchPredicate: (b, q) =>
      textIncludes(b.name, q) ||
      textIncludes(b.code, q) ||
      textIncludes(b.phone, q),
    filters: [
      {
        id: "status",
        match: (b, v) => matchesAdminActiveFilter(b.isActive, v),
      },
    ],
  });

  return (
    <FilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search branch..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <FilterSelect
          label="Status"
          value={filterValues.status ?? "all"}
          onValueChange={(v) => setFilter("status", v)}
          options={[...ADMIN_STATUS_FILTER_OPTIONS]}
        />
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <EmptyTableRow colSpan={6} />
          ) : (
            filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>{b.code || "—"}</TableCell>
                <TableCell>{b.phone || "—"}</TableCell>
                <TableCell>{b.userCount}</TableCell>
                <TableCell>{b.isMain && <Badge>Main</Badge>}</TableCell>
                <TableCell>
                  <Badge variant={b.isActive ? "default" : "secondary"}>
                    {b.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </FilteredList>
  );
}

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
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import {
  AdminFilteredList,
  AdminEmptyTableRow,
} from "@/components/admin/admin-filtered-list";
import { AdminFilterSelect } from "@/components/admin/admin-filter-select";
import {
  ADMIN_STATUS_FILTER_OPTIONS,
  matchesAdminActiveFilter,
} from "@/components/admin/admin-status-filter-options";
import { AdminRoleFormDialog } from "@/components/admin/admin-role-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export type AdminRoleRow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  adminCount: number;
  permissions: unknown;
};

export function RolesList({ roles }: { roles: AdminRoleRow[] }) {
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
    items: roles,
    searchPredicate: (r, q) =>
      textIncludes(r.name, q) || textIncludes(r.description, q),
    filters: [
      {
        id: "status",
        match: (r, v) => matchesAdminActiveFilter(r.isActive, v),
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search role..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <AdminFilterSelect
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
            <TableHead>Role</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Admins</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <AdminEmptyTableRow colSpan={5} />
          ) : (
            filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">
                  {r.description || "—"}
                </TableCell>
                <TableCell>{r.adminCount}</TableCell>
                <TableCell>
                  <Badge variant={r.isActive ? "default" : "secondary"}>
                    {r.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  <AdminRoleFormDialog
                    role={{
                      id: r.id,
                      name: r.name,
                      description: r.description,
                      permissions: r.permissions,
                    }}
                    mode="edit"
                  />
                  <DeleteButton url={`/api/admin/roles/${r.id}`} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </AdminFilteredList>
  );
}

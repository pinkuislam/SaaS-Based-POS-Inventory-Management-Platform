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
import { formatDate } from "@/lib/utils";
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
import { AdminUserFormDialog } from "@/components/admin/admin-user-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  isPrimary: boolean;
  roleId: string | null;
  roleName: string | null;
  createdAt: string;
};

export function UsersList({
  admins,
  roles,
}: {
  admins: AdminUserRow[];
  roles: { id: string; name: string }[];
}) {
  const roleOptions = useMemo(
    () => [
      { value: "all", label: "All roles" },
      ...roles.map((r) => ({ value: r.id, label: r.name })),
    ],
    [roles]
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
    items: admins,
    searchPredicate: (a, q) =>
      textIncludes(a.name, q) ||
      textIncludes(a.email, q) ||
      textIncludes(a.roleName, q),
    filters: [
      {
        id: "status",
        match: (a, v) => matchesAdminActiveFilter(a.isActive, v),
      },
      {
        id: "role",
        match: (a, v) => v === "all" || a.roleId === v,
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search name, email..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <>
          <AdminFilterSelect
            label="Status"
            value={filterValues.status ?? "all"}
            onValueChange={(v) => setFilter("status", v)}
            options={[...ADMIN_STATUS_FILTER_OPTIONS]}
          />
          <AdminFilterSelect
            label="Role"
            value={filterValues.role ?? "all"}
            onValueChange={(v) => setFilter("role", v)}
            options={roleOptions}
            className="w-[180px]"
          />
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <AdminEmptyTableRow colSpan={6} />
          ) : (
            filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.name}
                  {a.isPrimary && (
                    <Badge className="ml-2" variant="outline">
                      Primary
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{a.email}</TableCell>
                <TableCell>{a.roleName || "—"}</TableCell>
                <TableCell>
                  <Badge variant={a.isActive ? "default" : "secondary"}>
                    {a.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(a.createdAt)}</TableCell>
                <TableCell className="flex gap-1">
                  <AdminUserFormDialog
                    roles={roles}
                    admin={{
                      id: a.id,
                      name: a.name,
                      email: a.email,
                      phone: a.phone,
                      roleId: a.roleId,
                      isActive: a.isActive,
                    }}
                    mode="edit"
                  />
                  {!a.isPrimary && (
                    <DeleteButton url={`/api/admin/admins/${a.id}`} />
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

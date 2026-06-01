"use client";

import { useMemo } from "react";
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
import { formatDate } from "@/lib/utils";
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import {
  AdminFilteredList,
  AdminEmptyTableRow,
} from "@/components/admin/admin-filtered-list";
import { AdminFilterSelect } from "@/components/admin/admin-filter-select";
import { TenantActions } from "@/components/admin/tenant-actions";
import { ProvisionDbButton } from "@/components/admin/provision-db-button";
import { TenantPackageDialog } from "@/components/admin/tenant-package-dialog";
import type { TenantEditData } from "@/components/admin/tenant-edit-dialog";

export type TenantListRow = {
  id: string;
  name: string;
  email: string;
  slug: string;
  status: string;
  packageId: string | null;
  packageName: string | null;
  dbProvisioned: boolean;
  dbName: string | null;
  userCount: number;
  productCount: number;
  subscriptionEnd: string | null;
  tenantEdit: TenantEditData;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "EXPIRED", label: "Expired" },
  { value: "INACTIVE", label: "Inactive" },
];

export function TenantsList({
  tenants,
  packages,
}: {
  tenants: TenantListRow[];
  packages: { id: string; name: string }[];
}) {
  const packageOptions = useMemo(
    () => [
      { value: "all", label: "All packages" },
      ...packages.map((p) => ({ value: p.id, label: p.name })),
    ],
    [packages]
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
    items: tenants,
    searchPredicate: (t, q) =>
      textIncludes(t.name, q) ||
      textIncludes(t.email, q) ||
      textIncludes(t.slug, q) ||
      textIncludes(t.packageName, q),
    filters: [
      {
        id: "status",
        match: (t, v) => v === "all" || t.status === v,
      },
      {
        id: "package",
        match: (t, v) => v === "all" || t.packageId === v,
      },
      {
        id: "database",
        match: (t, v) => {
          if (v === "all") return true;
          if (v === "provisioned") return t.dbProvisioned;
          if (v === "shared") return !t.dbProvisioned;
          return true;
        },
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search business, email, slug..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <>
          <AdminFilterSelect
            label="Status"
            value={filterValues.status ?? "all"}
            onValueChange={(v) => setFilter("status", v)}
            options={STATUS_OPTIONS}
          />
          <AdminFilterSelect
            label="Package"
            value={filterValues.package ?? "all"}
            onValueChange={(v) => setFilter("package", v)}
            options={packageOptions}
            className="w-[180px]"
          />
          <AdminFilterSelect
            label="Database"
            value={filterValues.database ?? "all"}
            onValueChange={(v) => setFilter("database", v)}
            options={[
              { value: "all", label: "All databases" },
              { value: "provisioned", label: "Provisioned" },
              { value: "shared", label: "Shared DB" },
            ]}
          />
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Database</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <AdminEmptyTableRow colSpan={9} />
          ) : (
            filtered.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div>
                    <Link
                      href={`/admin/tenants/${tenant.id}`}
                      className="font-medium hover:underline"
                    >
                      {tenant.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{tenant.email}</p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{tenant.slug}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{tenant.packageName || "—"}</span>
                    <TenantPackageDialog
                      tenantId={tenant.id}
                      tenantName={tenant.name}
                      currentPackageId={tenant.packageId}
                      packages={packages}
                    />
                  </div>
                </TableCell>
                <TableCell>{tenant.userCount}</TableCell>
                <TableCell>{tenant.productCount}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tenant.status === "ACTIVE"
                        ? "default"
                        : tenant.status === "SUSPENDED"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {tenant.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ProvisionDbButton
                    tenantId={tenant.id}
                    dbProvisioned={tenant.dbProvisioned}
                    dbName={tenant.dbName}
                  />
                </TableCell>
                <TableCell>
                  {tenant.subscriptionEnd
                    ? formatDate(tenant.subscriptionEnd)
                    : "—"}
                </TableCell>
                <TableCell>
                  <TenantActions
                    tenantId={tenant.id}
                    status={tenant.status}
                    packages={packages}
                    tenant={tenant.tenantEdit}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </AdminFilteredList>
  );
}

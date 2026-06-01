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
import { formatDate } from "@/lib/utils";
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import {
  AdminFilteredList,
  AdminEmptyTableRow,
} from "@/components/admin/admin-filtered-list";
import { AdminFilterSelect } from "@/components/admin/admin-filter-select";
import { DatabaseActions } from "@/components/admin/database-actions";
import { BackupActions } from "@/components/admin/backup-actions";

export type TenantDatabaseRow = {
  id: string;
  name: string;
  slug: string;
  dbName: string | null;
  dbProvisioned: boolean;
  status: string;
};

export type BackupRow = {
  id: string;
  tenantId: string;
  tenantName: string;
  fileName: string;
  status: string;
  filePath: string | null;
  createdAt: string;
};

export function DatabasesList({
  tenants,
  backups,
}: {
  tenants: TenantDatabaseRow[];
  backups: BackupRow[];
}) {
  const tenantFilter = useAdminListFilter({
    items: tenants,
    searchPredicate: (t, q) =>
      textIncludes(t.name, q) ||
      textIncludes(t.slug, q) ||
      textIncludes(t.dbName, q),
    filters: [
      {
        id: "provisioned",
        match: (t, v) => {
          if (v === "all") return true;
          if (v === "yes") return t.dbProvisioned;
          if (v === "no") return !t.dbProvisioned;
          return true;
        },
      },
    ],
  });

  const backupFilter = useAdminListFilter({
    items: backups,
    searchPredicate: (b, q) =>
      textIncludes(b.tenantName, q) ||
      textIncludes(b.fileName, q) ||
      textIncludes(b.status, q),
    filters: [
      {
        id: "status",
        match: (b, v) => v === "all" || b.status === v,
      },
    ],
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Tenant Databases</h2>
        <AdminFilteredList
          totalCount={tenantFilter.totalCount}
          filteredCount={tenantFilter.filteredCount}
          search={tenantFilter.search}
          onSearchChange={tenantFilter.setSearch}
          searchPlaceholder="Search tenant..."
          hasActiveFilters={tenantFilter.hasActiveFilters}
          onClearFilters={tenantFilter.clearFilters}
          filters={
            <AdminFilterSelect
              label="Provisioned"
              value={tenantFilter.filterValues.provisioned ?? "all"}
              onValueChange={(v) => tenantFilter.setFilter("provisioned", v)}
              options={[
                { value: "all", label: "All" },
                { value: "yes", label: "Provisioned" },
                { value: "no", label: "Shared DB" },
              ]}
            />
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>DB Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenantFilter.filtered.length === 0 ? (
                <AdminEmptyTableRow colSpan={4} />
              ) : (
                tenantFilter.filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {t.dbProvisioned
                        ? t.dbName ||
                          `inventory_pos_${t.slug.replace(/-/g, "_")}`
                        : "Shared (master DB)"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.dbProvisioned ? "default" : "secondary"}>
                        {t.dbProvisioned ? "Provisioned" : "Not provisioned"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DatabaseActions
                        tenantId={t.id}
                        provisioned={t.dbProvisioned}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminFilteredList>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Backups</h2>
        <AdminFilteredList
          totalCount={backupFilter.totalCount}
          filteredCount={backupFilter.filteredCount}
          search={backupFilter.search}
          onSearchChange={backupFilter.setSearch}
          searchPlaceholder="Search backup..."
          hasActiveFilters={backupFilter.hasActiveFilters}
          onClearFilters={backupFilter.clearFilters}
          filters={
            <AdminFilterSelect
              label="Status"
              value={backupFilter.filterValues.status ?? "all"}
              onValueChange={(v) => backupFilter.setFilter("status", v)}
              options={[
                { value: "all", label: "All status" },
                { value: "success", label: "Success" },
                { value: "failed", label: "Failed" },
                { value: "pending", label: "Pending" },
              ]}
            />
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {backupFilter.filtered.length === 0 ? (
                <AdminEmptyTableRow colSpan={5} />
              ) : (
                backupFilter.filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.tenantName}</TableCell>
                    <TableCell className="font-mono text-xs">{b.fileName}</TableCell>
                    <TableCell>
                      <Badge>{b.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(b.createdAt)}</TableCell>
                    <TableCell>
                      <BackupActions
                        backupId={b.id}
                        canDownload={!!(b.filePath && b.status === "success")}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminFilteredList>
      </div>
    </div>
  );
}

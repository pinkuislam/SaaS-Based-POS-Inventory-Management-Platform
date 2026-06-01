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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import {
  AdminFilteredList,
  AdminEmptyTableRow,
} from "@/components/admin/admin-filtered-list";
import {
  ADMIN_STATUS_FILTER_OPTIONS,
  matchesAdminActiveFilter,
} from "@/components/admin/admin-status-filter-options";
import { AdminFilterSelect } from "@/components/admin/admin-filter-select";

export type WooTenantRow = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  platform: string;
  storeUrl: string;
  isActive: boolean;
  syncProducts: boolean;
  syncStock: boolean;
  syncOrders: boolean;
  lastProductSync: string | null;
  lastOrderSync: string | null;
};

export function WooCommerceTenantsTable({
  connections,
  tenantsWithout,
}: {
  connections: WooTenantRow[];
  tenantsWithout: { id: string; name: string; slug: string }[];
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
  } = useAdminListFilter({
    items: connections,
    searchPredicate: (row, q) =>
      textIncludes(row.tenantName, q) ||
      textIncludes(row.storeUrl, q) ||
      textIncludes(row.tenantSlug, q),
    filters: [
      {
        id: "status",
        match: (row, v) => matchesAdminActiveFilter(row.isActive, v),
      },
    ],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>E-commerce connections</CardTitle>
        <CardDescription>
          WooCommerce and Shopify per tenant. Credentials are set in each
          business Integrations page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tenants have connected an e-commerce store yet.
          </p>
        ) : (
          <AdminFilteredList
            totalCount={totalCount}
            filteredCount={filteredCount}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search tenant, store URL..."
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
                  <TableHead>Tenant</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Store URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead>Last product sync</TableHead>
                  <TableHead>Last order sync</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <AdminEmptyTableRow colSpan={8} />
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.tenantName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {row.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        <a
                          href={row.storeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {row.storeUrl}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.isActive ? "default" : "secondary"}>
                          {row.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[
                          row.syncProducts && "Products",
                          row.syncStock && "Stock",
                          row.syncOrders && "Orders",
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.lastProductSync
                          ? formatDate(row.lastProductSync)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.lastOrderSync ? formatDate(row.lastOrderSync) : "—"}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={tenantDashboardPath(
                            row.tenantSlug,
                            "/integrations"
                          )}
                        >
                          <Button size="sm" variant="outline">
                            Open tenant
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </AdminFilteredList>
        )}

        {tenantsWithout.length > 0 ? (
          <div>
            <p className="text-sm font-medium mb-2">
              Tenants without e-commerce ({tenantsWithout.length})
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {tenantsWithout.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span>{t.name}</span>
                  <Link
                    href={tenantDashboardPath(t.slug, "/integrations")}
                    className="text-primary hover:underline text-xs"
                  >
                    Set up →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import {
  AdminFilteredList,
} from "@/components/admin/admin-filtered-list";
import { AdminFilterSelect } from "@/components/admin/admin-filter-select";
import {
  ADMIN_STATUS_FILTER_OPTIONS,
  matchesAdminActiveFilter,
} from "@/components/admin/admin-status-filter-options";
import { featureKeysToDisplayLabels } from "@/lib/admin/package-feature-options";
import { PackageFormDialog } from "@/components/admin/package-form-dialog";
import { PackageDuplicateButton } from "@/components/admin/package-duplicate-button";
import { DeleteButton } from "@/components/admin/simple-crud-actions";
import type { PlatformFeatureOption } from "@/lib/admin/package-feature-options";
import type { SerializedSubscriptionPackage } from "@/lib/serialize";

export function PackagesList({
  packages,
  tenantCounts,
  featureOptions,
  featureCatalog,
}: {
  packages: SerializedSubscriptionPackage[];
  tenantCounts: Record<string, number>;
  featureOptions: PlatformFeatureOption[];
  featureCatalog: { key: string; name: string }[];
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
    items: packages,
    searchPredicate: (p, q) =>
      textIncludes(p.name, q) ||
      textIncludes(p.description, q) ||
      textIncludes(p.billingCycle, q),
    filters: [
      {
        id: "status",
        match: (p, v) => matchesAdminActiveFilter(p.isActive, v),
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search package name..."
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
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          No packages match your search or filters.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {filtered.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{pkg.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <PackageFormDialog
                      pkg={pkg}
                      mode="edit"
                      featureOptions={featureOptions}
                      featureCatalog={featureCatalog}
                    />
                    <DeleteButton url={`/api/admin/packages/${pkg.id}`} />
                    <Badge variant={pkg.isActive ? "default" : "secondary"}>
                      {pkg.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{pkg.description}</CardDescription>
                <div className="text-3xl font-bold pt-2">
                  {formatCurrency(pkg.price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{pkg.billingCycle}
                  </span>
                </div>
                {pkg.yearlyPrice != null && pkg.yearlyPrice > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Yearly: {formatCurrency(pkg.yearlyPrice)}
                  </p>
                )}
                {pkg.isPopular && <Badge className="mt-1">Popular</Badge>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Users:</span>{" "}
                    {pkg.maxUsers}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Branches:</span>{" "}
                    {pkg.maxBranches}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Products:</span>{" "}
                    {pkg.maxProducts}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trial:</span>{" "}
                    {pkg.trialDays} days
                  </div>
                </div>
                <ul className="text-sm space-y-1">
                  {featureKeysToDisplayLabels(pkg.features, featureCatalog).map(
                    (f) => (
                      <li key={f}>✓ {f}</li>
                    )
                  )}
                </ul>
                <p className="text-xs text-muted-foreground">
                  {tenantCounts[pkg.id] ?? 0} tenants subscribed
                </p>
                <PackageDuplicateButton packageId={pkg.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminFilteredList>
  );
}

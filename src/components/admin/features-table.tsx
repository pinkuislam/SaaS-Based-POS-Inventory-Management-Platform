"use client";

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
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
import { FeatureFormDialog } from "@/components/admin/feature-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";
import {
  AdminFilteredList,
  AdminEmptyTableRow,
} from "@/components/admin/admin-filtered-list";
import { AdminFilterSelect } from "@/components/admin/admin-filter-select";
import {
  ADMIN_STATUS_FILTER_OPTIONS,
  matchesAdminActiveFilter,
} from "@/components/admin/admin-status-filter-options";
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import type { PlatformFeatureListItem } from "@/lib/admin/platform-features";

export function FeaturesTable({ features }: { features: PlatformFeatureListItem[] }) {
  const [editing, setEditing] = useState<PlatformFeatureListItem | null>(null);

  const modules = useMemo(
    () => [...new Set(features.map((f) => f.module))].sort(),
    [features]
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
    items: features,
    searchPredicate: (f, q) =>
      textIncludes(f.name, q) ||
      textIncludes(f.key, q) ||
      textIncludes(f.module, q) ||
      textIncludes(f.description, q),
    filters: [
      {
        id: "status",
        match: (f, v) => matchesAdminActiveFilter(f.isActive, v),
      },
      {
        id: "module",
        match: (f, v) => v === "all" || f.module === v,
      },
    ],
  });

  const moduleOptions = useMemo(
    () => [
      { value: "all", label: "All modules" },
      ...modules.map((m) => ({ value: m, label: m })),
    ],
    [modules]
  );

  return (
    <>
      <AdminFilteredList
        totalCount={totalCount}
        filteredCount={filteredCount}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, key, module..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={
          <>
            <AdminFilterSelect
              label="Module"
              value={filterValues.module ?? "all"}
              onValueChange={(v) => setFilter("module", v)}
              options={moduleOptions}
              className="w-[180px]"
            />
            <AdminFilterSelect
              label="Status"
              value={filterValues.status ?? "all"}
              onValueChange={(v) => setFilter("status", v)}
              options={[...ADMIN_STATUS_FILTER_OPTIONS]}
            />
          </>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <AdminEmptyTableRow colSpan={5} />
            ) : (
              filtered.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="font-mono text-xs">{f.key}</TableCell>
                  <TableCell>{f.module}</TableCell>
                  <TableCell>
                    <Badge variant={f.isActive ? "default" : "secondary"}>
                      {f.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${f.name}`}
                      onClick={() => setEditing(f)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DeleteButton url={`/api/admin/features/${f.id}`} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminFilteredList>

      {editing ? (
        <FeatureFormDialog
          feature={editing}
          mode="edit"
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

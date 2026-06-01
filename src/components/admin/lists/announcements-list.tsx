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
import { AnnouncementFormDialog } from "@/components/admin/announcement-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  targetType: string;
  status: string;
  publishedAt: string | null;
};

export function AnnouncementsList({ items }: { items: AnnouncementRow[] }) {
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
    items,
    searchPredicate: (a, q) =>
      textIncludes(a.title, q) ||
      textIncludes(a.content, q) ||
      textIncludes(a.status, q),
    filters: [
      {
        id: "status",
        match: (a, v) => v === "all" || a.status === v,
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search title..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <AdminFilterSelect
          label="Status"
          value={filterValues.status ?? "all"}
          onValueChange={(v) => setFilter("status", v)}
          options={[
            { value: "all", label: "All status" },
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "scheduled", label: "Scheduled" },
          ]}
        />
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Published</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <AdminEmptyTableRow colSpan={4} />
          ) : (
            filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell>
                  <Badge>{a.status}</Badge>
                </TableCell>
                <TableCell>
                  {a.publishedAt ? formatDate(a.publishedAt) : "—"}
                </TableCell>
                <TableCell className="flex gap-1">
                  <AnnouncementFormDialog
                    announcement={{
                      id: a.id,
                      title: a.title,
                      content: a.content,
                      targetType: a.targetType,
                      status: a.status,
                    }}
                    mode="edit"
                  />
                  <DeleteButton url={`/api/admin/announcements/${a.id}`} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </AdminFilteredList>
  );
}

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
import { BroadcastFormDialog } from "@/components/admin/broadcast-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export type BroadcastRow = {
  id: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  sentAt: string | null;
};

export function BroadcastsList({ broadcasts }: { broadcasts: BroadcastRow[] }) {
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
    items: broadcasts,
    searchPredicate: (b, q) =>
      textIncludes(b.title, q) ||
      textIncludes(b.message, q) ||
      textIncludes(b.channel, q),
    filters: [
      {
        id: "status",
        match: (b, v) => v === "all" || b.status === v,
      },
      {
        id: "channel",
        match: (b, v) => v === "all" || b.channel === v,
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search title, message..."
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      filters={
        <>
          <AdminFilterSelect
            label="Status"
            value={filterValues.status ?? "all"}
            onValueChange={(v) => setFilter("status", v)}
            options={[
              { value: "all", label: "All status" },
              { value: "draft", label: "Draft" },
              { value: "sent", label: "Sent" },
              { value: "scheduled", label: "Scheduled" },
            ]}
          />
          <AdminFilterSelect
            label="Channel"
            value={filterValues.channel ?? "all"}
            onValueChange={(v) => setFilter("channel", v)}
            options={[
              { value: "all", label: "All channels" },
              { value: "in_app", label: "In-app" },
              { value: "email", label: "Email" },
            ]}
          />
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <AdminEmptyTableRow colSpan={5} />
          ) : (
            filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.title}</TableCell>
                <TableCell>{b.channel}</TableCell>
                <TableCell>
                  <Badge>{b.status}</Badge>
                </TableCell>
                <TableCell>
                  {b.sentAt ? formatDate(b.sentAt) : "—"}
                </TableCell>
                <TableCell className="flex gap-1">
                  <BroadcastFormDialog
                    broadcast={{
                      id: b.id,
                      title: b.title,
                      message: b.message,
                      status: b.status,
                    }}
                    mode="edit"
                  />
                  <DeleteButton url={`/api/admin/broadcasts/${b.id}`} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </AdminFilteredList>
  );
}

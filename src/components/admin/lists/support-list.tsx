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
import { formatDate } from "@/lib/utils";
import { useAdminListFilter, textIncludes } from "@/hooks/use-admin-list-filter";
import {
  AdminFilteredList,
  AdminEmptyTableRow,
} from "@/components/admin/admin-filtered-list";
import { AdminFilterSelect } from "@/components/admin/admin-filter-select";
import { TicketActions } from "@/components/admin/ticket-actions";

export type SupportTicketRow = {
  id: string;
  tenantName: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  createdAt: string;
};

export function SupportList({ tickets }: { tickets: SupportTicketRow[] }) {
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
    items: tickets,
    searchPredicate: (t, q) =>
      textIncludes(t.tenantName, q) ||
      textIncludes(t.subject, q) ||
      textIncludes(t.message, q),
    filters: [
      {
        id: "status",
        match: (t, v) => v === "all" || t.status === v,
      },
      {
        id: "priority",
        match: (t, v) => v === "all" || t.priority === v,
      },
    ],
  });

  return (
    <AdminFilteredList
      totalCount={totalCount}
      filteredCount={filteredCount}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search tenant, subject..."
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
              { value: "open", label: "Open" },
              { value: "in_progress", label: "In progress" },
              { value: "closed", label: "Closed" },
            ]}
          />
          <AdminFilterSelect
            label="Priority"
            value={filterValues.priority ?? "all"}
            onValueChange={(v) => setFilter("priority", v)}
            options={[
              { value: "all", label: "All priority" },
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "urgent", label: "Urgent" },
            ]}
          />
        </>
      }
    >
      {tickets.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No support tickets yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <AdminEmptyTableRow colSpan={6} />
            ) : (
              filtered.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.tenantName}</TableCell>
                  <TableCell>
                    <div>
                      <Link
                        href={`/admin/support/${ticket.id}`}
                        className="font-medium hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                        {ticket.message}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ticket.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{ticket.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/admin/support/${ticket.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                      <TicketActions
                        ticketId={ticket.id}
                        status={ticket.status}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </AdminFilteredList>
  );
}

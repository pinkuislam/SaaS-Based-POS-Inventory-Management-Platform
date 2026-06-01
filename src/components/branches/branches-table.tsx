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
import { BranchEditDialog } from "@/components/branches/branch-edit-dialog";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { Eye } from "lucide-react";
import type { BranchSettings } from "@/lib/branches";

export function BranchesTable({
  tenantSlug,
  branches,
}: {
  tenantSlug: string;
  branches: {
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    openingBalance: number | null;
    managerId: string | null;
    managerName: string | null;
    isMain: boolean;
    isActive: boolean;
    deletedAt: string | null;
    userCount: number;
    settings?: BranchSettings;
  }[];
}) {
  const base = tenantDashboardPath(tenantSlug, "/branches");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Manager</TableHead>
          <TableHead>Users</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {branches.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
              No branches found.
            </TableCell>
          </TableRow>
        ) : (
          branches.map((b) => (
            <TableRow key={b.id} className={b.deletedAt ? "opacity-60" : undefined}>
              <TableCell className="font-medium">
                <Link href={`${base}/${b.id}`} className="hover:underline">
                  {b.name}
                </Link>
                {b.isMain ? (
                  <Badge className="ml-2" variant="secondary">
                    Main
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell>{b.code || "—"}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {b.contactPerson || "—"}
                  {b.phone ? (
                    <div className="text-muted-foreground">{b.phone}</div>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{b.managerName || "—"}</TableCell>
              <TableCell>{b.userCount}</TableCell>
              <TableCell>
                {b.deletedAt ? (
                  <Badge variant="destructive">Deleted</Badge>
                ) : (
                  <Badge variant={b.isActive ? "default" : "secondary"}>
                    {b.isActive ? "Active" : "Archived"}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Link href={`${base}/${b.id}`}>
                    <Button variant="ghost" size="icon" title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <BranchEditDialog branch={b} />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

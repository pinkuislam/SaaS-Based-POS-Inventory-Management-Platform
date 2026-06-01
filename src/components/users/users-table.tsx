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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserEditDialog } from "@/components/users/user-edit-dialog";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { Eye } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

export function UsersTable({
  tenantSlug,
  users,
  roles,
  branches,
}: {
  tenantSlug: string;
  users: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    profileImage: string | null;
    roleId: string | null;
    branchId: string | null;
    isActive: boolean;
    deletedAt: string | null;
    roleName: string;
    branchName: string;
    extraPermissions: string[];
  }[];
  roles: Option[];
  branches: Option[];
}) {
  const base = tenantDashboardPath(tenantSlug, "/users");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
              No users found.
            </TableCell>
          </TableRow>
        ) : (
          users.map((u) => {
            const initials = u.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <TableRow
                key={u.id}
                className={u.deletedAt ? "opacity-60" : undefined}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {u.profileImage ? (
                        <AvatarImage src={u.profileImage} alt={u.name} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <Link
                      href={`${base}/${u.id}`}
                      className="font-medium hover:underline"
                    >
                      {u.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{u.roleName}</Badge>
                </TableCell>
                <TableCell>{u.branchName}</TableCell>
                <TableCell>
                  {u.deletedAt ? (
                    <Badge variant="destructive">Deleted</Badge>
                  ) : (
                    <Badge variant={u.isActive ? "default" : "secondary"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`${base}/${u.id}`}>
                      <Button variant="ghost" size="icon" title="View profile">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <UserEditDialog
                      user={u}
                      roles={roles}
                      branches={branches}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

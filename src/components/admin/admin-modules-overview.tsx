import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MODULES = [
  {
    name: "Tenants / Businesses",
    href: "/admin/tenants",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Subscription Packages",
    href: "/admin/packages",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Package Features",
    href: "/admin/features",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Tenant Subscriptions",
    href: "/admin/subscriptions",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Invoices",
    href: "/admin/invoices",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Admin Users",
    href: "/admin/users",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Admin Roles",
    href: "/admin/roles",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Permissions",
    href: "/admin/roles",
    create: true,
    view: true,
    update: true,
    delete: true,
    note: "Managed via Roles",
  },
  {
    name: "Support Tickets",
    href: "/admin/support",
    create: false,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Coupons / Discounts",
    href: "/admin/coupons",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Announcements",
    href: "/admin/announcements",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Notifications",
    href: "/admin/notifications",
    create: true,
    view: true,
    update: true,
    delete: true,
  },
  {
    name: "Platform Settings",
    href: "/admin/settings",
    create: true,
    view: true,
    update: true,
    delete: false,
  },
  {
    name: "API Credentials",
    href: "/admin/integrations",
    create: true,
    view: true,
    update: true,
    delete: true,
    note: "Payment & integration keys",
  },
  {
    name: "Tenant Databases",
    href: "/admin/databases",
    create: true,
    view: true,
    update: true,
    delete: true,
    note: "Provision & backups",
  },
  {
    name: "Activity Logs",
    href: "/admin/activity",
    create: false,
    view: true,
    update: false,
    delete: false,
    archive: true,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    create: false,
    view: true,
    update: false,
    delete: false,
    export: true,
  },
  {
    name: "Backups",
    href: "/admin/databases",
    create: true,
    view: true,
    update: false,
    delete: true,
    restore: true,
    note: "Under Databases",
  },
] as const;

function CrudBadge({ ok, label }: { ok: boolean; label?: string }) {
  if (!ok) {
    return (
      <span className="text-xs text-muted-foreground">{label || "—"}</span>
    );
  }
  return (
    <Badge variant="outline" className="text-xs font-normal">
      {label || "Yes"}
    </Badge>
  );
}

export function AdminModulesOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Super Admin CRUD Access</CardTitle>
        <p className="text-sm text-muted-foreground">
          Full platform module capabilities — click a module to open it
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead>Create</TableHead>
              <TableHead>View</TableHead>
              <TableHead>Update</TableHead>
              <TableHead>Delete</TableHead>
              <TableHead>Other</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULES.map((m) => (
              <TableRow key={m.name}>
                <TableCell>
                  <Link
                    href={m.href}
                    className="font-medium text-primary hover:underline"
                  >
                    {m.name}
                  </Link>
                  {"note" in m && m.note ? (
                    <p className="text-xs text-muted-foreground">{m.note}</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <CrudBadge ok={m.create} />
                </TableCell>
                <TableCell>
                  <CrudBadge ok={m.view} />
                </TableCell>
                <TableCell>
                  <CrudBadge ok={m.update} />
                </TableCell>
                <TableCell>
                  <CrudBadge
                    ok={"delete" in m ? m.delete : false}
                    label={
                      "archive" in m && m.archive
                        ? "Archive"
                        : undefined
                    }
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {"export" in m && m.export ? "Export" : null}
                  {"restore" in m && m.restore ? "Restore" : null}
                  {"archive" in m && m.archive ? "Archive only" : null}
                  {!("export" in m) && !("restore" in m) && !("archive" in m)
                    ? "—"
                    : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { REPORT_NAV_GROUPS } from "@/lib/report-types";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { useReportsFilter } from "@/components/reports/reports-filter-context";
import { LayoutGrid, Lock } from "lucide-react";

export function ReportsSidebar() {
  const pathname = usePathname();
  const { tenantSlug, advancedReports } = useReportsFilter();
  const base = tenantDashboardPath(tenantSlug, "/reports");
  const overviewHref = base;
  const overviewActive =
    pathname === overviewHref || pathname === `${overviewHref}/`;

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <nav className="flex flex-col gap-4 rounded-lg border bg-card p-3 text-sm">
        <Link
          href={overviewHref}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 font-medium transition-colors",
            overviewActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          Overview
        </Link>
        {REPORT_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const href = `${base}/${item.id}`;
                const locked = item.advanced && !advancedReports;
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        locked && "opacity-70"
                      )}
                    >
                      <span className="truncate">{item.label}</span>
                      {locked ? (
                        <Lock className="ml-auto h-3 w-3 shrink-0" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

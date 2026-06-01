"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REPORT_NAV_GROUPS } from "@/lib/report-types";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { useReportsFilter } from "@/components/reports/reports-filter-context";
import { Lock } from "lucide-react";

export function ReportsOverviewLinks() {
  const { tenantSlug, advancedReports } = useReportsFilter();
  const base = tenantDashboardPath(tenantSlug, "/reports");

  return (
    <div className="space-y-4">
      {REPORT_NAV_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{group.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const locked = item.advanced && !advancedReports;
                return (
                  <li key={item.id}>
                    <Link
                      href={`${base}/${item.id}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      {item.label}
                      {locked ? (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

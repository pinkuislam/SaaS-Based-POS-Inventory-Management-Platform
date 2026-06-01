"use client";

import { ReportsFilterProvider } from "@/components/reports/reports-filter-context";
import { ReportsSidebar } from "@/components/reports/reports-sidebar";
import type { ReportFilterOptions } from "@/components/reports/report-export";

export function ReportsShell({
  tenantSlug,
  filterOptions,
  advancedReports,
  children,
}: {
  tenantSlug: string;
  filterOptions: ReportFilterOptions;
  advancedReports: boolean;
  children: React.ReactNode;
}) {
  return (
    <ReportsFilterProvider
      value={{ tenantSlug, filterOptions, advancedReports }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <ReportsSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </ReportsFilterProvider>
  );
}

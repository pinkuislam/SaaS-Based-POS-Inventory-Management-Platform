"use client";

import { createContext, useContext } from "react";
import type { ReportFilterOptions } from "@/components/reports/report-export";

type ReportsFilterContextValue = {
  tenantSlug: string;
  filterOptions: ReportFilterOptions;
  advancedReports: boolean;
};

const ReportsFilterContext = createContext<ReportsFilterContextValue | null>(
  null
);

export function ReportsFilterProvider({
  value,
  children,
}: {
  value: ReportsFilterContextValue;
  children: React.ReactNode;
}) {
  return (
    <ReportsFilterContext.Provider value={value}>
      {children}
    </ReportsFilterContext.Provider>
  );
}

export function useReportsFilter() {
  const ctx = useContext(ReportsFilterContext);
  if (!ctx) {
    throw new Error("useReportsFilter must be used within ReportsFilterProvider");
  }
  return ctx;
}

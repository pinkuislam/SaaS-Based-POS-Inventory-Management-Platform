"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { reportDateSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileDown, Printer, RefreshCw, Lock } from "lucide-react";
import { z } from "zod";
import {
  DATE_RANGE_REPORTS,
  PRODUCT_FILTER_REPORTS,
  type ReportTypeId,
} from "@/lib/report-types";
import { useReportsFilter } from "@/components/reports/reports-filter-context";
import {
  downloadReportCsv,
  downloadReportExcel,
  downloadReportPdf,
  formatCellValue,
  printReport,
  type ReportPayload,
} from "@/lib/report-export-utils";
import { formatCurrency } from "@/lib/utils";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import Link from "next/link";
import { tenantDashboardPath } from "@/lib/tenant-path";

const reportFilterSchema = reportDateSchema.extend({
  branchId: z.string().optional(),
  userId: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  productId: z.string().optional(),
});

function buildQuery(
  reportType: string,
  from: string,
  to: string,
  filters: {
    branchId: string;
    userId: string;
    customerId: string;
    supplierId: string;
    productId: string;
  }
) {
  const params = new URLSearchParams({ type: reportType, from, to });
  if (filters.branchId) params.set("branchId", filters.branchId);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.customerId) params.set("customerId", filters.customerId);
  if (filters.supplierId) params.set("supplierId", filters.supplierId);
  if (filters.productId) params.set("productId", filters.productId);
  return params.toString();
}

function rowMatchesSearch(row: Record<string, unknown>, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return Object.values(row).some((v) =>
    formatCellValue(v).toLowerCase().includes(needle)
  );
}

export function ReportViewer({
  reportType,
  title,
  advanced,
}: {
  reportType: ReportTypeId;
  title: string;
  advanced?: boolean;
}) {
  const { filterOptions, advancedReports, tenantSlug } = useReportsFilter();
  const locked = advanced && !advancedReports;
  const showDateRange = DATE_RANGE_REPORTS.has(reportType);

  const defaultFrom = format(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    "yyyy-MM-dd"
  );
  const defaultTo = format(new Date(), "yyyy-MM-dd");

  const { values: form, setField, validate, fieldError: fe } = useValidatedForm(
    {
      from: defaultFrom,
      to: defaultTo,
      branchId: "all",
      userId: "all",
      customerId: "all",
      supplierId: "all",
      productId: "all",
    },
    reportFilterSchema
  );

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (locked) return;
    const data = validate();
    if (!data) return;

    setLoading(true);
    setLoadError(null);
    try {
      const qs = buildQuery(reportType, data.from, data.to, {
        branchId: data.branchId === "all" ? "" : data.branchId || "",
        userId: data.userId === "all" ? "" : data.userId || "",
        customerId: data.customerId === "all" ? "" : data.customerId || "",
        supplierId: data.supplierId === "all" ? "" : data.supplierId || "",
        productId: data.productId === "all" ? "" : data.productId || "",
      });
      const res = await fetch(`/api/reports/export?${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load report");
      setReport(json as ReportPayload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load report";
      setLoadError(msg);
      setReport(null);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }, [locked, reportType, validate]);

  useEffect(() => {
    if (!locked) void loadReport();
    // Load when report type changes; Apply button refreshes manually
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, locked]);

  const filteredRows = useMemo(() => {
    if (!report?.rows) return [];
    return report.rows.filter((row) =>
      rowMatchesSearch(row as Record<string, unknown>, search)
    );
  }, [report, search]);

  const headers =
    report && report.rows.length > 0 ? Object.keys(report.rows[0]) : [];

  const showBranchFilter = [
    "sales",
    "product_sales",
    "top_selling",
    "slow_moving",
    "category_sales",
    "user_sales",
    "branch_sales",
    "payment_methods",
    "tax",
    "returns",
    "sale_returns",
    "damaged_stock",
    "stock_movements",
    "daily_closing",
  ].includes(reportType);

  const showUserFilter = [
    "sales",
    "user_sales",
    "payment_methods",
    "returns",
    "sale_returns",
  ].includes(reportType);

  const showCustomerFilter = [
    "sales",
    "customer_due",
    "returns",
    "sale_returns",
    "payments",
  ].includes(reportType);

  const showSupplierFilter = [
    "purchases",
    "supplier_due",
    "purchase_returns",
    "payments",
  ].includes(reportType);

  const showProductFilter = PRODUCT_FILTER_REPORTS.has(reportType);

  async function handleExportPdf() {
    if (!report) return;
    setLoading(true);
    try {
      await downloadReportPdf(report, reportType, form.from, form.to);
    } catch {
      notify.error("PDF export failed");
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    if (!report) return;
    downloadReportCsv(report, reportType, form.from, form.to);
  }

  function handleExportExcel() {
    if (!report) return;
    downloadReportExcel(report, reportType, form.from, form.to);
  }

  function handlePrint() {
    if (!report) return;
    printReport(report, form.from, form.to);
  }

  if (locked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This report is part of the Advanced Reports package. Upgrade your
            subscription to unlock product-wise, category-wise, tax, dues, and
            more analytics.
          </p>
          <Link
            href={tenantDashboardPath(tenantSlug, "/subscription")}
            className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            View subscription
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">
          Search, filter, print, or export this report
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
        {showDateRange ? (
          <>
            <FormField label="From" htmlFor="from" error={fe("from")}>
              <FormInput
                id="from"
                type="date"
                className="w-[160px]"
                value={form.from}
                error={fe("from")}
                onChange={(e) => setField("from", e.target.value)}
              />
            </FormField>
            <FormField label="To" htmlFor="to" error={fe("to")}>
              <FormInput
                id="to"
                type="date"
                className="w-[160px]"
                value={form.to}
                error={fe("to")}
                onChange={(e) => setField("to", e.target.value)}
              />
            </FormField>
          </>
        ) : null}
        {showBranchFilter && (filterOptions.branches?.length ?? 0) > 0 ? (
          <FormSelect2
            label="Branch"
            options={[
              { value: "all", label: "All branches" },
              ...filterOptions.branches!.map((b) => ({
                value: b.id,
                label: b.name,
              })),
            ]}
            value={form.branchId}
            onChange={(v) => setField("branchId", v)}
            className="w-[160px]"
          />
        ) : null}
        {showUserFilter && (filterOptions.users?.length ?? 0) > 0 ? (
          <FormSelect2
            label="Cashier"
            options={[
              { value: "all", label: "All users" },
              ...filterOptions.users!.map((u) => ({
                value: u.id,
                label: u.name,
              })),
            ]}
            value={form.userId}
            onChange={(v) => setField("userId", v)}
            className="w-[160px]"
          />
        ) : null}
        {showCustomerFilter && (filterOptions.customers?.length ?? 0) > 0 ? (
          <FormSelect2
            label="Customer"
            options={[
              { value: "all", label: "All customers" },
              ...filterOptions.customers!.map((c) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
            value={form.customerId}
            onChange={(v) => setField("customerId", v)}
            className="w-[180px]"
          />
        ) : null}
        {showSupplierFilter && (filterOptions.suppliers?.length ?? 0) > 0 ? (
          <FormSelect2
            label="Supplier"
            options={[
              { value: "all", label: "All suppliers" },
              ...filterOptions.suppliers!.map((s) => ({
                value: s.id,
                label: s.name,
              })),
            ]}
            value={form.supplierId}
            onChange={(v) => setField("supplierId", v)}
            className="w-[180px]"
          />
        ) : null}
        {showProductFilter && (filterOptions.products?.length ?? 0) > 0 ? (
          <FormSelect2
            label="Product"
            options={[
              { value: "all", label: "All products" },
              ...filterOptions.products!.map((p) => ({
                value: p.id,
                label: p.name,
              })),
            ]}
            value={form.productId}
            onChange={(v) => setField("productId", v)}
            className="w-[200px]"
          />
        ) : null}
        <Button onClick={loadReport} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {loading ? "Loading..." : "Apply"}
        </Button>
        <Button onClick={handleExportPdf} disabled={loading || !report} variant="default">
          <FileDown className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={loading || !report}
        >
          CSV
        </Button>
        <Button
          variant="outline"
          onClick={handleExportExcel}
          disabled={loading || !report}
        >
          Excel
        </Button>
        <Button
          variant="outline"
          onClick={handlePrint}
          disabled={loading || !report}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {report ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{report.summary.count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(report.summary.total)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Report data</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search in report..."
          />
          <p className="mb-3 text-sm text-muted-foreground">
            Showing {filteredRows.length} of {report?.rows.length ?? 0} rows
          </p>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((h) => (
                    <TableHead key={h} className="capitalize whitespace-nowrap">
                      {h.replace(/_/g, " ")}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !report ? (
                  <TableRow>
                    <TableCell
                      colSpan={Math.max(headers.length, 1)}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Loading report...
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={Math.max(headers.length, 1)}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No rows match your search or filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => (
                        <TableCell key={h} className="whitespace-nowrap">
                          {formatCellValue((row as Record<string, unknown>)[h])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

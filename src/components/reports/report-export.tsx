"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { reportDateSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import { FileDown, Printer } from "lucide-react";
import { format } from "date-fns";
import { escapeCsvCell } from "@/lib/utils";
import { z } from "zod";

const DEFAULT_TYPES = [
  { id: "sales", label: "Sales" },
  { id: "purchases", label: "Purchases" },
  { id: "stock", label: "Stock" },
  { id: "profit", label: "Profit & Loss" },
];

const reportFilterSchema = reportDateSchema.extend({
  reportType: z.string().min(1, "Select report type"),
  branchId: z.string().optional(),
  userId: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
});

export type ReportFilterOptions = {
  branches?: { id: string; name: string }[];
  users?: { id: string; name: string }[];
  customers?: { id: string; name: string }[];
  suppliers?: { id: string; name: string }[];
  products?: { id: string; name: string }[];
};

function buildQuery(
  reportType: string,
  from: string,
  to: string,
  filters: {
    branchId: string;
    userId: string;
    customerId: string;
    supplierId: string;
  }
) {
  const params = new URLSearchParams({ type: reportType, from, to });
  if (filters.branchId) params.set("branchId", filters.branchId);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.customerId) params.set("customerId", filters.customerId);
  if (filters.supplierId) params.set("supplierId", filters.supplierId);
  return params.toString();
}

export function ReportExport({
  reportTypes = DEFAULT_TYPES,
  filterOptions,
}: {
  reportTypes?: { id: string; label: string }[];
  filterOptions?: ReportFilterOptions;
}) {
  const [loading, setLoading] = useState(false);
  const defaultFrom = format(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    "yyyy-MM-dd"
  );
  const defaultTo = format(new Date(), "yyyy-MM-dd");

  const { values: form, setField, validate, fieldError: fe } = useValidatedForm(
    {
      reportType: reportTypes[0]?.id || "sales",
      from: defaultFrom,
      to: defaultTo,
      branchId: "all",
      userId: "all",
      customerId: "all",
      supplierId: "all",
    },
    reportFilterSchema
  );

  const filters = {
    branchId: form.branchId === "all" ? "" : form.branchId,
    userId: form.userId === "all" ? "" : form.userId,
    customerId: form.customerId === "all" ? "" : form.customerId,
    supplierId: form.supplierId === "all" ? "" : form.supplierId,
  };

  const reportTypeOptions = reportTypes.map((t) => ({
    value: t.id,
    label: t.label,
  }));

  async function fetchReportData() {
    const data = validate();
    if (!data) return null;
    const qs = buildQuery(data.reportType, data.from, data.to, {
      branchId: data.branchId === "all" ? "" : data.branchId || "",
      userId: data.userId === "all" ? "" : data.userId || "",
      customerId: data.customerId === "all" ? "" : data.customerId || "",
      supplierId: data.supplierId === "all" ? "" : data.supplierId || "",
    });
    const res = await fetch(`/api/reports/export?${qs}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to fetch report");
    return { data: json, reportType: data.reportType, from: data.from, to: data.to };
  }

  function downloadCsv(
    data: {
      title: string;
      rows: Record<string, unknown>[];
      summary: { count: number; total: number };
    },
    reportType: string,
    from: string,
    to: string
  ) {
    const rows = data.rows as Record<string, unknown>[];
    if (rows.length === 0) {
      notify.error("No data to export");
      return;
    }
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            const formatted =
              val instanceof Date ||
              (typeof val === "string" && val.includes("T"))
                ? format(new Date(val as string), "yyyy-MM-dd")
                : val;
            return escapeCsvCell(formatted);
          })
          .join(",")
      ),
      "",
      `"Total records","${data.summary.count}"`,
      `"Total","${data.summary.total}"`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-report-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success("CSV downloaded");
  }

  async function handleExportCsv() {
    setLoading(true);
    try {
      const result = await fetchReportData();
      if (!result) return;
      downloadCsv(result.data, result.reportType, result.from, result.to);
    } catch {
      notify.error("Export failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePrint() {
    setLoading(true);
    try {
      const result = await fetchReportData();
      if (!result) return;
      const { data, reportType, from, to } = result;
      const rows = data.rows as Record<string, unknown>[];
      const headers =
        rows.length > 0 ? Object.keys(rows[0]) : ["No data"];
      const html = `
        <html><head><title>${data.title}</title>
        <style>body{font-family:sans-serif;padding:24px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f5f5f5}</style>
        </head><body>
        <h1>${data.businessName || "InventoryPOS"}</h1>
        <h2>${data.title}</h2>
        <p>${from} — ${to}</p>
        <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
        <p><strong>Total records:</strong> ${data.summary.count} | <strong>Total:</strong> ${data.summary.total}</p>
        </body></html>`;
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
        w.print();
      }
    } catch {
      notify.error("Print failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setLoading(true);
    try {
      const result = await fetchReportData();
      if (!result) return;
      const { data, reportType, from, to } = result;

      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(16);
      doc.text(data.businessName || "InventoryPOS", pageWidth / 2, 15, {
        align: "center",
      });
      doc.setFontSize(12);
      doc.text(data.title, pageWidth / 2, 22, { align: "center" });
      doc.setFontSize(9);
      doc.text(
        `${format(new Date(data.from), "dd MMM yyyy")} — ${format(new Date(data.to), "dd MMM yyyy")}`,
        pageWidth / 2,
        28,
        { align: "center" }
      );

      const rows = data.rows as Record<string, unknown>[];
      if (rows.length === 0) {
        doc.text("No data for selected period.", 14, 40);
      } else {
        const headers = Object.keys(rows[0]);
        const body = rows.map((row) =>
          headers.map((h) => {
            const val = row[h];
            if (
              val instanceof Date ||
              (typeof val === "string" && val.includes("T"))
            ) {
              return format(new Date(val as string), "dd/MM/yyyy");
            }
            if (typeof val === "number") return val.toFixed(2);
            return String(val ?? "");
          })
        );

        autoTable(doc, {
          startY: 34,
          head: [headers.map((h) => h.charAt(0).toUpperCase() + h.slice(1))],
          body,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [30, 30, 30] },
        });

        const finalY =
          (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
            ?.finalY ?? 40;
        doc.setFontSize(10);
        doc.text(
          `Total records: ${data.summary.count} | Total: ৳${Number(data.summary.total).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`,
          14,
          finalY + 10
        );
      }

      doc.save(`${reportType}-report-${from}-${to}.pdf`);
      notify.success("PDF downloaded");
    } catch {
      notify.error("Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-muted/30">
      <FormSelect2
        label="Report type"
        options={reportTypeOptions}
        value={form.reportType}
        onChange={(v) => setField("reportType", v)}
        searchable={false}
        className="w-[160px]"
        error={fe("reportType")}
      />
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
      {(filterOptions?.branches?.length ?? 0) > 0 && (
        <FormSelect2
          label="Branch"
          options={[
            { value: "all", label: "All branches" },
            ...filterOptions!.branches!.map((b) => ({
              value: b.id,
              label: b.name,
            })),
          ]}
          value={form.branchId}
          onChange={(v) => setField("branchId", v)}
          className="w-[160px]"
        />
      )}
      {(filterOptions?.users?.length ?? 0) > 0 && (
        <FormSelect2
          label="Cashier"
          options={[
            { value: "all", label: "All users" },
            ...filterOptions!.users!.map((u) => ({
              value: u.id,
              label: u.name,
            })),
          ]}
          value={form.userId}
          onChange={(v) => setField("userId", v)}
          className="w-[160px]"
        />
      )}
      {(filterOptions?.customers?.length ?? 0) > 0 && (
        <FormSelect2
          label="Customer"
          options={[
            { value: "all", label: "All customers" },
            ...filterOptions!.customers!.map((c) => ({
              value: c.id,
              label: c.name,
            })),
          ]}
          value={form.customerId}
          onChange={(v) => setField("customerId", v)}
          className="w-[160px]"
        />
      )}
      {(filterOptions?.suppliers?.length ?? 0) > 0 && (
        <FormSelect2
          label="Supplier"
          options={[
            { value: "all", label: "All suppliers" },
            ...filterOptions!.suppliers!.map((s) => ({
              value: s.id,
              label: s.name,
            })),
          ]}
          value={form.supplierId}
          onChange={(v) => setField("supplierId", v)}
          className="w-[160px]"
        />
      )}
      <Button onClick={handleExport} disabled={loading}>
        <FileDown className="h-4 w-4 mr-2" />
        {loading ? "Exporting..." : "Export PDF"}
      </Button>
      <Button variant="outline" onClick={handleExportCsv} disabled={loading}>
        Export CSV
      </Button>
      <Button variant="outline" onClick={handlePrint} disabled={loading}>
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
    </div>
  );
}

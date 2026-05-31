"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown } from "lucide-react";
import { format } from "date-fns";
import { escapeCsvCell } from "@/lib/utils";

const DEFAULT_TYPES = [
  { id: "sales", label: "Sales" },
  { id: "purchases", label: "Purchases" },
  { id: "stock", label: "Stock" },
  { id: "profit", label: "Profit & Loss" },
];

export type ReportFilterOptions = {
  branches?: { id: string; name: string }[];
  users?: { id: string; name: string }[];
  customers?: { id: string; name: string }[];
  suppliers?: { id: string; name: string }[];
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
  const [reportType, setReportType] = useState(reportTypes[0]?.id || "sales");
  const [from, setFrom] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [branchId, setBranchId] = useState("all");
  const [userId, setUserId] = useState("all");
  const [customerId, setCustomerId] = useState("all");
  const [supplierId, setSupplierId] = useState("all");

  const filters = {
    branchId: branchId === "all" ? "" : branchId,
    userId: userId === "all" ? "" : userId,
    customerId: customerId === "all" ? "" : customerId,
    supplierId: supplierId === "all" ? "" : supplierId,
  };

  async function fetchReportData() {
    const qs = buildQuery(reportType, from, to, filters);
    const res = await fetch(`/api/reports/export?${qs}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch report");
    return data;
  }

  function downloadCsv(data: {
    title: string;
    rows: Record<string, unknown>[];
    summary: { count: number; total: number };
  }) {
    const rows = data.rows as Record<string, unknown>[];
    if (rows.length === 0) {
      toast.error("No data to export");
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
              val instanceof Date || (typeof val === "string" && val.includes("T"))
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
    toast.success("CSV downloaded");
  }

  async function handleExportCsv() {
    setLoading(true);
    try {
      const data = await fetchReportData();
      downloadCsv(data);
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setLoading(true);
    try {
      const data = await fetchReportData();

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
            if (val instanceof Date || (typeof val === "string" && val.includes("T"))) {
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
      toast.success("PDF downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-muted/30">
      <div className="space-y-2">
        <Label>Report type</Label>
        <Select value={reportType} onValueChange={(v) => v && setReportType(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reportTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>From</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-[160px]"
        />
      </div>
      <div className="space-y-2">
        <Label>To</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-[160px]"
        />
      </div>
      {(filterOptions?.branches?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <Label>Branch</Label>
          <Select value={branchId} onValueChange={(v) => setBranchId(v ?? "")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {filterOptions!.branches!.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {(filterOptions?.users?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <Label>Cashier</Label>
          <Select value={userId} onValueChange={(v) => setUserId(v ?? "")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {filterOptions!.users!.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {(filterOptions?.customers?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <Label>Customer</Label>
          <Select
            value={customerId}
            onValueChange={(v) => setCustomerId(v ?? "")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              {filterOptions!.customers!.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {(filterOptions?.suppliers?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Select
            value={supplierId}
            onValueChange={(v) => setSupplierId(v ?? "")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All suppliers</SelectItem>
              {filterOptions!.suppliers!.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button onClick={handleExport} disabled={loading}>
        <FileDown className="h-4 w-4 mr-2" />
        {loading ? "Exporting..." : "Export PDF"}
      </Button>
      <Button variant="outline" onClick={handleExportCsv} disabled={loading}>
        Export CSV
      </Button>
    </div>
  );
}

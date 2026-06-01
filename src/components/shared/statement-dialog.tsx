"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Printer } from "lucide-react";
import { formatCurrency, formatDate, escapeCsvCell } from "@/lib/utils";

type StatementData = {
  customer?: { name: string };
  supplier?: { name: string };
  openingBalance: number;
  totalSales?: number;
  totalPurchases?: number;
  totalPaid: number;
  totalDue: number;
  sales?: { invoiceNo: string; saleDate: string; total: number; dueAmount: number }[];
  purchases?: {
    invoiceNo: string;
    purchaseDate: string;
    total: number;
    dueAmount: number;
  }[];
  payments: { amount: number; paymentDate: string; method?: string | null }[];
};

export function StatementDialog({
  entityType,
  entityId,
  entityName,
}: {
  entityType: "customers" | "suppliers";
  entityId: string;
  entityName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StatementData | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/${entityType}/${entityId}/statement`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setOpen(true);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed to load statement");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!data) return;
    const lines: string[] = [];
    lines.push(`Statement,${entityName}`);
    lines.push(`Opening Balance,${data.openingBalance}`);
    if (data.sales) {
      lines.push("");
      lines.push("Sales");
      lines.push("Invoice,Date,Total,Due");
      for (const s of data.sales) {
        lines.push(
          [s.invoiceNo, s.saleDate, s.total, s.dueAmount]
            .map(escapeCsvCell)
            .join(",")
        );
      }
    }
    if (data.purchases) {
      lines.push("");
      lines.push("Purchases");
      lines.push("Invoice,Date,Total,Due");
      for (const p of data.purchases) {
        lines.push(
          [p.invoiceNo, p.purchaseDate, p.total, p.dueAmount]
            .map(escapeCsvCell)
            .join(",")
        );
      }
    }
    lines.push("");
    lines.push("Payments");
    lines.push("Date,Amount,Method");
    for (const p of data.payments) {
      lines.push(
        [p.paymentDate, p.amount, p.method || ""].map(escapeCsvCell).join(",")
      );
    }
    lines.push("");
    lines.push(`Total Due,${data.totalDue}`);

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement-${entityName.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success("CSV downloaded");
  }

  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              load();
            }}
            disabled={loading}
          />
        }
      >
        <FileText className="h-4 w-4 mr-1" />
        {loading ? "..." : "Statement"}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Statement — {entityName}</DialogTitle>
        </DialogHeader>
        {data && (
          <div className="space-y-4 statement-print-area">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                Opening: {formatCurrency(data.openingBalance)}
              </div>
              <div>Total paid: {formatCurrency(data.totalPaid)}</div>
              {data.totalSales !== undefined && (
                <div>Total sales: {formatCurrency(data.totalSales)}</div>
              )}
              {data.totalPurchases !== undefined && (
                <div>
                  Total purchases: {formatCurrency(data.totalPurchases)}
                </div>
              )}
              <div className="font-semibold col-span-2">
                Balance due: {formatCurrency(data.totalDue)}
              </div>
            </div>

            {data.sales && data.sales.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sales</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.sales.slice(0, 20).map((s, i) => (
                      <TableRow key={i}>
                        <TableCell>{s.invoiceNo}</TableCell>
                        <TableCell>{formatDate(s.saleDate)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(s.dueAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {data.purchases && data.purchases.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Purchases</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.purchases.slice(0, 20).map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{p.invoiceNo}</TableCell>
                        <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(p.dueAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={exportCsv}>
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

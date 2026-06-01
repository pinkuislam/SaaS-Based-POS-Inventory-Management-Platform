"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { FilterSelect } from "@/components/ui/filtered-list";
import { PaymentReverseDialog } from "@/components/payments/payment-reverse-dialog";

type PaymentRow = {
  id: string;
  type: "customer" | "supplier";
  partyName: string;
  amount: unknown;
  method: string;
  transactionRef: string | null;
  status: string;
  reference: string | null;
  paymentDate: string;
  notes: string | null;
};

export function PaymentsLedger() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  function loadRows() {
    setLoading(true);
    const q = typeFilter === "all" ? "" : `?type=${typeFilter}`;
    fetch(`/api/payments${q}`)
      .then((r) => r.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRows();
  }, [typeFilter]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading payments...</p>;
  }

  return (
    <div className="space-y-4">
      <FilterSelect
        label="Type"
        value={typeFilter}
        onValueChange={setTypeFilter}
        options={[
          { value: "all", label: "All payments" },
          { value: "customer", label: "Customer collections" },
          { value: "supplier", label: "Supplier payments" },
        ]}
        className="w-48"
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments recorded.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={`${p.type}-${p.id}`}>
                <TableCell>
                  <Badge variant="outline">{p.type}</Badge>
                </TableCell>
                <TableCell>{p.partyName}</TableCell>
                <TableCell>{formatCurrency(decimalToNumber(p.amount))}</TableCell>
                <TableCell>{p.method}</TableCell>
                <TableCell className="font-mono text-sm">
                  {p.transactionRef || p.reference || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={p.status === "reversed" ? "destructive" : "secondary"}
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(p.paymentDate)}</TableCell>
                <TableCell className="text-right">
                  {p.status === "completed" ? (
                    <PaymentReverseDialog
                      paymentId={p.id}
                      paymentType={p.type}
                      onSuccess={loadRows}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

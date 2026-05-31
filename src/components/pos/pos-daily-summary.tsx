"use client";

import { useEffect, useState } from "react";
import { formatCurrency, decimalToNumber } from "@/lib/utils";

export function PosDailySummary() {
  const [summary, setSummary] = useState({
    count: 0,
    total: 0,
    cash: 0,
    card: 0,
    mobile: 0,
  });

  useEffect(() => {
    fetch("/api/sales?today=1")
      .then((r) => r.json())
      .then((sales: { total: unknown; paymentMethod: string }[]) => {
        if (!Array.isArray(sales)) return;
        const total = sales.reduce(
          (s, sale) => s + decimalToNumber(sale.total),
          0
        );
        const cash = sales
          .filter((s) => s.paymentMethod === "cash")
          .reduce((s, sale) => s + decimalToNumber(sale.total), 0);
        const card = sales
          .filter((s) => s.paymentMethod === "card")
          .reduce((s, sale) => s + decimalToNumber(sale.total), 0);
        const mobile = sales
          .filter((s) => s.paymentMethod === "mobile")
          .reduce((s, sale) => s + decimalToNumber(sale.total), 0);
        setSummary({ count: sales.length, total, cash, card, mobile });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-sm">
      <div className="rounded-lg border bg-card p-2">
        <p className="text-muted-foreground text-xs">Today&apos;s Sales</p>
        <p className="font-bold">{summary.count}</p>
      </div>
      <div className="rounded-lg border bg-card p-2">
        <p className="text-muted-foreground text-xs">Total</p>
        <p className="font-bold">{formatCurrency(summary.total)}</p>
      </div>
      <div className="rounded-lg border bg-card p-2">
        <p className="text-muted-foreground text-xs">Cash</p>
        <p className="font-bold">{formatCurrency(summary.cash)}</p>
      </div>
      <div className="rounded-lg border bg-card p-2">
        <p className="text-muted-foreground text-xs">Card</p>
        <p className="font-bold">{formatCurrency(summary.card)}</p>
      </div>
      <div className="rounded-lg border bg-card p-2">
        <p className="text-muted-foreground text-xs">Mobile</p>
        <p className="font-bold">{formatCurrency(summary.mobile)}</p>
      </div>
    </div>
  );
}

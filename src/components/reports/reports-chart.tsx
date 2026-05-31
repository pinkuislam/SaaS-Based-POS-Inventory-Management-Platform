"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { decimalToNumber } from "@/lib/utils";

export function ReportsChart({
  sales,
}: {
  sales: { saleDate: Date; total: unknown }[];
}) {
  const grouped = sales.reduce(
    (acc, sale) => {
      const day = format(new Date(sale.saleDate), "MMM dd");
      acc[day] = (acc[day] || 0) + decimalToNumber(sale.total);
      return acc;
    },
    {} as Record<string, number>
  );

  const data = Object.entries(grouped).map(([date, amount]) => ({
    date,
    amount,
  }));

  if (data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No sales data for this month yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(v) => [`৳${Number(v).toLocaleString()}`, "Sales"]} />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

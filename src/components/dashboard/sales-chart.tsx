"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function SalesChart({
  data,
}: {
  data: { date: string; sales: number; purchases?: number; profit?: number }[];
}) {
  const hasPurchases = data.some((d) => d.purchases !== undefined);
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          formatter={(value, name) => [
            `৳${Number(value).toLocaleString()}`,
            String(name),
          ]}
        />
        <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        {hasPurchases && (
          <Bar
            dataKey="purchases"
            fill="hsl(var(--muted-foreground))"
            radius={[4, 4, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DashboardChartPoint } from "@/lib/dashboard-stats";

function formatTooltip(value: number | string) {
  return `৳${Number(value).toLocaleString()}`;
}

export function DashboardSalesChart({ data }: { data: DashboardChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip formatter={(v) => [formatTooltip(v as number), "Sales"]} />
        <Bar dataKey="sales" name="Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DashboardPurchasesChart({
  data,
}: {
  data: DashboardChartPoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip formatter={(v) => [formatTooltip(v as number), "Purchases"]} />
        <Bar
          dataKey="purchases"
          name="Purchases"
          fill="hsl(var(--muted-foreground))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DashboardProfitChart({ data }: { data: DashboardChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip formatter={(v) => [formatTooltip(v as number), "Profit"]} />
        <Line
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke="hsl(142 76% 36%)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DashboardCombinedChart({
  data,
}: {
  data: DashboardChartPoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip formatter={(v, name) => [formatTooltip(v as number), String(name)]} />
        <Legend />
        <Bar dataKey="sales" name="Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar
          dataKey="purchases"
          name="Purchases"
          fill="hsl(var(--muted-foreground))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

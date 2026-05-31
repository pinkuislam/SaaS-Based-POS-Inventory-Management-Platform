"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { Building2, CreditCard, HeadphonesIcon, TrendingUp } from "lucide-react";

export function AdminReportsPanel() {
  const [overview, setOverview] = useState<Record<string, number> | null>(null);
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/reports?type=overview").then((r) => r.json()),
      fetch("/api/admin/reports?type=revenue").then((r) => r.json()),
    ]).then(([ov, rev]) => {
      setOverview(ov.overview);
      setRevenue(rev.revenue || []);
    });
  }, []);

  if (!overview) {
    return <p className="text-muted-foreground">Loading reports...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tenants" value={String(overview.tenantCount)} icon={Building2} />
        <StatCard title="Active Tenants" value={String(overview.activeTenants)} icon={Building2} />
        <StatCard title="Trial Subscriptions" value={String(overview.trialSubs)} icon={TrendingUp} />
        <StatCard title="Pending Payments" value={String(overview.pendingPayments)} icon={CreditCard} />
        <StatCard title="Expired Subs" value={String(overview.expiredSubs)} icon={CreditCard} />
        <StatCard title="Open Tickets" value={String(overview.openTickets)} icon={HeadphonesIcon} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Revenue (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenue} />
        </CardContent>
      </Card>
    </div>
  );
}

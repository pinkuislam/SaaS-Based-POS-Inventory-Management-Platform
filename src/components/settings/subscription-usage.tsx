"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type UsageData = {
  package: {
    name: string;
    maxUsers: number;
    maxBranches: number;
    maxProducts: number;
    maxCustomers: number;
    maxSuppliers: number;
    storageLimitMb: number;
  } | null;
  usage: {
    users: number;
    branches: number;
    products: number;
    customers: number;
    suppliers: number;
  };
};

function UsageRow({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used} / {max}
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}

export function SubscriptionUsage() {
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/tenant/usage")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data?.package) {
    return null;
  }

  const { package: pkg, usage } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Limits ({pkg.name})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageRow label="Users" used={usage.users} max={pkg.maxUsers} />
        <UsageRow label="Branches" used={usage.branches} max={pkg.maxBranches} />
        <UsageRow label="Products" used={usage.products} max={pkg.maxProducts} />
        <UsageRow label="Customers" used={usage.customers} max={pkg.maxCustomers} />
        <UsageRow label="Suppliers" used={usage.suppliers} max={pkg.maxSuppliers} />
        <p className="text-xs text-muted-foreground">
          Storage limit: {pkg.storageLimitMb} MB
        </p>
      </CardContent>
    </Card>
  );
}

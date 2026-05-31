import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, decimalToNumber } from "@/lib/utils";

export default async function PackagesPage() {
  const packages = await prisma.subscriptionPackage.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { tenants: true, subscriptions: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Packages</h1>
        <p className="text-muted-foreground">
          Manage SaaS pricing plans and feature limits
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{pkg.name}</CardTitle>
                <Badge variant={pkg.isActive ? "default" : "secondary"}>
                  {pkg.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>{pkg.description}</CardDescription>
              <div className="text-3xl font-bold pt-2">
                {formatCurrency(decimalToNumber(pkg.price))}
                <span className="text-sm font-normal text-muted-foreground">
                  /{pkg.billingCycle}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Users:</span>{" "}
                  {pkg.maxUsers}
                </div>
                <div>
                  <span className="text-muted-foreground">Branches:</span>{" "}
                  {pkg.maxBranches}
                </div>
                <div>
                  <span className="text-muted-foreground">Products:</span>{" "}
                  {pkg.maxProducts}
                </div>
                <div>
                  <span className="text-muted-foreground">Trial:</span>{" "}
                  {pkg.trialDays} days
                </div>
              </div>
              <ul className="text-sm space-y-1">
                {(pkg.features as string[]).map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                {pkg._count.tenants} tenants subscribed
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

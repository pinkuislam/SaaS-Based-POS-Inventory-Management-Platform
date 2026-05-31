import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { serializeSubscriptionPackage } from "@/lib/serialize";
import { PackageFormDialog } from "@/components/admin/package-form-dialog";

export default async function PackagesPage() {
  const rows = await prisma.subscriptionPackage.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { tenants: true, subscriptions: true } } },
  });

  const packages = rows.map(serializeSubscriptionPackage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Packages</h1>
          <p className="text-muted-foreground">
            Manage SaaS pricing plans and feature limits
          </p>
        </div>
        <PackageFormDialog />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {rows.map((row, index) => {
          const pkg = packages[index];
          return (
            <Card key={pkg.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{pkg.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <PackageFormDialog pkg={pkg} mode="edit" />
                    <Badge variant={pkg.isActive ? "default" : "secondary"}>
                      {pkg.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{pkg.description}</CardDescription>
                <div className="text-3xl font-bold pt-2">
                  {formatCurrency(pkg.price)}
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
                  {pkg.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  {row._count.tenants} tenants subscribed
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { serializeSubscriptionPackage } from "@/lib/serialize";
import {
  featureKeysToDisplayLabels,
  toPlatformFeatureOptions,
} from "@/lib/admin/package-feature-options";
import { PackageFormDialog } from "@/components/admin/package-form-dialog";
import { PackageDuplicateButton } from "@/components/admin/package-duplicate-button";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export default async function PackagesPage() {
  const [rows, platformFeatures] = await Promise.all([
    prisma.subscriptionPackage.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { tenants: true, subscriptions: true } } },
    }),
    prisma.platformFeature.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { key: true, name: true, module: true },
    }),
  ]);

  const packages = rows.map(serializeSubscriptionPackage);
  const featureOptions = toPlatformFeatureOptions(platformFeatures);
  const featureCatalog = platformFeatures.map((f) => ({
    key: f.key,
    name: f.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Packages</h1>
          <p className="text-muted-foreground">
            Manage SaaS pricing plans and feature limits
          </p>
        </div>
        <PackageFormDialog
          featureOptions={featureOptions}
          featureCatalog={featureCatalog}
        />
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
                    <PackageFormDialog
                      pkg={pkg}
                      mode="edit"
                      featureOptions={featureOptions}
                      featureCatalog={featureCatalog}
                    />
                    <DeleteButton url={`/api/admin/packages/${pkg.id}`} />
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
                {pkg.yearlyPrice != null && pkg.yearlyPrice > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Yearly: {formatCurrency(pkg.yearlyPrice)}
                  </p>
                )}
                {pkg.isPopular && (
                  <Badge className="mt-1">Popular</Badge>
                )}
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
                  {featureKeysToDisplayLabels(pkg.features, featureCatalog).map(
                    (f) => (
                      <li key={f}>✓ {f}</li>
                    )
                  )}
                </ul>
                <p className="text-xs text-muted-foreground">
                  {row._count.tenants} tenants subscribed
                </p>
                <PackageDuplicateButton packageId={pkg.id} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

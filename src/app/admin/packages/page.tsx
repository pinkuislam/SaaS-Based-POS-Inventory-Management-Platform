import { prisma } from "@/lib/prisma";
import { serializeSubscriptionPackage } from "@/lib/serialize";
import { getActivePlatformFeaturesForPackages } from "@/lib/admin/platform-features";
import { toPlatformFeatureOptions } from "@/lib/admin/package-feature-options";
import { PackageFormDialog } from "@/components/admin/package-form-dialog";
import { PackagesList } from "@/components/admin/lists/packages-list";

export default async function PackagesPage() {
  const [rows, platformFeatures] = await Promise.all([
    prisma.subscriptionPackage.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { tenants: true, subscriptions: true } } },
    }),
    getActivePlatformFeaturesForPackages(),
  ]);

  const packages = rows.map(serializeSubscriptionPackage);
  const tenantCounts = Object.fromEntries(
    rows.map((r) => [r.id, r._count.tenants])
  );
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

      <PackagesList
        packages={packages}
        tenantCounts={tenantCounts}
        featureOptions={featureOptions}
        featureCatalog={featureCatalog}
      />
    </div>
  );
}

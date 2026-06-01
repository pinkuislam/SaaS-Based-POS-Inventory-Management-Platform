import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { serializeSubscription } from "@/lib/serialize";
import { SubscriptionFormDialog } from "@/components/admin/subscription-form-dialog";
import { SubscriptionsList } from "@/components/admin/lists/subscriptions-list";

export default async function SubscriptionsPage() {
  const [subscriptions, tenants, packages] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: { tenant: true, package: true },
    }),
    prisma.tenant.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const rows = subscriptions.map((sub) => ({
    ...serializeSubscription(sub),
    tenantName: sub.tenant.name,
    packageName: sub.package.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">All tenant subscription records</p>
        </div>
        <SubscriptionFormDialog tenants={tenants} packages={packages} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription List</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionsList
            subscriptions={rows}
            tenants={tenants}
            packages={packages}
          />
        </CardContent>
      </Card>
    </div>
  );
}

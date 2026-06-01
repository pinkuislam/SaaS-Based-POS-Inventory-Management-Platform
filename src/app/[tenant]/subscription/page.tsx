import { auth } from "@/auth";
import { getTenantWithSubscription } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionBilling } from "@/components/settings/subscription-billing";
import { SubscriptionUsage } from "@/components/settings/subscription-usage";
import {
  SubscriptionPackageFeatures,
  SubscriptionPaymentHistory,
  SubscriptionUpgradeRequest,
} from "@/components/settings/subscription-details";
import { StorageUsagePanel } from "@/components/settings/storage-usage-panel";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";

export default async function SubscriptionPage() {
  const session = await auth();
  const tenant = session?.user?.tenantId
    ? await getTenantWithSubscription(session.user.tenantId)
    : null;

  const sub = tenant?.subscriptions[0];
  const pkg = tenant?.package;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">
          Package details, usage limits, billing, and renewal
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>{pkg?.description || ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package</span>
              <span className="font-medium">{pkg?.name || "—"}</span>
            </div>
            {sub && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span>{formatDate(sub.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span>{formatDate(sub.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing cycle</span>
                  <span>{pkg?.billingCycle || "monthly"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge>{sub.status}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Renew Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <SubscriptionBilling
              packageName={pkg?.name || "—"}
              amount={
                sub
                  ? `${formatCurrency(decimalToNumber(sub.amount))}/mo`
                  : "—"
              }
              expires={sub ? formatDate(sub.endDate) : "—"}
              status={sub?.status || tenant?.status || "—"}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SubscriptionPackageFeatures
          packageInfo={
            pkg
              ? {
                  name: pkg.name,
                  description: pkg.description,
                  features: pkg.features,
                  billingCycle: pkg.billingCycle,
                  maxUsers: pkg.maxUsers,
                  maxBranches: pkg.maxBranches,
                  maxProducts: pkg.maxProducts,
                  storageLimitMb: pkg.storageLimitMb,
                }
              : null
          }
        />
        <SubscriptionPaymentHistory />
      </div>

      <SubscriptionUsage />
      <StorageUsagePanel />
      <SubscriptionUpgradeRequest />
    </div>
  );
}

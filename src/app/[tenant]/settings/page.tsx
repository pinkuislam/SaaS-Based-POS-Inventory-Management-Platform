import { auth } from "@/auth";
import { getTenantWithSubscription } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency, decimalToNumber } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await auth();
  const tenant = session?.user?.tenantId
    ? await getTenantWithSubscription(session.user.tenantId)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Business and account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Business Name</span>
              <span className="font-medium">{tenant?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono">{tenant?.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{tenant?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{tenant?.phone || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{tenant?.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package</span>
              <span className="font-medium">{tenant?.package?.name || "—"}</span>
            </div>
            {tenant?.subscriptions[0] && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span>
                    {formatDate(tenant.subscriptions[0].endDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>
                    {formatCurrency(
                      decimalToNumber(tenant.subscriptions[0].amount)
                    )}
                    /mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge>{tenant.subscriptions[0].status}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>POS Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure receipt format, tax rates, default payment method, and
              barcode scanner settings from this panel in future updates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

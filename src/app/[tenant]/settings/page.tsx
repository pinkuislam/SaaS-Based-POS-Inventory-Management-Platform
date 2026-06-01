import { auth } from "@/auth";
import { getTenantWithSubscription } from "@/lib/tenant";
import { getTenantSettings } from "@/lib/tenant-settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { Button } from "@/components/ui/button";
import { TenantProfileForm } from "@/components/settings/tenant-profile-form";
import { Store } from "lucide-react";
import { ApiKeysManager } from "@/components/settings/api-keys-manager";
import { TaxSettingsManager } from "@/components/settings/tax-settings-manager";
import { InvoiceSettingsForm } from "@/components/settings/invoice-settings-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { StorageUsagePanel } from "@/components/settings/storage-usage-panel";
import {
  NotificationPreferencesForm,
  StockAlertSettingsForm,
  ReturnPolicyForm,
  GeneralSettingsForm,
  SecuritySettingsPanel,
} from "@/components/settings/tenant-settings-panels";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const session = await auth();
  const tenant = session?.user?.tenantId
    ? await getTenantWithSubscription(session.user.tenantId)
    : null;
  const settings = tenant
    ? await getTenantSettings(tenant.id)
    : { pos: {}, loyalty: {} };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            POS, tax, invoice, security, and integrations
          </p>
        </div>
        <Link href={tenantDashboardPath(tenantSlug, "/profile")}>
          <Button variant="outline">
            <Store className="h-4 w-4 mr-2" />
            Business profile
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>POS & Loyalty</CardTitle>
            <CardDescription>
              Default tax rate, receipt footer, and loyalty program. Company
              name and contact are managed on the{" "}
              <Link
                href={tenantDashboardPath(tenantSlug, "/profile")}
                className="text-primary hover:underline"
              >
                Business Profile
              </Link>{" "}
              page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tenant && (
              <TenantProfileForm
                tenant={{
                  name: tenant.name,
                  phone: tenant.phone,
                  address: tenant.address,
                }}
                settings={settings}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package</span>
              <span className="font-medium">{tenant?.package?.name || "—"}</span>
            </div>
            {tenant?.subscriptions[0] && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span>{formatDate(tenant.subscriptions[0].endDate)}</span>
              </div>
            )}
            <Link href={tenantDashboardPath(tenantSlug, "/subscription")}>
              <Button variant="outline" className="w-full mt-2">
                Manage Subscription
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono">{tenant?.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{tenant?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{tenant?.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>For external integrations and REST API v1</CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeysManager
              hasApiAccess={
                (tenant?.package?.moduleFlags as { api?: boolean })?.api !==
                false
              }
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Connect WooCommerce or Shopify to sync products, inventory, and orders.
            </p>
            <Link href={tenantDashboardPath(tenantSlug, "/integrations")}>
              <Button variant="outline">Open Integrations</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tax / VAT</CardTitle>
            <CardDescription>Configure tax rates for products and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <TaxSettingsManager
              initialTaxes={settings.taxes ?? []}
              tenantSlug={tenantSlug}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Invoice & Receipt Settings</CardTitle>
            <CardDescription>Prefix, layout, and print options</CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceSettingsForm
              invoice={settings.invoice ?? {}}
              businessPrefix={settings.business?.invoicePrefix}
              businessName={tenant?.name ?? "Your Business"}
              logoUrl={tenant?.logo ?? null}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <StorageUsagePanel />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Email and in-app alert preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesForm
              initial={settings.notifications ?? {}}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <StockAlertSettingsForm initial={settings.stock ?? {}} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Return policy</CardTitle>
          </CardHeader>
          <CardContent>
            <ReturnPolicyForm initial={settings.returnPolicy ?? {}} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Date format and payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            <GeneralSettingsForm initial={settings.general ?? {}} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Password, session preferences, users, and login logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ChangePasswordForm />
            <SecuritySettingsPanel
              initial={settings.security ?? {}}
              tenantSlug={tenantSlug}
            />
            <div className="flex flex-wrap gap-2">
              <Link href={tenantDashboardPath(tenantSlug, "/activity")}>
                <Button variant="outline">Activity & login logs</Button>
              </Link>
              <Link href={tenantDashboardPath(tenantSlug, "/users")}>
                <Button variant="outline">Manage users</Button>
              </Link>
              <Link href={tenantDashboardPath(tenantSlug, "/roles")}>
                <Button variant="outline">Roles & permissions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
